/**
 * Wireframe icosahedra, held at the edges of the viewport for the whole page.
 *
 * Crisp geometry against the particle cloud's soft blur is the point: the cloud
 * gives the page depth, but only an edged solid reads unambiguously as a 3D
 * object. They lean further toward the cursor than the cloud does, because this
 * is the thing that should feel touchable.
 *
 * They turn on their own clock and scrolling adds to that turn, so the objects
 * are never still and never merely pinned to the glass.
 */

import { buildProgram, createAttribute, useAttributes, type Frame, type Layer } from "./gl";

/**
 * Edge thickness, in CSS pixels.
 *
 * The edges are built as camera-facing quads rather than drawn with gl.LINES,
 * because gl.lineWidth is clamped to 1 by virtually every driver — and one
 * *device* pixel on a retina screen is half a CSS pixel, which is close to
 * invisible. Opacity cannot fix a line that thin; only width can.
 */
const LINE_WIDTH = 1.6;

/** Viewport width, in CSS pixels, under which the text column fills the page
 *  and the forms have to move behind it. Matches Tailwind's `sm` breakpoint. */
const NARROW = 640;

/** One drawn copy of the solid. */
type Instance = {
  /** Position in clip space, where the viewport is −1…1 on both axes. */
  offset: [number, number];
  scale: number;
  /** Offsets the rotation clock so the copies are never mirror images. */
  phase: number;
  /** Multiplies alpha, to sit one copy further back than the other. */
  dim: number;
};

/**
 * Two copies, the left one lower, smaller, and a little dimmer, so the pair
 * reads as depth rather than as a symmetrical frame around the text.
 */
const WIDE: Instance[] = [
  { offset: [0.68, 0.2], scale: 0.3, phase: 0, dim: 1 },
  { offset: [-0.75, -0.1], scale: 0.26, phase: 2.1, dim: 0.8 },
];

/** On a narrow screen the text column fills the width, so both copies sit
 *  partly off the edges and drop right back to being texture. */
const NARROW_INSTANCES: Instance[] = [
  { offset: [0.52, 0.16], scale: 0.26, phase: 0, dim: 0.22 },
  { offset: [-0.52, -0.14], scale: 0.23, phase: 2.1, dim: 0.2 },
];

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

/**
 * Expands every edge into a quad: two triangles, six vertices.
 *
 * Each vertex carries *both* endpoints rather than just its own, so the shader
 * can work out the edge's direction on screen — after projection, where the
 * perpendicular has to be measured — and step sideways from it. `which` picks
 * which end this vertex sits at; `side` picks which lip of the quad.
 */
function buildGeometry() {
  const vertices = icosahedronVertices();
  const edges = icosahedronEdges(vertices);

  const quadVertexCount = edges.length * 6;
  const starts = new Float32Array(quadVertexCount * 3);
  const ends = new Float32Array(quadVertexCount * 3);
  const which = new Float32Array(quadVertexCount);
  const side = new Float32Array(quadVertexCount);

  // (which, side) for the two triangles making up one quad.
  const corners: [number, number][] = [
    [0, -1],
    [0, 1],
    [1, -1],
    [1, -1],
    [0, 1],
    [1, 1],
  ];

  edges.forEach(([a, b], edge) => {
    corners.forEach(([w, s], corner) => {
      const i = edge * 6 + corner;
      starts.set(vertices[a], i * 3);
      ends.set(vertices[b], i * 3);
      which[i] = w;
      side[i] = s;
    });
  });

  const points = new Float32Array(vertices.length * 3);
  vertices.forEach((vertex, i) => points.set(vertex, i * 3));

  return { starts, ends, which, side, quadVertexCount, points, pointCount: vertices.length };
}

/** Shared by both vertex shaders, since GLSL has no way to include a file. */
const TRANSFORM = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uScroll;
uniform vec2 uOffset;
uniform float uScale;
uniform float uPhase;

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

/** Model space to eye space. */
vec3 place(vec3 position) {
  // Turns the opposite way to the cloud, and slower, so the two never lock
  // into a shared rhythm. Scroll adds to the turn — again against the cloud —
  // so moving down the page visibly drives it rather than just sliding past.
  vec3 p =
    rotateY(uTime * -0.11 - uScroll * 1.6 + uPhase) *
    rotateX(0.42 + sin(uTime * 0.06 + uPhase) * 0.14 + uScroll * 0.5) *
    position;

  // A far stronger lean than the cloud gets: this is the object the cursor is
  // meant to feel connected to.
  p = rotateY(uPointer.x * 0.25) * rotateX(uPointer.y * -0.2) * p;

  p *= uScale;
  p.z += 3.4;
  return p;
}

/** Eye space to clip space, before the instance offset is applied. */
vec2 project(vec3 p) {
  vec2 ndc = p.xy * (1.0 / p.z) * 3.4;
  ndc.x *= uResolution.y / uResolution.x;
  return ndc;
}
`;

const LINE_VERTEX_SHADER = `
attribute vec3 aStart;
attribute vec3 aEnd;
attribute float aWhich;
attribute float aSide;

uniform float uHalfWidth;

${TRANSFORM}

void main() {
  vec2 start = project(place(aStart));
  vec2 end = project(place(aEnd));
  vec2 here = mix(start, end, aWhich);

  // Clip space is not square, so the direction has to be measured in pixels or
  // the quad comes out thicker on one axis than the other.
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 direction = end * aspect - start * aspect;

  // A degenerate edge — both ends projecting to the same point — would make
  // normalize produce NaN and take the whole triangle with it.
  vec2 normal = length(direction) > 0.0001
    ? vec2(-normalize(direction).y, normalize(direction).x) / aspect
    : vec2(0.0);

  gl_Position = vec4(here + normal * aSide * uHalfWidth + uOffset, 0.0, 1.0);
}
`;

const POINT_VERTEX_SHADER = `
attribute vec3 aPosition;

uniform float uPixelRatio;
uniform float uPointSize;

${TRANSFORM}

void main() {
  gl_Position = vec4(project(place(aPosition)) + uOffset, 0.0, 1.0);
  gl_PointSize = uPointSize * uPixelRatio;
}
`;

const LINE_FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColor;
uniform float uAlpha;

void main() {
  gl_FragColor = vec4(uColor * uAlpha, uAlpha);
}
`;

const POINT_FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColor;
uniform float uAlpha;

void main() {
  // Round the sprite off, so the joints read as dots rather than tiny squares.
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.15, dist) * uAlpha;
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;

/** Pulls the uniform locations shared by both programs. */
function commonUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
  return {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    scroll: gl.getUniformLocation(program, "uScroll"),
    offset: gl.getUniformLocation(program, "uOffset"),
    scale: gl.getUniformLocation(program, "uScale"),
    phase: gl.getUniformLocation(program, "uPhase"),
    color: gl.getUniformLocation(program, "uColor"),
    alpha: gl.getUniformLocation(program, "uAlpha"),
  };
}

export function createIcosahedron(gl: WebGLRenderingContext): Layer | null {
  const lineProgram = buildProgram(gl, LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
  const pointProgram = buildProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  if (!lineProgram || !pointProgram) return null;

  const { starts, ends, which, side, quadVertexCount, points, pointCount } = buildGeometry();

  gl.useProgram(lineProgram);
  const lineAttributes = [
    createAttribute(gl, lineProgram, "aStart", starts, 3),
    createAttribute(gl, lineProgram, "aEnd", ends, 3),
    createAttribute(gl, lineProgram, "aWhich", which, 1),
    createAttribute(gl, lineProgram, "aSide", side, 1),
  ];
  const lineUniforms = commonUniforms(gl, lineProgram);
  const uHalfWidth = gl.getUniformLocation(lineProgram, "uHalfWidth");

  gl.useProgram(pointProgram);
  const pointAttributes = [createAttribute(gl, pointProgram, "aPosition", points, 3)];
  const pointUniforms = commonUniforms(gl, pointProgram);
  const uPixelRatio = gl.getUniformLocation(pointProgram, "uPixelRatio");
  const uPointSize = gl.getUniformLocation(pointProgram, "uPointSize");

  return {
    draw(frame: Frame) {
      const narrow = frame.width / frame.pixelRatio < NARROW;
      const instances = narrow ? NARROW_INSTANCES : WIDE;

      const setShared = (u: ReturnType<typeof commonUniforms>, instance: Instance) => {
        gl.uniform1f(u.time, frame.time);
        gl.uniform2f(u.resolution, frame.width, frame.height);
        gl.uniform2f(u.pointer, frame.pointerX, frame.pointerY);
        gl.uniform1f(u.scroll, frame.scroll);
        gl.uniform3f(u.color, frame.color[0], frame.color[1], frame.color[2]);
        gl.uniform2f(u.offset, instance.offset[0], instance.offset[1]);
        gl.uniform1f(u.scale, instance.scale);
        gl.uniform1f(u.phase, instance.phase);
      };

      // Clip space spans 2 units over the canvas height, so a half-width of W
      // device pixels is W / (height / 2) in clip space.
      const halfWidth = (LINE_WIDTH * frame.pixelRatio) / frame.height;

      gl.useProgram(lineProgram);
      useAttributes(gl, lineAttributes);
      gl.uniform1f(uHalfWidth, halfWidth);
      for (const instance of instances) {
        setShared(lineUniforms, instance);
        gl.uniform1f(lineUniforms.alpha, 0.34 * instance.dim);
        gl.drawArrays(gl.TRIANGLES, 0, quadVertexCount);
      }

      // Brighter dots at the corners, to give the wireframe joints.
      gl.useProgram(pointProgram);
      useAttributes(gl, pointAttributes);
      gl.uniform1f(uPixelRatio, frame.pixelRatio);
      gl.uniform1f(uPointSize, 3.4);
      for (const instance of instances) {
        setShared(pointUniforms, instance);
        gl.uniform1f(pointUniforms.alpha, 0.7 * instance.dim);
        gl.drawArrays(gl.POINTS, 0, pointCount);
      }
    },

    dispose() {
      for (const { buffer } of [...lineAttributes, ...pointAttributes]) gl.deleteBuffer(buffer);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(pointProgram);
    },
  };
}
