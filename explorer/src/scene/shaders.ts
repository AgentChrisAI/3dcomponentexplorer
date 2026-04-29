// GLSL shader sources for orbs, rings, and stars

export const orbVS = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
uniform mat3 uNormal;
out vec3 vNormal;
out vec3 vWorldPos;
void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(uNormal * aNormal);
  gl_Position = uMVP * vec4(aPosition, 1.0);
}`;

export const orbFS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorldPos;
uniform vec3 uCameraPos;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
  float rim = fresnel * 0.8;
  float scanline = sin(vWorldPos.y * 40.0 + uTime * 2.0) * 0.03 + 0.97;
  float pulse = sin(uTime * 1.5) * 0.05 + 0.95;
  float base = 0.08;
  float light = base + rim * 0.9;
  vec3 col = uColor * light * scanline * pulse;
  fragColor = vec4(col, uOpacity * (0.3 + fresnel * 0.7));
}`;

export const ringVS = `#version 300 es
precision highp float;
in vec3 aPosition;
uniform mat4 uMVP;
void main() {
  gl_Position = uMVP * vec4(aPosition, 1.0);
}`;

export const ringFS = `#version 300 es
precision highp float;
uniform float uOpacity;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 1.0, 1.0, uOpacity * 0.15);
}`;

export const starVS = `#version 300 es
precision highp float;
in vec3 aPosition;
in float aSize;
uniform mat4 uMVP;
void main() {
  gl_Position = uMVP * vec4(aPosition, 1.0);
  gl_PointSize = aSize;
}`;

export const starFS = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = 1.0 - smoothstep(0.0, 1.0, d);
  fragColor = vec4(1.0, 1.0, 1.0, a * 0.6);
}`;
