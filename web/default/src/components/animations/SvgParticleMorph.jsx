import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

/**
 * SvgParticleMorph — renders SVG shapes as scattered particle point clouds
 * and morphs between them when `activeIndex` changes.
 * Uses OrthographicCamera + fixed pixel-size points for consistent star-dust look.
 */

const SAMPLE_RES = 512; // higher res for better sampling fidelity

function sampleSvgPoints(pathData, viewBox, count, jitter) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_RES;
  canvas.height = SAMPLE_RES;
  const ctx = canvas.getContext('2d');

  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
  const scale = SAMPLE_RES / Math.max(vw, vh);
  const offX = (SAMPLE_RES - vw * scale) / 2;
  const offY = (SAMPLE_RES - vh * scale) / 2;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SAMPLE_RES, SAMPLE_RES);

  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);
  ctx.translate(-vx, -vy);

  pathData.forEach((p) => {
    const path2d = new Path2D(p.d);
    if (p.fill && p.fill !== 'none') {
      ctx.fillStyle = '#fff';
      ctx.fill(path2d);
    }
    if (p.stroke && p.stroke !== 'none') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = p.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(path2d);
    }
    if (!p.fill && !p.stroke) {
      ctx.fillStyle = '#fff';
      ctx.fill(path2d);
    }
  });
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES);
  const pixels = imageData.data;
  const candidates = [];

  for (let y = 0; y < SAMPLE_RES; y++) {
    for (let x = 0; x < SAMPLE_RES; x++) {
      const idx = (y * SAMPLE_RES + x) * 4;
      if (pixels[idx] > 128) {
        candidates.push(x, y);
      }
    }
  }

  const points = new Float32Array(count * 3);
  const numCandidates = candidates.length / 2;

  if (numCandidates === 0) {
    for (let i = 0; i < count; i++) {
      points[i * 3] = (Math.random() - 0.5) * 2;
      points[i * 3 + 1] = (Math.random() - 0.5) * 2;
      points[i * 3 + 2] = 0;
    }
    return points;
  }

  for (let i = 0; i < count; i++) {
    const ci = Math.floor(Math.random() * numCandidates);
    const px = candidates[ci * 2];
    const py = candidates[ci * 2 + 1];

    // Normalize to [-1, 1], flip Y, then scale down to fit within frustum
    const nx = ((px / SAMPLE_RES) * 2 - 1) * 0.8;
    const ny = -(((py / SAMPLE_RES) * 2 - 1)) * 0.8;

    points[i * 3] = nx + (Math.random() - 0.5) * jitter;
    points[i * 3 + 1] = ny + (Math.random() - 0.5) * jitter;
    points[i * 3 + 2] = (Math.random() - 0.5) * jitter * 0.2;
  }

  return points;
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function SvgParticleMorph({
  svgPaths,
  activeIndex = 0,
  particleCount = 3000,
  color = '#ffffff',
  size = 1.5,
  jitter = 0.15,
  morphDuration = 1200,
}) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const morphRef = useRef({
    from: null,
    to: null,
    startTime: 0,
    active: false,
    currentIndex: 0,
  });
  const shapesRef = useRef(null);

  const initShapes = useCallback(() => {
    if (shapesRef.current) return shapesRef.current;
    const shapes = svgPaths.map((svg) =>
      sampleSvgPoints(svg.paths, svg.viewBox, particleCount, jitter)
    );
    shapesRef.current = shapes;
    return shapes;
  }, [svgPaths, particleCount, jitter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const shapes = initShapes();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearAlpha(0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Orthographic camera: base frustum covers particle range [-0.8,0.8] with padding
    const frustum = 1.2;
    const camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0, 10);
    camera.position.z = 1;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(shapes[0]);
    const alphas = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      alphas[i] = 0.15 + Math.random() * 0.85;
      // Random size variation: some tiny, some slightly bigger
      sizes[i] = (0.5 + Math.random() * 1.0) * size;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float alpha;
        attribute float aSize;
        varying float vAlpha;
        uniform float uDpr;
        void main() {
          vAlpha = alpha;
          gl_PointSize = aSize * uDpr;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          float a = smoothstep(1.0, 0.3, d);
          gl_FragColor = vec4(uColor, a * vAlpha * 0.8);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uDpr: { value: dpr },
      },
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Per-particle random delay
    const delays = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      delays[i] = Math.random() * 0.4;
    }

    morphRef.current.currentIndex = activeIndex;

    const setSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      if (aspect >= 1) {
        // Wide container: expand horizontal, keep vertical fixed
        camera.left = -frustum * aspect;
        camera.right = frustum * aspect;
        camera.top = frustum;
        camera.bottom = -frustum;
      } else {
        // Tall container: expand vertical, keep horizontal fixed
        camera.left = -frustum;
        camera.right = frustum;
        camera.top = frustum / aspect;
        camera.bottom = -frustum / aspect;
      }
      camera.updateProjectionMatrix();
    };
    setSize();

    let resizeTimer;
    const ro = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setSize, 100); });
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(container);

    let raf = 0;
    const posArr = geometry.attributes.position.array;
    const now = performance.now.bind(performance);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;

      const t = now();

      if (morphRef.current.active) {
        const elapsed = t - morphRef.current.startTime;
        const dur = morphDuration;
        const from = morphRef.current.from;
        const to = morphRef.current.to;

        let allDone = true;
        for (let i = 0; i < particleCount; i++) {
          const delay = delays[i] * dur;
          const localT = Math.max(0, elapsed - delay) / (dur * 0.6);
          const progress = Math.min(1, localT);
          const eased = easeOutExpo(progress);
          if (progress < 1) allDone = false;

          const i3 = i * 3;
          posArr[i3] = from[i3] + (to[i3] - from[i3]) * eased;
          posArr[i3 + 1] = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * eased;
          posArr[i3 + 2] = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * eased;
        }
        geometry.attributes.position.needsUpdate = true;

        if (allDone) morphRef.current.active = false;
      }

      // Very subtle rotation for life
      points.rotation.y = Math.sin(t * 0.0002) * 0.08;
      points.rotation.x = Math.cos(t * 0.00015) * 0.03;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    threeRef.current = { renderer, scene, camera, geometry, material, points, ro, io, raf, posArr, shapes, delays };

    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      threeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Morph on activeIndex change
  useEffect(() => {
    if (!threeRef.current || !shapesRef.current) return;
    const { posArr, shapes, delays } = threeRef.current;
    const prevIdx = morphRef.current.currentIndex;
    if (prevIdx === activeIndex) return;

    const from = new Float32Array(posArr);
    const to = shapes[activeIndex];

    for (let i = 0; i < particleCount; i++) {
      delays[i] = Math.random() * 0.4;
    }

    morphRef.current = {
      from,
      to,
      startTime: performance.now(),
      active: true,
      currentIndex: activeIndex,
    };
  }, [activeIndex, particleCount]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      aria-hidden='true'
    />
  );
}
