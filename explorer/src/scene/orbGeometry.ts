// Geometry builders for spheres, rings, and star fields

export interface SphereData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
}

export function buildSphere(latBands = 24, lonBands = 24): SphereData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    for (let lon = 0; lon <= lonBands; lon++) {
      const phi = (lon * 2 * Math.PI) / lonBands;
      const x = Math.cos(phi) * sinT;
      const y = cosT;
      const z = Math.sin(phi) * sinT;
      positions.push(x, y, z);
      normals.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const a = lat * (lonBands + 1) + lon;
      const b = a + lonBands + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

export interface RingData {
  positions: Float32Array;
  indices: Uint16Array;
}

export function buildRing(segments = 64, radius = 1.5, thickness = 0.01): RingData {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // outer
    positions.push(cos * (radius + thickness), 0, sin * (radius + thickness));
    // inner
    positions.push(cos * (radius - thickness), 0, sin * (radius - thickness));
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2);
    indices.push(a + 1, a + 3, a + 2);
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
  };
}

export interface StarFieldData {
  positions: Float32Array;
  sizes: Float32Array;
}

export function buildStarField(count = 600, spread = 50): StarFieldData {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    sizes[i] = Math.random() * 2 + 0.5;
  }
  return { positions, sizes };
}
