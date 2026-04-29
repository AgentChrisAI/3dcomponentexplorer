import { useEffect, useRef, useCallback } from 'react';
import * as mat from './matMath';
import { orbVS, orbFS, ringVS, ringFS, starVS, starFS } from './shaders';
import { buildSphere, buildRing, buildStarField } from './orbGeometry';

interface Repo {
  id: string;
  name: string;
  orbPosition: [number, number, number];
  orbSize: number;
  category: string;
  components: any[];
}

interface Callbacks {
  onOrbClick: (repo: Repo) => void;
  onOrbHover: (repo: Repo | null) => void;
  activeRepoIds?: string[];
}

const CAT_BRIGHTNESS: Record<string, number> = {
  primitives: 1.0, 'styled-system': 0.92, enterprise: 0.85,
  utility: 0.78, framework: 0.95, collections: 0.70, other: 0.80,
};

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(p));
  }
  return p;
}

export function useWebGL(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  repos: Repo[],
  callbacks: Callbacks
) {
  const camRef = useRef({ yaw: 0, pitch: 0.3, dist: 12, dragging: false, lastX: 0, lastY: 0 });
  const hoveredRef = useRef<Repo | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const getEye = useCallback(() => {
    const c = camRef.current;
    return [
      c.dist * Math.sin(c.yaw) * Math.cos(c.pitch),
      c.dist * Math.sin(c.pitch),
      c.dist * Math.cos(c.yaw) * Math.cos(c.pitch),
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || repos.length === 0) return;

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!gl) { console.error('No WebGL2'); return; }

    // Programs
    const orbProg = createProgram(gl, orbVS, orbFS);
    const ringProg = createProgram(gl, ringVS, ringFS);
    const starProg = createProgram(gl, starVS, starFS);

    // Geometry
    const sphere = buildSphere(20, 20);
    const ring = buildRing(48, 1.5, 0.008);
    const stars = buildStarField(600, 50);

    // Sphere buffers
    const sPos = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, sPos); gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
    const sNorm = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, sNorm); gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
    const sIdx = gl.createBuffer()!; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    // Ring buffers
    const rPos = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, rPos); gl.bufferData(gl.ARRAY_BUFFER, ring.positions, gl.STATIC_DRAW);
    const rIdx = gl.createBuffer()!; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ring.indices, gl.STATIC_DRAW);

    // Star buffers
    const stPos = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, stPos); gl.bufferData(gl.ARRAY_BUFFER, stars.positions, gl.STATIC_DRAW);
    const stSize = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, stSize); gl.bufferData(gl.ARRAY_BUFFER, stars.sizes, gl.STATIC_DRAW);

    // Orb VAO
    const orbVAO = gl.createVertexArray()!;
    gl.bindVertexArray(orbVAO);
    const aPosLoc = gl.getAttribLocation(orbProg, 'aPosition');
    const aNormLoc = gl.getAttribLocation(orbProg, 'aNormal');
    gl.bindBuffer(gl.ARRAY_BUFFER, sPos); gl.enableVertexAttribArray(aPosLoc); gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sNorm); gl.enableVertexAttribArray(aNormLoc); gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIdx);
    gl.bindVertexArray(null);

    // Ring VAO
    const ringVAO = gl.createVertexArray()!;
    gl.bindVertexArray(ringVAO);
    const rPosLoc = gl.getAttribLocation(ringProg, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, rPos); gl.enableVertexAttribArray(rPosLoc); gl.vertexAttribPointer(rPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rIdx);
    gl.bindVertexArray(null);

    // Star VAO
    const starVAO = gl.createVertexArray()!;
    gl.bindVertexArray(starVAO);
    const stPosLoc = gl.getAttribLocation(starProg, 'aPosition');
    const stSizeLoc = gl.getAttribLocation(starProg, 'aSize');
    gl.bindBuffer(gl.ARRAY_BUFFER, stPos); gl.enableVertexAttribArray(stPosLoc); gl.vertexAttribPointer(stPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, stSize); gl.enableVertexAttribArray(stSizeLoc); gl.vertexAttribPointer(stSizeLoc, 1, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    let animId = 0;
    const startTime = performance.now();

    function render() {
      const w = canvas!.clientWidth; const h = canvas!.clientHeight;
      if (canvas!.width !== w || canvas!.height !== h) { canvas!.width = w; canvas!.height = h; }
      gl!.viewport(0, 0, w, h);
      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

      const time = (performance.now() - startTime) / 1000;
      const eye = getEye();
      const proj = mat.perspective(Math.PI / 4, w / h, 0.1, 100);
      const view = mat.lookAt(eye, [0, 0, 0], [0, 1, 0]);
      const vp = mat.multiply(proj, view);

      // Stars
      gl!.useProgram(starProg);
      gl!.bindVertexArray(starVAO);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(starProg, 'uMVP'), false, vp);
      gl!.drawArrays(gl!.POINTS, 0, 600);

      // Orbs
      gl!.useProgram(orbProg);
      gl!.uniform1f(gl!.getUniformLocation(orbProg, 'uTime'), time);
      gl!.uniform3fv(gl!.getUniformLocation(orbProg, 'uCameraPos'), new Float32Array(eye));

      const active = callbacks.activeRepoIds;

      for (const repo of repos) {
        const isActive = !active || active.length === 0 || active.includes(repo.id);
        const opacity = isActive ? 1.0 : 0.08;
        const b = CAT_BRIGHTNESS[repo.category] ?? 0.8;

        const model = mat.scale(
          mat.translate(mat.identity(), repo.orbPosition),
          repo.orbSize * 0.4
        );
        const mvp = mat.multiply(vp, model);
        const normalMat = new Float32Array(9);
        const inv = mat.invert(model);
        const t = mat.transpose(inv);
        normalMat[0]=t[0]; normalMat[1]=t[1]; normalMat[2]=t[2];
        normalMat[3]=t[4]; normalMat[4]=t[5]; normalMat[5]=t[6];
        normalMat[6]=t[8]; normalMat[7]=t[9]; normalMat[8]=t[10];

        gl!.bindVertexArray(orbVAO);
        gl!.uniformMatrix4fv(gl!.getUniformLocation(orbProg, 'uMVP'), false, mvp);
        gl!.uniformMatrix4fv(gl!.getUniformLocation(orbProg, 'uModel'), false, model);
        gl!.uniformMatrix3fv(gl!.getUniformLocation(orbProg, 'uNormal'), false, normalMat);
        gl!.uniform3f(gl!.getUniformLocation(orbProg, 'uColor'), b, b, b);
        gl!.uniform1f(gl!.getUniformLocation(orbProg, 'uOpacity'), opacity);
        gl!.drawElements(gl!.TRIANGLES, sphere.indices.length, gl!.UNSIGNED_SHORT, 0);

        // 3 rings per orb
        gl!.useProgram(ringProg);
        for (let ri = 0; ri < 3; ri++) {
          const ringModel = mat.rotateX(
            mat.rotateY(
              mat.translate(mat.identity(), repo.orbPosition),
              time * 0.3 + ri * 2.09
            ),
            ri * 1.05 + time * 0.15
          );
          const ringMvp = mat.multiply(vp, ringModel);
          gl!.bindVertexArray(ringVAO);
          gl!.uniformMatrix4fv(gl!.getUniformLocation(ringProg, 'uMVP'), false, ringMvp);
          gl!.uniform1f(gl!.getUniformLocation(ringProg, 'uOpacity'), opacity);
          gl!.drawElements(gl!.TRIANGLES, ring.indices.length, gl!.UNSIGNED_SHORT, 0);
        }
        gl!.useProgram(orbProg);
      }

      animId = requestAnimationFrame(render);
    }

    // Mouse events
    const onDown = (e: MouseEvent) => { camRef.current.dragging = true; camRef.current.lastX = e.clientX; camRef.current.lastY = e.clientY; };
    const onUp = () => { camRef.current.dragging = false; };
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!camRef.current.dragging) return;
      const dx = e.clientX - camRef.current.lastX;
      const dy = e.clientY - camRef.current.lastY;
      camRef.current.yaw += dx * 0.005;
      camRef.current.pitch = Math.max(-1.2, Math.min(1.2, camRef.current.pitch + dy * 0.005));
      camRef.current.lastX = e.clientX;
      camRef.current.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camRef.current.dist = Math.max(3, Math.min(30, camRef.current.dist + e.deltaY * 0.01));
    };
    const onClick = (e: MouseEvent) => {
      // Simple raycast: project each orb center to screen, find closest to mouse
      const rect = canvas!.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const eye = getEye();
      const proj = mat.perspective(Math.PI / 4, rect.width / rect.height, 0.1, 100);
      const view = mat.lookAt(eye, [0, 0, 0], [0, 1, 0]);
      const vp = mat.multiply(proj, view);

      let closest: Repo | null = null;
      let closestDist = 0.06; // threshold in NDC

      for (const repo of repos) {
        const p = repo.orbPosition;
        const clip = new Float32Array(4);
        clip[0] = vp[0]*p[0] + vp[4]*p[1] + vp[8]*p[2] + vp[12];
        clip[1] = vp[1]*p[0] + vp[5]*p[1] + vp[9]*p[2] + vp[13];
        clip[3] = vp[3]*p[0] + vp[7]*p[1] + vp[11]*p[2] + vp[15];
        if (clip[3] <= 0) continue;
        const nx = clip[0] / clip[3];
        const ny = clip[1] / clip[3];
        const d = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
        if (d < closestDist) { closestDist = d; closest = repo; }
      }
      if (closest) callbacks.onOrbClick(closest);
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
    };
  }, [canvasRef, repos, callbacks, getEye]);
}
