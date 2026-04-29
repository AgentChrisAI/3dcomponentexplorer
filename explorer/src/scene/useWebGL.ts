import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Repo } from '../types/manifest';
import {
  identity, multiply, perspective, lookAt,
  rotateX, rotateY, translate, scale, invert, transpose,
} from './matMath';
import { orbVS, orbFS, ringVS, ringFS, starVS, starFS } from './shaders';
import { buildSphere, buildRing, buildStarField } from './orbGeometry';

export interface SceneCallbacks {
  onOrbClick: (repo: Repo) => void;
  onOrbHover: (repo: Repo | null) => void;
  activeRepoIds?: string[];
}

const BRIGHTNESS: Record<string, number> = {
  primitives: 1.0,
  'styled-system': 0.92,
  enterprise: 0.85,
  utility: 0.78,
  framework: 0.95,
  collections: 0.70,
  other: 0.80,
};

// Ring config: [yaw-speed, pitch-base, radius-scale]
const RING_CFG = [
  { yawSpeed: 0.20, pitchBase: 0.00, rs: 1.0 },
  { yawSpeed: 0.13, pitchBase: 1.05, rs: 1.0 },
  { yawSpeed: 0.09, pitchBase: 2.09, rs: 1.0 },
] as const;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('Shader error:', gl.getShaderInfoLog(s));
  return s;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error('Link error:', gl.getProgramInfoLog(p));
  return p;
}

// Project a world point to NDC using the current VP matrix (column-major)
function projectToNDC(
  vp: Float32Array,
  wx: number, wy: number, wz: number,
): { nx: number; ny: number; behind: boolean } {
  const w = vp[3]*wx + vp[7]*wy + vp[11]*wz + vp[15];
  if (w <= 0) return { nx: 0, ny: 0, behind: true };
  const nx = (vp[0]*wx + vp[4]*wy + vp[8]*wz  + vp[12]) / w;
  const ny = (vp[1]*wx + vp[5]*wy + vp[9]*wz  + vp[13]) / w;
  return { nx, ny, behind: false };
}

function pickRepo(
  repos: Repo[],
  vp: Float32Array,
  rect: DOMRect,
  clientX: number,
  clientY: number,
): Repo | null {
  const mx =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  const my = -(((clientY - rect.top)  / rect.height) * 2 - 1);
  let best: Repo | null = null;
  let bestDist = 0.08; // NDC threshold
  for (const repo of repos) {
    const [px, py, pz] = repo.orbPosition;
    const { nx, ny, behind } = projectToNDC(vp, px, py, pz);
    if (behind) continue;
    const d = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
    if (d < bestDist) { bestDist = d; best = repo; }
  }
  return best;
}

export function useWebGL(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  repos: Repo[],
  callbacks: SceneCallbacks,
): void {
  // Keep callbacks stable across renders without restarting the GL loop
  const cbRef = useRef<SceneCallbacks>(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    const rawCanvas = canvasRef.current;
    if (!rawCanvas || repos.length === 0) return;
    // Assign to new consts AFTER null-guard so TypeScript infers non-null types,
    // preserving them into nested function closures (known TS narrowing limitation).
    const canvas = rawCanvas;

    const rawGl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!rawGl) { console.error('WebGL2 not supported'); return; }
    const gl = rawGl;

    // ── Programs ──────────────────────────────────────────────────────────
    const orbProg  = link(gl, orbVS,  orbFS);
    const ringProg = link(gl, ringVS, ringFS);
    const starProg = link(gl, starVS, starFS);

    // Cache uniform locations (queried once, not per frame)
    const orbU = {
      uMVP:      gl.getUniformLocation(orbProg,  'uMVP')!,
      uModel:    gl.getUniformLocation(orbProg,  'uModel')!,
      uNormal:   gl.getUniformLocation(orbProg,  'uNormal')!,
      uTime:     gl.getUniformLocation(orbProg,  'uTime')!,
      uColor:    gl.getUniformLocation(orbProg,  'uColor')!,
      uOpacity:  gl.getUniformLocation(orbProg,  'uOpacity')!,
      uCameraPos:gl.getUniformLocation(orbProg,  'uCameraPos')!,
    };
    const ringU = {
      uMVP:    gl.getUniformLocation(ringProg, 'uMVP')!,
      uOpacity:gl.getUniformLocation(ringProg, 'uOpacity')!,
    };
    const starU = {
      uMVP: gl.getUniformLocation(starProg, 'uMVP')!,
    };

    // ── Geometry ──────────────────────────────────────────────────────────
    const sphere = buildSphere(22, 22);
    const ring   = buildRing(56, 1.5, 0.007);
    const stars  = buildStarField(600, 50);

    function buf(data: Float32Array | Uint16Array, target: number): WebGLBuffer {
      const b = gl.createBuffer()!;
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, gl.STATIC_DRAW);
      return b;
    }

    const bSpherePos  = buf(sphere.positions, gl.ARRAY_BUFFER);
    const bSphereNorm = buf(sphere.normals,   gl.ARRAY_BUFFER);
    const bSphereIdx  = buf(sphere.indices,   gl.ELEMENT_ARRAY_BUFFER);
    const bRingPos    = buf(ring.positions,   gl.ARRAY_BUFFER);
    const bRingIdx    = buf(ring.indices,     gl.ELEMENT_ARRAY_BUFFER);
    const bStarPos    = buf(stars.positions,  gl.ARRAY_BUFFER);
    const bStarSize   = buf(stars.sizes,      gl.ARRAY_BUFFER);

    // ── VAOs ──────────────────────────────────────────────────────────────
    function makeVAO(setup: () => void): WebGLVertexArrayObject {
      const v = gl.createVertexArray()!;
      gl.bindVertexArray(v);
      setup();
      gl.bindVertexArray(null);
      return v;
    }

    const vaoOrb = makeVAO(() => {
      const aPos  = gl.getAttribLocation(orbProg, 'aPosition');
      const aNorm = gl.getAttribLocation(orbProg, 'aNormal');
      gl.bindBuffer(gl.ARRAY_BUFFER, bSpherePos);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bSphereNorm);
      gl.enableVertexAttribArray(aNorm);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bSphereIdx);
    });

    const vaoRing = makeVAO(() => {
      const aPos = gl.getAttribLocation(ringProg, 'aPosition');
      gl.bindBuffer(gl.ARRAY_BUFFER, bRingPos);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bRingIdx);
    });

    const vaoStar = makeVAO(() => {
      const aPos  = gl.getAttribLocation(starProg, 'aPosition');
      const aSize = gl.getAttribLocation(starProg, 'aSize');
      gl.bindBuffer(gl.ARRAY_BUFFER, bStarPos);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bStarSize);
      gl.enableVertexAttribArray(aSize);
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);
    });

    // ── Camera state ──────────────────────────────────────────────────────
    let yaw = 0.3, pitch = 0.25, dist = 22;
    let dragging = false, dragStartX = 0, dragStartY = 0;
    let lastMoveX = 0, lastMoveY = 0;
    let prevHovered: Repo | null = null;

    function eyePos(): [number, number, number] {
      const cosPitch = Math.cos(pitch);
      return [
        dist * cosPitch * Math.sin(yaw),
        dist * Math.sin(pitch),
        dist * cosPitch * Math.cos(yaw),
      ];
    }

    function getVP(w: number, h: number): Float32Array {
      const eye  = eyePos();
      const proj = perspective(Math.PI / 4, w / h, 0.1, 120);
      const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
      return multiply(proj, view);
    }

    // ── Mouse handlers ────────────────────────────────────────────────────
    const onDown = (e: MouseEvent) => {
      dragging = true;
      dragStartX = lastMoveX = e.clientX;
      dragStartY = lastMoveY = e.clientY;
    };

    const onUp = (e: MouseEvent) => {
      dragging = false;
      // Treat as click if barely moved
      const moved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
      if (moved < 4) {
        const rect = canvas.getBoundingClientRect();
        const vp   = getVP(rect.width, rect.height);
        const hit  = pickRepo(repos, vp, rect, e.clientX, e.clientY);
        if (hit) cbRef.current.onOrbClick(hit);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - lastMoveX;
        const dy = e.clientY - lastMoveY;
        yaw   += dx * 0.005;
        pitch  = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.005));
        lastMoveX = e.clientX;
        lastMoveY = e.clientY;
      } else {
        // Hover detection
        const rect = canvas.getBoundingClientRect();
        const vp   = getVP(rect.width, rect.height);
        const hit  = pickRepo(repos, vp, rect, e.clientX, e.clientY);
        if (hit !== prevHovered) {
          prevHovered = hit;
          cbRef.current.onOrbHover(hit);
          canvas.style.cursor = hit ? 'pointer' : 'default';
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dist = Math.max(4, Math.min(60, dist + e.deltaY * 0.03));
    };

    const onLeave = () => {
      if (prevHovered) {
        prevHovered = null;
        cbRef.current.onOrbHover(null);
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup',   onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave',onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // ── Render loop ───────────────────────────────────────────────────────
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    const normalMat3 = new Float32Array(9); // computed per orb

    let rafId = 0;
    const t0 = performance.now();

    function render() {
      rafId = requestAnimationFrame(render);

      // Sync canvas size to CSS
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw;
        canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const time = (performance.now() - t0) / 1000;
      const eye  = eyePos();
      const vp   = getVP(cw, ch);

      // Active set
      const activeIds = cbRef.current.activeRepoIds;
      const hasFilter = activeIds && activeIds.length > 0;
      const activeSet = hasFilter ? new Set(activeIds) : null;

      // ── Stars (depthMask off — pure background) ────────────────────────
      gl.depthMask(false);
      gl.useProgram(starProg);
      gl.bindVertexArray(vaoStar);
      gl.uniformMatrix4fv(starU.uMVP, false, vp);
      gl.drawArrays(gl.POINTS, 0, 600);

      // ── Orbs ──────────────────────────────────────────────────────────
      gl.depthMask(true);
      gl.useProgram(orbProg);
      gl.uniform1f(orbU.uTime, time);
      gl.uniform3f(orbU.uCameraPos, eye[0], eye[1], eye[2]);

      for (const repo of repos) {
        const opacity = !activeSet || activeSet.has(repo.id) ? 1.0 : 0.08;
        const b = BRIGHTNESS[repo.category] ?? 0.80;

        const s = Math.max(0.01, repo.orbSize) * 0.5;
        const model = scale(
          translate(identity(), repo.orbPosition),
          s,
        );
        const mvp = multiply(vp, model);

        // Normal matrix: upper-left 3x3 of transpose(invert(model))
        const ti = transpose(invert(model));
        normalMat3[0]=ti[0]; normalMat3[1]=ti[1]; normalMat3[2]=ti[2];
        normalMat3[3]=ti[4]; normalMat3[4]=ti[5]; normalMat3[5]=ti[6];
        normalMat3[6]=ti[8]; normalMat3[7]=ti[9]; normalMat3[8]=ti[10];

        gl.bindVertexArray(vaoOrb);
        gl.uniformMatrix4fv(orbU.uMVP,    false, mvp);
        gl.uniformMatrix4fv(orbU.uModel,  false, model);
        gl.uniformMatrix3fv(orbU.uNormal, false, normalMat3);
        gl.uniform3f(orbU.uColor,   b, b, b);
        gl.uniform1f(orbU.uOpacity, opacity);
        gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

        // ── Rings for this orb ─────────────────────────────────────────
        gl.depthMask(false);
        gl.useProgram(ringProg);
        gl.bindVertexArray(vaoRing);
        gl.uniform1f(ringU.uOpacity, opacity);

        for (const cfg of RING_CFG) {
          const ringModel = rotateX(
            rotateY(
              translate(identity(), repo.orbPosition),
              time * cfg.yawSpeed,
            ),
            cfg.pitchBase + time * 0.08,
          );
          // Scale ring by orb size
          const scaledRingModel = scale(ringModel, s);
          const ringMVP = multiply(vp, scaledRingModel);
          gl.uniformMatrix4fv(ringU.uMVP, false, ringMVP);
          gl.drawElements(gl.TRIANGLES, ring.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        gl.depthMask(true);
        gl.useProgram(orbProg);
        gl.uniform1f(orbU.uTime, time);
        gl.uniform3f(orbU.uCameraPos, eye[0], eye[1], eye[2]);
      }

      gl.bindVertexArray(null);
    }

    render();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousedown',  onDown);
      canvas.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('wheel',      onWheel);

      gl.deleteProgram(orbProg);
      gl.deleteProgram(ringProg);
      gl.deleteProgram(starProg);
      gl.deleteVertexArray(vaoOrb);
      gl.deleteVertexArray(vaoRing);
      gl.deleteVertexArray(vaoStar);
      for (const b of [bSpherePos, bSphereNorm, bSphereIdx, bRingPos, bRingIdx,
                        bStarPos, bStarSize]) {
        gl.deleteBuffer(b);
      }
    };
  // repos is the only real dep — callbacks are tracked via cbRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, repos]);
}
