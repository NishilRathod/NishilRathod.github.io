/**
 * A wireframe icosahedron, held in the corner of the viewport for the whole
 * page.
 *
 * Crisp geometry against the particle cloud's soft blur is the point: the cloud
 * gives the page depth, but only an edged solid reads unambiguously as a 3D
 * object. It leans further toward the cursor than the cloud does, because this
 * is the thing that should feel touchable.
 *
 * It turns on its own clock and scrolling adds to that turn, so the object is
 * never still and never merely pinned to the glass.
 */

import { buildProgram, createAttribute, useAttributes, type Frame, type Layer } from "./gl";

/** Viewport width, in CSS pixels, under which the text column fills the page
 *  and the form has to move behind it. Matches Tailwind's `sm` breakpoint. */
const NARROW = 640;

/**
 * The twelve vertices of an icosahedron: three mutually perpendicular golden
 * rectangles, normalised onto the unit sphere.
 */
function icosahedronVertices() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [];

  for (const a of [-1, 1]) {
    for (const b of [-phi, phi]) {
      raw.push([0, a, b], [a, b, 0], [b, 0, a]);
    }
  }

  return raw.map(([x, y, z]) => {
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length] as [number, number, number];
  });
}

/**
 * The thirty edges, found by measuring rather than transcribed from a table:
 * on a regular icosahedron every edge is the same length, and that length is
 * the shortest distance between any two vertices.
 */
function icosahedronEdges(vertices: [number, number, number][]) {
  const distance = (a: number, b: number) =>
    Math.hypot(
      vertices[a][0] - vertices[b][0],
      vertices[a][1] - vertices[b][1],
      vertices[a][2] - vertices[b][2],
    );

  let shortest = Infinity;
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      shortest = Math.min(shortest, distance(i, j));
    }
  }

  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (distance(i, j) < shortest * 1.01) edges.push([i, j]);
    }
  }
  return edges;
}

function buildGeometry() {
  const vertices = icosahedronVertices();
  const edges = icosahedronEdges(vertices);

  const lines = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    lines.set(vertices[a], i * 6);
    lines.set(vertices[b], i * 6 + 3);
  });

  const points = new Float32Array(vertices.length * 3);
  vertices.forEach((vertex, i) => points.set(vertex, i * 3));

  return { lines, points, lineVertexCount: edges.length * 2, pointCount: vertices.length };
}

const VERTEX_SHADER = `
attribute vec3 aPosition;

uniform float uTime;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uScroll;
uniform vec2 uOffset;
uniform float uScale;
uniform float uPointSize;

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
  // Turns the opposite way to the cloud, and slower, so the two never lock
  // into a shared rhythm. Scroll adds to the turn — again against the cloud —
  // so moving down the page visibly drives it rather than just sliding past.
  vec3 p =
    rotateY(uTime * -0.11 - uScroll * 1.6) *
    rotateX(0.42 + sin(uTime * 0.06) * 0.14 + uScroll * 0.5) *
    aPosition;

  // A far stronger lean than the cloud gets: this is the object the cursor is
  // meant to feel connected to.
  p = rotateY(uPointer.x * 0.25) * rotateX(uPointer.y * -0.2) * p;

  p *= uScale;
  p.z += 3.4;

  float perspective = 1.0 / p.z;
  vec2 ndc = p.xy * perspective * 3.4;
  ndc.x *= uResolution.y / uResolution.x;

  gl_Position = vec4(ndc + uOffset, 0.0, 1.0);
  gl_PointSize = uPointSize * uPixelRatio;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColor;
uniform float uAlpha;

void main() {
  gl_FragColor = vec4(uColor * uAlpha, uAlpha);
}
`;

export function createIcosahedron(gl: WebGLRenderingContext): Layer | null {
  const program = buildProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  const { lines, points, lineVertexCount, pointCount } = buildGeometry();

  gl.useProgram(program);
  const lineAttribute = createAttribute(gl, program, "aPosition", lines, 3);
  const pointAttribute = createAttribute(gl, program, "aPosition", points, 3);

  const uTime = gl.getUniformLocation(program, "uTime");
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uPixelRatio = gl.getUniformLocation(program, "uPixelRatio");
  const uPointer = gl.getUniformLocation(program, "uPointer");
  const uScroll = gl.getUniformLocation(program, "uScroll");
  const uOffset = gl.getUniformLocation(program, "uOffset");
  const uScale = gl.getUniformLocation(program, "uScale");
  const uPointSize = gl.getUniformLocation(program, "uPointSize");
  const uColor = gl.getUniformLocation(program, "uColor");
  const uAlpha = gl.getUniformLocation(program, "uAlpha");

  return {
    draw(frame: Frame) {
      const narrow = frame.width / frame.pixelRatio < NARROW;

      gl.useProgram(program);

      gl.uniform1f(uTime, frame.time);
      gl.uniform2f(uResolution, frame.width, frame.height);
      gl.uniform1f(uPixelRatio, frame.pixelRatio);
      gl.uniform2f(uPointer, frame.pointerX, frame.pointerY);
      gl.uniform1f(uScroll, frame.scroll);
      gl.uniform3f(uColor, frame.color[0], frame.color[1], frame.color[2]);

      // On a wide screen it sits in the upper right, tucked past the edge of
      // the text column. On a narrow one the column fills the width, so it
      // moves behind the text and drops back to being texture.
      //
      // Note the aspect correction in the vertex shader squeezes x, so the
      // horizontal radius comes out around 0.64x the vertical one — the form is
      // narrower on screen than uScale alone suggests.
      gl.uniform2f(uOffset, narrow ? 0 : 0.68, narrow ? 0.08 : 0.2);
      gl.uniform1f(uScale, narrow ? 0.28 : 0.3);

      // It is on screen for the whole page now rather than just the hero, so it
      // sits back further than it used to — especially on a narrow viewport,
      // where it has body copy in front of it the entire way down.
      const dim = narrow ? 0.22 : 1;

      // gl.lineWidth is clamped to 1 on virtually every driver, so the edges
      // carry their weight through opacity instead of thickness.
      gl.uniform1f(uAlpha, 0.2 * dim);
      useAttributes(gl, [lineAttribute]);
      gl.drawArrays(gl.LINES, 0, lineVertexCount);

      // Brighter dots at the corners, to give the wireframe joints.
      gl.uniform1f(uPointSize, 2.2);
      gl.uniform1f(uAlpha, 0.45 * dim);
      useAttributes(gl, [pointAttribute]);
      gl.drawArrays(gl.POINTS, 0, pointCount);
    },

    dispose() {
      gl.deleteBuffer(lineAttribute.buffer);
      gl.deleteBuffer(pointAttribute.buffer);
      gl.deleteProgram(program);
    },
  };
}
