import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

interface SpatialEmblem3DProps {
  className?: string;
  height?: number;
  interactive?: boolean;
}

function detectWebGLSupport(): { supported: boolean; isSoftwareGl: boolean } {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { supported: false, isSoftwareGl: true };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return { supported: false, isSoftwareGl: true };

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererStr = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "")
      : String(gl.getParameter(gl.RENDERER) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    const isSoftwareGl =
      /SwiftShader|llvmpipe|softpipe|Software|Mesa|Basic Render/i.test(
        rendererStr,
      );
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

/**
 * Generates a high-DPI procedural alien holographic calibration dial texture
 * for the 3-axis counter-rotating astrolabe rings.
 */
function createAstrolabeRingTexture(
  variant: "outer" | "mid" | "radar",
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  if (variant === "outer") {
    // Crisp segmented outer cyan laser arcs
    const rMain = 455;
    ctx.strokeStyle = "rgba(0, 245, 212, 0.85)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const start = i * (Math.PI / 2) + 0.14;
      const end = (i + 1) * (Math.PI / 2) - 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, rMain, start, end);
      ctx.stroke();
    }

    // Secondary outer hairline
    ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 482, 0, Math.PI * 2);
    ctx.stroke();

    // Precision degree ticks (72 ticks)
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const r0 = isMajor ? 412 : 430;
      const r1 = 448;
      ctx.strokeStyle = isMajor
        ? "rgba(0, 255, 157, 0.95)"
        : "rgba(0, 245, 212, 0.45)";
      ctx.lineWidth = isMajor ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
      ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.stroke();
    }

    // Alien geometric diamond markers at cardinal angles
    for (let i = 0; i < 4; i++) {
      const angle = i * (Math.PI / 2);
      const x = cx + Math.cos(angle) * 455;
      const y = cy + Math.sin(angle) * 455;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = "#00ff9d";
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    }
  } else if (variant === "mid") {
    // Segmented dual-tone cyan + xenotech violet plasma containment arcs
    const r = 415;
    for (let i = 0; i < 6; i++) {
      const a0 = i * (Math.PI / 3) + 0.1;
      const a1 = a0 + 0.72;
      ctx.strokeStyle =
        i % 2 === 0 ? "rgba(168, 85, 247, 0.92)" : "rgba(0, 229, 255, 0.92)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();

      // Inner companion filament
      ctx.strokeStyle =
        i % 2 === 0 ? "rgba(168, 85, 247, 0.42)" : "rgba(0, 245, 212, 0.42)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 26, a0 - 0.06, a1 + 0.06);
      ctx.stroke();
    }

    // Dashed inner telemetry track
    ctx.setLineDash([12, 16]);
    ctx.strokeStyle = "rgba(0, 245, 212, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 355, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Holographic radial emitter floor radar
    const rings = [120, 210, 300, 395, 475];
    rings.forEach((radius, idx) => {
      ctx.strokeStyle =
        idx === 4
          ? "rgba(0, 245, 212, 0.78)"
          : idx === 2
            ? "rgba(168, 85, 247, 0.48)"
            : "rgba(0, 229, 255, 0.34)";
      ctx.lineWidth = idx === 4 ? 4 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial spokes (12 sectors)
    ctx.strokeStyle = "rgba(0, 245, 212, 0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
      ctx.lineTo(cx + Math.cos(a) * 475, cy + Math.sin(a) * 475);
      ctx.stroke();
    }

    // Glowing holographic radar sweep wedge
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 475);
    grad.addColorStop(0, "rgba(0, 245, 212, 0.42)");
    grad.addColorStop(0.55, "rgba(0, 229, 255, 0.16)");
    grad.addColorStop(1, "rgba(0, 245, 212, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 475, -0.55, 0.0);
    ctx.closePath();
    ctx.fill();

    // Leading laser edge of radar sweep
    ctx.strokeStyle = "rgba(0, 255, 157, 0.92)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 475, cy);
    ctx.stroke();

    // Center plasma emitter core glow
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 130);
    coreGrad.addColorStop(0, "rgba(210, 255, 252, 0.95)");
    coreGrad.addColorStop(0.35, "rgba(0, 245, 212, 0.65)");
    coreGrad.addColorStop(1, "rgba(0, 245, 212, 0.0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Volumetric Alien Hologram Projector Chamber
 * Projects Stock Bloc's official chrome-cyan SB Liberty Bell emblem (/Logo1.png)
 * inside a custom GLSL holographic light cone with 3-axis counter-rotating alien
 * astrolabe HUD rings, composite titanium-plasma emitter pedestal, and rising energy motes.
 */
export const SpatialEmblem3D: React.FC<SpatialEmblem3DProps> = ({
  className = "",
  height = 330,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const mountEl = canvasMountRef.current;
    if (!container || !mountEl) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const { supported, isSoftwareGl } = detectWebGLSupport();
    if (!supported || prefersReducedMotion) {
      setFallbackMode(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFallbackMode(true);
      return;
    }

    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x000000, 0);

    const width = Math.max(container.clientWidth || 340, 260);
    const h = Math.max(height, 260);
    renderer.setSize(width, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mountEl.innerHTML = "";
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02060e, 0.055);

    const camera = new THREE.PerspectiveCamera(35, width / h, 0.1, 45);
    camera.position.set(0, 0.55, 7.6);
    camera.lookAt(0, 0.08, 0);

    // Studio environment map for dark metallic emitter pedestal reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Balanced 3-point sci-fi rig (Key + Cool Hemisphere + Violet Rim)
    const hemiLight = new THREE.HemisphereLight(0x7ef9ff, 0x050b18, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xd9fffb, 2.2);
    keyLight.position.set(3.5, 5.0, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 2.4);
    rimLight.position.set(-4.2, 2.0, -3.5);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x00f5d4, 5.5, 9);
    underGlow.position.set(0, -1.3, 0.6);
    scene.add(underGlow);

    // Master interactive rig
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];
    const disposableTextures: THREE.Texture[] = [];

    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    // =========================================================================
    // 1. COMPOSITE ALIEN HOLO-EMITTER PEDESTAL (Multi-part PBR Assembly)
    // =========================================================================
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.78, 0);
    masterGroup.add(pedestalGroup);

    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x091524,
      metalness: 0.92,
      roughness: 0.22,
    });
    const brushedCollarMat = new THREE.MeshStandardMaterial({
      color: 0x11273d,
      metalness: 0.68,
      roughness: 0.52,
    });
    const neonConduitMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const violetConduitMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposableMaterials.push(
      darkTitaniumMat,
      brushedCollarMat,
      neonConduitMat,
      violetConduitMat,
    );

    // Base hexagonal chassis
    const hexBaseGeo = new THREE.CylinderGeometry(1.62, 1.92, 0.24, 6);
    disposableGeometries.push(hexBaseGeo);
    const hexBaseMesh = new THREE.Mesh(hexBaseGeo, darkTitaniumMat);
    hexBaseMesh.position.y = 0.0;
    pedestalGroup.add(hexBaseMesh);

    // Brushed mid emitter collar
    const collarGeo = new THREE.CylinderGeometry(1.18, 1.38, 0.16, 24);
    disposableGeometries.push(collarGeo);
    const collarMesh = new THREE.Mesh(collarGeo, brushedCollarMat);
    collarMesh.position.y = 0.16;
    pedestalGroup.add(collarMesh);

    // Glowing outer plasma emitter ring
    const emitterRingGeo = new THREE.TorusGeometry(1.26, 0.026, 12, 64);
    disposableGeometries.push(emitterRingGeo);
    const emitterRingMesh = new THREE.Mesh(emitterRingGeo, neonConduitMat);
    emitterRingMesh.rotation.x = Math.PI / 2;
    emitterRingMesh.position.y = 0.24;
    pedestalGroup.add(emitterRingMesh);

    // Secondary inner violet focus ring
    const innerRingGeo = new THREE.TorusGeometry(0.74, 0.02, 10, 48);
    disposableGeometries.push(innerRingGeo);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, violetConduitMat);
    innerRingMesh.rotation.x = Math.PI / 2;
    innerRingMesh.position.y = 0.26;
    pedestalGroup.add(innerRingMesh);

    // 6 angular emitter pylons around hexagon vertices
    const pylonGeo = new THREE.BoxGeometry(0.14, 0.22, 0.34);
    disposableGeometries.push(pylonGeo);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const pylon = new THREE.Mesh(pylonGeo, darkTitaniumMat);
      pylon.position.set(Math.cos(angle) * 1.48, 0.14, Math.sin(angle) * 1.48);
      pylon.rotation.y = -angle;
      pylon.rotation.z = 0.28;
      pedestalGroup.add(pylon);
    }

    // Concentric Holographic Radar Floor Plane
    const radarTex = createAstrolabeRingTexture("radar");
    radarTex.anisotropy = maxAnisotropy;
    disposableTextures.push(radarTex);

    const radarGeo = new THREE.PlaneGeometry(4.4, 4.4);
    disposableGeometries.push(radarGeo);
    const radarMat = new THREE.MeshBasicMaterial({
      map: radarTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    disposableMaterials.push(radarMat);
    const radarMesh = new THREE.Mesh(radarGeo, radarMat);
    radarMesh.rotation.x = -Math.PI / 2;
    radarMesh.position.y = 0.28;
    pedestalGroup.add(radarMesh);

    // =========================================================================
    // 2. VOLUMETRIC HOLOGRAM PROJECTION BEAM CONE (Custom GLSL Shader)
    // =========================================================================
    const beamGeo = new THREE.CylinderGeometry(1.95, 0.68, 3.4, 48, 1, true);
    disposableGeometries.push(beamGeo);

    const beamMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCyan: { value: new THREE.Color(0x00f5d4) },
        uColorViolet: { value: new THREE.Color(0x8b5cf6) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorCyan;
        uniform vec3 uColorViolet;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 1.75);
          // Fade smoothly near top and gently at base
          float verticalFade = smoothstep(0.0, 0.14, vUv.y) * pow(1.0 - vUv.y, 1.45);
          // Upward scrolling fine holographic scanlines
          float scan = 0.72 + 0.28 * sin(vUv.y * 95.0 - uTime * 4.5);
          // Vertical energy rays around circumference
          float rays = 0.65 + 0.35 * sin(vUv.x * 37.699 + uTime * 0.9) * sin(vUv.x * 18.849 - uTime * 0.6);
          vec3 col = mix(uColorCyan, uColorViolet, vUv.y * 0.45);
          float alpha = verticalFade * (0.14 + fresnel * 0.34) * scan * rays;
          gl_FragColor = vec4(col, alpha * 0.68);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    disposableMaterials.push(beamMat);
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, 0.16, 0);
    masterGroup.add(beamMesh);

    // =========================================================================
    // 3. OFFICIAL STOCK BLOC EMBLEM (/Logo1.png) MULTI-LAYER 3D HOLOGRAM
    // =========================================================================
    const holoEmblemGroup = new THREE.Group();
    holoEmblemGroup.position.set(0, 0.24, 0);
    masterGroup.add(holoEmblemGroup);

    const emblemPlaneGeo = new THREE.PlaneGeometry(2.65, 2.65);
    disposableGeometries.push(emblemPlaneGeo);

    const primaryHoloMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null as THREE.Texture | null },
        uHasMap: { value: 0.0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          if (uHasMap < 0.5) discard;
          vec4 tex = texture2D(uMap, vUv);
          if (tex.a < 0.06) discard;

          // Subtle fine horizontal holographic scanlines
          float scanline = 0.90 + 0.10 * sin(vUv.y * 190.0 - uTime * 5.2);

          // Sweeping diagonal holographic energy glint
          float sweepPos = fract(uTime * 0.26) * 2.2 - 0.6;
          float diag = vUv.x * 0.65 + vUv.y * 0.75;
          float glint = smoothstep(0.12, 0.0, abs(diag - sweepPos)) * 0.42;

          // Slight luminous cyan-white boost so the official emblem pops like a true hologram
          vec3 holoCol = tex.rgb * (1.12 * scanline) + vec3(0.0, 0.96, 0.88) * glint;
          float pulse = 0.96 + 0.04 * sin(uTime * 2.8);

          gl_FragColor = vec4(holoCol * pulse, tex.a * 0.98);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Rear violet-cyan chromatic holographic parallax echo plane
    const echoHoloMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null as THREE.Texture | null },
        uHasMap: { value: 0.0 },
        uTime: { value: 0 },
        uTint: { value: new THREE.Color(0x9333ea) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uTime;
        uniform vec3 uTint;
        varying vec2 vUv;
        void main() {
          if (uHasMap < 0.5) discard;
          vec4 tex = texture2D(uMap, vUv);
          if (tex.a < 0.08) discard;
          float scan = 0.55 + 0.45 * sin(vUv.y * 120.0 + uTime * 4.0);
          float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
          vec3 col = mix(uTint, vec3(0.0, 0.92, 1.0), 0.35) * (0.6 + luma * 0.9);
          gl_FragColor = vec4(col, tex.a * 0.34 * scan);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Front cyan holographic bloom aura layer
    const frontShimmerMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null as THREE.Texture | null },
        uHasMap: { value: 0.0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          if (uHasMap < 0.5) discard;
          vec4 tex = texture2D(uMap, vUv);
          if (tex.a < 0.1) discard;
          float band = smoothstep(0.07, 0.0, abs(vUv.y - fract(uTime * 0.35)));
          vec3 col = vec3(0.0, 0.96, 0.85) * (0.28 + band * 1.1);
          gl_FragColor = vec4(col, tex.a * (0.16 + band * 0.38));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    disposableMaterials.push(primaryHoloMat, echoHoloMat, frontShimmerMat);

    const echoMesh = new THREE.Mesh(emblemPlaneGeo, echoHoloMat);
    echoMesh.position.z = -0.22;
    echoMesh.scale.setScalar(1.05);
    holoEmblemGroup.add(echoMesh);

    const primaryMesh = new THREE.Mesh(emblemPlaneGeo, primaryHoloMat);
    primaryMesh.position.z = 0;
    primaryMesh.renderOrder = 5;
    holoEmblemGroup.add(primaryMesh);

    const frontMesh = new THREE.Mesh(emblemPlaneGeo, frontShimmerMat);
    frontMesh.position.z = 0.12;
    frontMesh.scale.setScalar(1.015);
    frontMesh.renderOrder = 6;
    holoEmblemGroup.add(frontMesh);

    // Load Stock Bloc's real official Logo1.png emblem
    let isDisposed = false;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/Logo1.png",
      (loadedTex) => {
        if (isDisposed) {
          loadedTex.dispose();
          return;
        }
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.anisotropy = maxAnisotropy;
        loadedTex.needsUpdate = true;
        disposableTextures.push(loadedTex);

        // Preserve natural aspect ratio cleanly
        const img = loadedTex.image as HTMLImageElement | undefined;
        if (img && img.width && img.height) {
          const aspect = img.width / img.height;
          if (aspect > 1) {
            holoEmblemGroup.scale.set(1, 1 / aspect, 1);
          } else {
            holoEmblemGroup.scale.set(aspect, 1, 1);
          }
        }

        primaryHoloMat.uniforms.uMap.value = loadedTex;
        primaryHoloMat.uniforms.uHasMap.value = 1.0;
        echoHoloMat.uniforms.uMap.value = loadedTex;
        echoHoloMat.uniforms.uHasMap.value = 1.0;
        frontShimmerMat.uniforms.uMap.value = loadedTex;
        frontShimmerMat.uniforms.uHasMap.value = 1.0;
      },
      undefined,
      () => {
        // Graceful fallback if Logo1.png fails
        if (!isDisposed) setFallbackMode(true);
      },
    );

    // =========================================================================
    // 4. 3-AXIS COUNTER-ROTATING ALIEN FUI ASTROLABE RINGS
    // =========================================================================
    const outerRingTex = createAstrolabeRingTexture("outer");
    outerRingTex.anisotropy = maxAnisotropy;
    const midRingTex = createAstrolabeRingTexture("mid");
    midRingTex.anisotropy = maxAnisotropy;
    disposableTextures.push(outerRingTex, midRingTex);

    const outerDialGeo = new THREE.PlaneGeometry(4.15, 4.15);
    const midDialGeo = new THREE.PlaneGeometry(3.45, 3.45);
    disposableGeometries.push(outerDialGeo, midDialGeo);

    const outerDialMat = new THREE.MeshBasicMaterial({
      map: outerRingTex,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const midDialMat = new THREE.MeshBasicMaterial({
      map: midRingTex,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    disposableMaterials.push(outerDialMat, midDialMat);

    const outerRingPivot = new THREE.Group();
    outerRingPivot.position.set(0, 0.22, 0);
    outerRingPivot.rotation.set(Math.PI * 0.34, -0.25, 0.14);
    const outerRingMesh = new THREE.Mesh(outerDialGeo, outerDialMat);
    outerRingPivot.add(outerRingMesh);
    masterGroup.add(outerRingPivot);

    const midRingPivot = new THREE.Group();
    midRingPivot.position.set(0, 0.22, 0);
    midRingPivot.rotation.set(-Math.PI * 0.28, 0.42, -0.22);
    const midRingMesh = new THREE.Mesh(midDialGeo, midDialMat);
    midRingPivot.add(midRingMesh);
    masterGroup.add(midRingPivot);

    // 3rd Gyroscopic Plasma Ring with Orbiting Energy Orbs
    const gyroPivot = new THREE.Group();
    gyroPivot.position.set(0, 0.22, 0);
    gyroPivot.rotation.set(0.42, 0.2, 0.55);
    const gyroTorusGeo = new THREE.TorusGeometry(1.78, 0.014, 10, 80);
    const orbGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x00ff9d,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
    });
    disposableGeometries.push(gyroTorusGeo, orbGeo);
    disposableMaterials.push(orbMat);

    const gyroTorus = new THREE.Mesh(gyroTorusGeo, neonConduitMat);
    gyroPivot.add(gyroTorus);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0);
      gyroPivot.add(orb);
    }
    masterGroup.add(gyroPivot);

    // =========================================================================
    // 5. RISING HOLOGRAPHIC DATA MOTES INSIDE THE BEAM CONE
    // =========================================================================
    const particleCount = 110;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);
    const pAngles = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);

    const cCyan = new THREE.Color(0x00f5d4);
    const cEmerald = new THREE.Color(0x00ff9d);
    const cViolet = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      const y = -1.45 + Math.random() * 3.3;
      const t = (y + 1.45) / 3.3;
      const maxR = 0.55 + t * 1.35;
      const r = Math.random() * maxR;
      const a = Math.random() * Math.PI * 2;

      pRadii[i] = r;
      pAngles[i] = a;
      pSpeeds[i] = 0.35 + Math.random() * 0.55;

      pPositions[i * 3] = Math.cos(a) * r;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(a) * r;

      const pick = i % 3 === 0 ? cCyan : i % 3 === 1 ? cEmerald : cViolet;
      pColors[i * 3] = pick.r;
      pColors[i * 3 + 1] = pick.g;
      pColors[i * 3 + 2] = pick.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    disposableGeometries.push(pGeo);

    const pMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposableMaterials.push(pMat);
    const particles = new THREE.Points(pGeo, pMat);
    masterGroup.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // 6. SMOOTH INTERACTIVE POINTER PARALLAX + SOFTWARE-WEBGL PACED LOOP
    // =========================================================================
    const pointer = { targetX: 0, targetY: 0, curX: 0, curY: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const handlePointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(Math.floor(entry.contentRect.width), 240);
        const nh = Math.max(Math.floor(entry.contentRect.height), 240);
        camera.aspect = w / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(w, nh, false);
      }
    });
    resizeObserver.observe(container);

    let frameId = 0;
    let isPaused = document.hidden;
    let contextLost = false;
    let lastTime = performance.now();
    let elapsed = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === "function") {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed || isPaused || contextLost) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 6);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 6);
      } else {
        frameId = window.setTimeout(cb, 90);
      }
    };

    const tick = () => {
      if (isDisposed || isPaused || contextLost) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += dt;

      // Exponential damping for silky smooth pointer orbit parallax
      pointer.curX = THREE.MathUtils.damp(pointer.curX, pointer.targetX, 5.5, dt);
      pointer.curY = THREE.MathUtils.damp(pointer.curY, pointer.targetY, 5.5, dt);

      // Gentle holographic yaw oscillation + interactive tilt
      masterGroup.rotation.y =
        Math.sin(elapsed * 0.45) * 0.22 + pointer.curX * 0.58;
      masterGroup.rotation.x = pointer.curY * 0.24;

      // Floating anti-gravity bob on the official emblem hologram
      holoEmblemGroup.position.y = 0.24 + Math.sin(elapsed * 1.65) * 0.09;
      // Subtle counter-tilt depth parallax on echo plane
      echoMesh.position.x = -pointer.curX * 0.08;
      echoMesh.position.y = pointer.curY * 0.06;

      // Counter-rotating 3-axis alien astrolabe HUD rings
      outerRingMesh.rotation.z = elapsed * 0.28;
      midRingMesh.rotation.z = -elapsed * 0.42;
      gyroPivot.rotation.z = elapsed * 0.55;
      gyroPivot.rotation.y = elapsed * 0.18;
      radarMesh.rotation.z = -elapsed * 0.45;

      // Update GLSL shader uniforms
      beamMat.uniforms.uTime.value = elapsed;
      primaryHoloMat.uniforms.uTime.value = elapsed;
      echoHoloMat.uniforms.uTime.value = elapsed;
      frontShimmerMat.uniforms.uTime.value = elapsed;

      // Rising plasma data motes
      const posAttr = pGeo.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        let y = arr[i * 3 + 1] + pSpeeds[i] * dt;
        if (y > 1.85) y = -1.45;
        pAngles[i] += 0.35 * dt;
        const t = (y + 1.45) / 3.3;
        const r = Math.min(pRadii[i], 0.52 + t * 1.32);
        arr[i * 3] = Math.cos(pAngles[i]) * r;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = Math.sin(pAngles[i]) * r;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const scheduleNext = () => {
      if (isDisposed || isPaused || contextLost) return;
      lastTime = performance.now();
      frameId = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (isPaused) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      } else {
        scheduleNext();
      }
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
    };

    const handleContextRestored = () => {
      contextLost = false;
      scheduleNext();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );

    scheduleNext();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );

      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, [height, interactive]);

  if (fallbackMode) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[#020710] ${className}`}
        style={{ height }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(0,245,212,0.22), rgba(168,85,247,0.08) 48%, transparent 72%)",
          }}
        />
        {/* Rotating SVG Alien Astrolabe Fallback */}
        <svg
          aria-hidden="true"
          viewBox="0 0 260 260"
          className="absolute w-60 h-60 opacity-65 xeno-spin-slow pointer-events-none"
        >
          <circle
            cx="130"
            cy="130"
            r="116"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="1.2"
            strokeDasharray="36 12 8 12"
          />
          <circle
            cx="130"
            cy="130"
            r="96"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="20 24"
          />
        </svg>
        <img
          src="/Logo1.png"
          alt="Stock Bloc Holographic Emblem"
          referrerPolicy="no-referrer"
          className="relative z-10 w-44 h-44 object-contain drop-shadow-[0_0_26px_rgba(0,245,212,0.65)]"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{
        height,
        background:
          "radial-gradient(85% 75% at 50% 48%, rgba(0, 229, 255, 0.14) 0%, rgba(7, 18, 36, 0.65) 55%, rgba(2, 6, 13, 0.96) 100%)",
      }}
      aria-label="Interactive 3D Stock Bloc Holographic Emblem Projector"
    >
      {/* Isolated WebGL Mount Container (Zero backdrop-filter layered over canvas) */}
      <div ref={canvasMountRef} className="absolute inset-0" />

      {/* Crisp Alien HUD Corner Reticles (Non-blocking SVG framing, no blur) */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        preserveAspectRatio="none"
        viewBox="0 0 400 340"
      >
        {/* Top-left bracket */}
        <path
          d="M 14 42 L 14 14 L 46 14"
          fill="none"
          stroke="#00f5d4"
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />
        {/* Top-right bracket */}
        <path
          d="M 354 14 L 386 14 L 386 42"
          fill="none"
          stroke="#00f5d4"
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />
        {/* Bottom-left bracket */}
        <path
          d="M 14 298 L 14 326 L 46 326"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />
        {/* Bottom-right bracket */}
        <path
          d="M 354 326 L 386 326 L 386 298"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />
        {/* Subtle horizontal calibration tick notches */}
        <line
          x1="14"
          y1="170"
          x2="26"
          y2="170"
          stroke="#00e5ff"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />
        <line
          x1="374"
          y1="170"
          x2="386"
          y2="170"
          stroke="#00e5ff"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />
      </svg>
    </div>
  );
};

export default SpatialEmblem3D;
