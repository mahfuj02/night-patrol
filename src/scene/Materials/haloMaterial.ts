import { AdditiveBlending, ShaderMaterial } from 'three';

// Soft glow sprites for fake lights (streetlights, porch lights): instanced quads that always face
// the camera, drawn additively. Instance scale is the glow diameter, instance colour its colour.

export const billboardVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    vColor = instanceColor;
    // Instance scale is the halo diameter; the quad always faces the camera.
    vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float size = length(instanceMatrix[0].xyz);
    centre.xy += position.xy * size;
    gl_Position = projectionMatrix * centre;
  }
`;

export const haloFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
    float glow = pow(1.0 - d, 2.4);
    float core = pow(1.0 - d, 9.0);
    gl_FragColor = vec4(vColor, glow * 0.55 + core * 0.9);
  }
`;

export function additive(vertexShader: string, fragmentShader: string) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}
