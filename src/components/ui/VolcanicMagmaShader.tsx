import React, { useEffect, useRef } from "react";

interface VolcanicMagmaShaderProps {
  speed?: number; // Flow rate: 0.15 - 0.3 (default 0.18)
  viscosity?: number; // Warp scale: 2.0 - 4.0 (default 2.8)
  crustThreshold?: number; // Black plate ratio: 0.45 - 0.65 (default 0.58)
  heatIntensity?: number; // Core luminance: 1.5 - 3.0 (default 2.2)
  className?: string;
  style?: React.CSSProperties;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Tunable Parameters
uniform float u_speed;           // Flow rate: 0.15 - 0.3
uniform float u_viscosity;       // Warp scale: 2.0 - 4.0
uniform float u_crust_threshold; // Black plate ratio: 0.45 - 0.65
uniform float u_heat_intensity;  // Core luminance: 1.5 - 3.0

// Simplex-based noise primitives
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float snoise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = step(a.yx, a.xy);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

float fbm(vec2 uv) {
    float val = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
        val += amp * snoise(uv);
        uv = rot * uv * 2.02;
        amp *= 0.5;
    }
    return val;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed;

    // Dual-stage domain warping simulates dense liquid rolling over itself
    vec2 q = vec2(fbm(uv + vec2(0.0, 0.0)), fbm(uv + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(uv + u_viscosity * q + vec2(1.7 - t * 0.2, 9.2 + t * 0.15)),
                  fbm(uv + u_viscosity * q + vec2(8.3 + t * 0.1, 2.8 - t * 0.25)));

    float f = fbm(uv + 4.0 * r);

    // Color Palette Vectors
    vec3 obsidian   = vec3(0.03, 0.02, 0.03); // Deep matte substrate
    vec3 coolEmber  = vec3(0.42, 0.03, 0.01); // Viscous edge crust
    vec3 hotMagma   = vec3(1.00, 0.32, 0.00); // Core vein orange
    vec3 whiteHeat  = vec3(1.00, 0.95, 0.70); // Thermal emission center

    // Step-mapping for fracture separation
    float heatPattern = clamp((f * f * 4.0) + (0.6 * length(q)), 0.0, 1.0);

    vec3 color = obsidian;
    float fissureMask = smoothstep(u_crust_threshold, 1.0, heatPattern);
    
    color = mix(color, coolEmber, smoothstep(u_crust_threshold - 0.15, u_crust_threshold + 0.1, heatPattern));
    color = mix(color, hotMagma, fissureMask);
    color = mix(color, whiteHeat, smoothstep(0.82, 1.0, heatPattern) * u_heat_intensity);

    gl_FragColor = vec4(color, 1.0);
}
`;

export const VolcanicMagmaShader: React.FC<VolcanicMagmaShaderProps> = ({
  speed = 0.18,
  viscosity = 2.8,
  crustThreshold = 0.58,
  heatIntensity = 2.2,
  className = "",
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Store uniform values in refs so they update dynamically without re-creating WebGL program
  const uniformsRef = useRef({
    speed,
    viscosity,
    crustThreshold,
    heatIntensity,
  });

  useEffect(() => {
    uniformsRef.current = {
      speed,
      viscosity,
      crustThreshold,
      heatIntensity,
    };
  }, [speed, viscosity, crustThreshold, heatIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported for VolcanicMagmaShader.");
      return;
    }

    // Compile helper
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry: two triangles covering clip space [-1, -1] to [1, 1]
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uSpeedLoc = gl.getUniformLocation(program, "u_speed");
    const uViscosityLoc = gl.getUniformLocation(program, "u_viscosity");
    const uCrustThresholdLoc = gl.getUniformLocation(program, "u_crust_threshold");
    const uHeatIntensityLoc = gl.getUniformLocation(program, "u_heat_intensity");

    let startTime = performance.now();
    let isContextLost = false;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };

    const handleContextRestored = () => {
      isContextLost = false;
      startTime = performance.now();
      render();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    // Dynamic resolution scaling: maintain crispness without stressing GPU
    const updateSize = () => {
      if (!containerRef.current || isContextLost) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 200);

      // Downsample internal buffer slightly (0.65x) for buttery fluid performance
      const scale = 0.65;
      const bufferW = Math.floor(width * scale);
      const bufferH = Math.floor(height * scale);

      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
        gl.viewport(0, 0, bufferW, bufferH);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    updateSize();

    // Render loop
    const render = () => {
      if (isContextLost) return;

      const elapsed = (performance.now() - startTime) / 1000.0;

      gl.useProgram(program);

      if (uResolutionLoc) gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed);
      if (uSpeedLoc) gl.uniform1f(uSpeedLoc, uniformsRef.current.speed);
      if (uViscosityLoc) gl.uniform1f(uViscosityLoc, uniformsRef.current.viscosity);
      if (uCrustThresholdLoc) gl.uniform1f(uCrustThresholdLoc, uniformsRef.current.crustThreshold);
      if (uHeatIntensityLoc) gl.uniform1f(uHeatIntensityLoc, uniformsRef.current.heatIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      gl.deleteBuffer(positionBuffer);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      style={{ ...style }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="shader-view absolute inset-0 w-full h-full block"
        style={{
          mixBlendMode: "screen",
          opacity: 0.88,
          filter: "contrast(130%) brightness(95%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
