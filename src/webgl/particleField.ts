/**
 * A rotating 3D particle field, rendered with raw WebGL.
 *
 * No three.js: the whole layer is a single draw call of gl.POINTS, so pulling
 * in a scene graph would cost roughly 150 kB gzipped to do less than this file
 * does. The depth is real — points are perspective-projected, and both their
 * size and their opacity fall off with distance.
 *
 * Scroll pushes the cloud past the camera and turns it, so the page reads as
 * descending *through* the field rather than scrolling past a picture of one.
 */

import { buildProgram, createAttribute, useAttributes, type Frame, type Layer } from "./gl";

const PARTICLE_COUNT = 800;

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uScroll;
uniform vec2 uPointer;

varying float vFade;

mat3 rotateY(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateX(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

void main() {
  vec3 p = aPosition;

  // Each particle breathes on its own phase, so the cloud never looks rigid.
  p.y += sin(uTime * 0.15 + aPhase) * 0.07;
  p.x += cos(uTime * 0.11 + aPhase) * 0.05;

  // Scrolling lifts the cloud past the camera and adds to its rotation.
  p.y += uScroll * 1.6;

  p = rotateY(uTime * 0.055 + uScroll * 0.9) * rotateX(sin(uTime * 0.037) * 0.28) * p;

  // A slight lean toward the cursor. Small enough to read as parallax rather
  // than as the background chasing the mouse.
  p = rotateY(uPointer.x * 0.12) * rotateX(uPointer.y * -0.09) * p;

  // Push the cloud down the +z axis so the divisor stays comfortably positive.
  p.z += 3.0;

  float perspective = 1.0 / p.z;
  vec2 ndc = p.xy * perspective * 3.4;
  ndc.x *= uResolution.y / uResolution.x;

  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = aSize * perspective * 26.0 * uPixelRatio;

  // Near particles read brighter; far ones sink back into the page.
  vFade = clamp((perspective - 0.25) * 2.6, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColor;
varying float vFade;

void main() {
  vec2 offset = gl_PointCoord - vec2(0.5);
  float dist = length(offset);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist) * vFade * 0.42;
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;

/**
 * Distributes particles through a sphere rather than a cube, so the cloud has
 * no visible corners as it turns.
 */
function buildGeometry() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 0.35 + Math.cbrt(Math.random()) * 1.05;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
    positions[i * 3 + 2] = radius * Math.cos(phi);

    sizes[i] = 0.5 + Math.random() * 1.4;
    phases[i] = Math.random() * Math.PI * 2;
  }

  return { positions, sizes, phases };
}

export function createParticleField(gl: WebGLRenderingContext): Layer | null {
  const program = buildProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  const { positions, sizes, phases } = buildGeometry();

  gl.useProgram(program);
  const attributes = [
    createAttribute(gl, program, "aPosition", positions, 3),
    createAttribute(gl, program, "aSize", sizes, 1),
    createAttribute(gl, program, "aPhase", phases, 1),
  ];

  const uTime = gl.getUniformLocation(program, "uTime");
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uPixelRatio = gl.getUniformLocation(program, "uPixelRatio");
  const uScroll = gl.getUniformLocation(program, "uScroll");
  const uPointer = gl.getUniformLocation(program, "uPointer");
  const uColor = gl.getUniformLocation(program, "uColor");

  return {
    draw(frame: Frame) {
      gl.useProgram(program);
      useAttributes(gl, attributes);

      gl.uniform1f(uTime, frame.time);
      gl.uniform2f(uResolution, frame.width, frame.height);
      gl.uniform1f(uPixelRatio, frame.pixelRatio);
      gl.uniform1f(uScroll, frame.scroll);
      gl.uniform2f(uPointer, frame.pointerX, frame.pointerY);
      gl.uniform3f(uColor, frame.color[0], frame.color[1], frame.color[2]);

      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    },

    dispose() {
      for (const { buffer } of attributes) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
