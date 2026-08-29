/** Shared WebGL plumbing for the layers that make up the backdrop scene. */

/** Surfaces the driver's own message. Silently returning null here turns every
 *  shader typo into an invisible fallback, which is miserable to debug. */
export function fail(reason: string) {
  if (import.meta.env.DEV) console.warn(`[backdrop] ${reason}`);
  return null;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return fail("could not create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    return fail(`${kind} shader failed to compile: ${log}`);
  }
  return shader;
}

export function buildProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return fail("could not create program");

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  // They are linked into the program now; the shader objects themselves are no
  // longer needed.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    return fail(`program failed to link: ${log}`);
  }
  return program;
}

export type Attribute = {
  buffer: WebGLBuffer | null;
  location: number;
  components: number;
};

/** Uploads a static attribute buffer and records what it takes to re-point it. */
export function createAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  data: Float32Array,
  components: number,
): Attribute {
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, name);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return { buffer, location, components };
}

/**
 * Points the vertex attribute state at this layer's buffers.
 *
 * Attribute state is global to the context, so whichever layer drew last left
 * its own buffers bound. Every layer has to re-point before it draws, or it
 * renders the previous layer's geometry through its own shader.
 */
export function useAttributes(gl: WebGLRenderingContext, attributes: Attribute[]) {
  for (const { buffer, location, components } of attributes) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  }
}

/** Everything a layer needs to know about the current frame. */
export type Frame = {
  /** Seconds since the scene started, paused while the tab is hidden. */
  time: number;
  /** How far down the document we are, 0–1. */
  scroll: number;
  /** Eased cursor position in −1…1, or (0, 0) when there is no cursor. */
  pointerX: number;
  pointerY: number;
  /** Accent colour for this frame, as linear 0–1 components. */
  color: [number, number, number];
  width: number;
  height: number;
  pixelRatio: number;
};

/** One drawable element of the scene. */
export type Layer = {
  draw(frame: Frame): void;
  dispose(): void;
};
