/**
 * A rotating 3D particle field, rendered with raw WebGL.
 *
 * No three.js: the whole scene is a single draw call of gl.POINTS, so pulling
 * in a scene graph would cost roughly 150 kB gzipped to do less than this file
 * does. The depth is real — points are perspective-projected, and both their
 * size and their opacity fall off with distance.
 *
 * Returns a teardown function, or null when WebGL is unavailable, so the caller
 * can fall back to something else.
 */

const PARTICLE_COUNT = 800;

/** Retina is worth it; past 2x it is invisible and costs fill rate. */
const MAX_PIXEL_RATIO = 2;

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform vec2 uResolution;
uniform float uPixelRatio;

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

  p = rotateY(uTime * 0.055) * rotateX(sin(uTime * 0.037) * 0.28) * p;

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

/** Surfaces the driver's own message. Silently returning null here turns every
 *  shader typo into an invisible fallback, which is miserable to debug. */
function fail(reason: string) {
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

function buildProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
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

export function startParticleField(canvas: HTMLCanvasElement, color: [number, number, number]) {
  // getContext can throw rather than return null — jsdom does, and so do some
  // browsers when the context is blocked or the GPU is blacklisted.
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
  } catch (error) {
    return fail(`getContext threw: ${String(error)}`);
  }
  if (!gl) return fail("no webgl context (getContext returned null)");

  const program = buildProgram(gl);
  if (!program) return null;

  const { positions, sizes, phases } = buildGeometry();

  const positionBuffer = gl.createBuffer();
  const sizeBuffer = gl.createBuffer();
  const phaseBuffer = gl.createBuffer();

  const bind = (
    buffer: WebGLBuffer | null,
    data: Float32Array,
    name: string,
    components: number,
  ) => {
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  };

  gl.useProgram(program);
  bind(positionBuffer, positions, "aPosition", 3);
  bind(sizeBuffer, sizes, "aSize", 1);
  bind(phaseBuffer, phases, "aPhase", 1);

  const uTime = gl.getUniformLocation(program, "uTime");
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uPixelRatio = gl.getUniformLocation(program, "uPixelRatio");
  const uColor = gl.getUniformLocation(program, "uColor");

  // Additive blending with no depth buffer: overlapping particles should
  // accumulate light rather than occlude one another.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let pixelRatio = 1;

  const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (seconds: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, seconds);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uPixelRatio, pixelRatio);
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
  };

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  let frame = 0;
  let origin = 0;
  let elapsed = 0;

  const loop = (now: number) => {
    if (!origin) origin = now;
    resize();
    draw(elapsed + (now - origin) / 1000);
    frame = requestAnimationFrame(loop);
  };

  const stopLoop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
    // Bank the time so a resumed scene continues rather than snapping back.
    elapsed += origin ? (performance.now() - origin) / 1000 : 0;
    origin = 0;
  };

  const startLoop = () => {
    if (frame || reducedMotion) return;
    origin = 0;
    frame = requestAnimationFrame(loop);
  };

  // A hidden tab should not burn battery redrawing a background nobody can see.
  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else startLoop();
  };

  const onResize = () => {
    if (!reducedMotion) return;
    resize();
    draw(0);
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stopLoop();
  };

  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);

  if (reducedMotion) {
    // Still show the scene, just frozen — the depth reads fine without motion,
    // and motion is the part that causes trouble.
    resize();
    draw(0);
  } else {
    startLoop();
  }

  return () => {
    stopLoop();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);

    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(sizeBuffer);
    gl.deleteBuffer(phaseBuffer);
    gl.deleteProgram(program);

    // Deliberately NOT calling WEBGL_lose_context.loseContext() here. Losing
    // the context poisons the canvas permanently — a later getContext on the
    // same element hands back the same dead context, where every call fails
    // silently. StrictMode mounts, tears down, and remounts in development, so
    // that turned the whole scene invisible. Deleting the resources is enough;
    // the context goes when the canvas does.
  };
}
