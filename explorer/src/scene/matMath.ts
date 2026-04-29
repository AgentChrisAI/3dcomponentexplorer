// mat4 helpers — column-major Float32Array(16)

export function identity(): Float32Array {
  const m = new Float32Array(16);
  m[0]=1; m[5]=1; m[10]=1; m[15]=1;
  return m;
}

export function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let i=0;i<4;i++) for (let j=0;j<4;j++) {
    o[j*4+i] = a[i]*b[j*4] + a[4+i]*b[j*4+1] + a[8+i]*b[j*4+2] + a[12+i]*b[j*4+3];
  }
  return o;
}

export function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const m = new Float32Array(16);
  const f = 1/Math.tan(fov/2);
  m[0]=f/aspect; m[5]=f; m[10]=(far+near)/(near-far); m[11]=-1;
  m[14]=(2*far*near)/(near-far);
  return m;
}

export function lookAt(eye: number[], center: number[], up: number[]): Float32Array {
  const z = normalize(sub(eye,center));
  const x = normalize(cross(up,z));
  const y = cross(z,x);
  const m = new Float32Array(16);
  m[0]=x[0]; m[1]=y[0]; m[2]=z[0];
  m[4]=x[1]; m[5]=y[1]; m[6]=z[1];
  m[8]=x[2]; m[9]=y[2]; m[10]=z[2];
  m[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);
  m[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);
  m[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);
  m[15]=1;
  return m;
}

export function rotateY(m: Float32Array, angle: number): Float32Array {
  const c=Math.cos(angle), s=Math.sin(angle);
  const r = identity();
  r[0]=c; r[2]=-s; r[8]=s; r[10]=c;
  return multiply(m,r);
}

export function rotateX(m: Float32Array, angle: number): Float32Array {
  const c=Math.cos(angle), s=Math.sin(angle);
  const r = identity();
  r[5]=c; r[6]=s; r[9]=-s; r[10]=c;
  return multiply(m,r);
}

export function translate(m: Float32Array, v: number[]): Float32Array {
  const t = identity();
  t[12]=v[0]; t[13]=v[1]; t[14]=v[2];
  return multiply(m,t);
}

export function scale(m: Float32Array, s: number): Float32Array {
  const t = identity();
  t[0]=s; t[5]=s; t[10]=s;
  return multiply(m,t);
}

export function invert(m: Float32Array): Float32Array {
  const o = new Float32Array(16);
  const a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7];
  const i=m[8],j=m[9],k=m[10],l=m[11],n=m[12],p=m[13],q=m[14],r=m[15];
  const A=a*f-b*e, B=a*g-c*e, C=a*h-d*e, D=b*g-c*f;
  const E=b*h-d*f, F=c*h-d*g, G=i*p-j*n, H=i*q-k*n;
  const I=i*r-l*n, J=j*q-k*p, K=j*r-l*p, L=k*r-l*q;
  let det = A*L-B*K+C*J+D*I-E*H+F*G;
  if(!det) return identity();
  det=1/det;
  o[0]=(f*L-g*K+h*J)*det; o[1]=(c*K-b*L-d*J)*det;
  o[2]=(p*F-q*E+r*D)*det; o[3]=(k*E-j*F-l*D)*det;
  o[4]=(g*I-e*L-h*H)*det; o[5]=(a*L-c*I+d*H)*det;
  o[6]=(q*C-n*F-r*B)*det; o[7]=(i*F-k*C+l*B)*det;
  o[8]=(e*K-f*I+h*G)*det; o[9]=(b*I-a*K-d*G)*det;
  o[10]=(n*E-p*C+r*A)*det; o[11]=(j*C-i*E-l*A)*det;
  o[12]=(f*H-e*J-g*G)*det; o[13]=(a*J-b*H+c*G)*det;
  o[14]=(p*B-n*D-q*A)*det; o[15]=(i*D-j*B+k*A)*det;
  return o;
}

export function transpose(m: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for(let i=0;i<4;i++) for(let j=0;j<4;j++) o[i*4+j]=m[j*4+i];
  return o;
}

function sub(a: number[], b: number[]): number[] { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function cross(a: number[], b: number[]): number[] { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function normalize(v: number[]): number[] { const l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }
