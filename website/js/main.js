import * as THREE from 'three';

/* ============================================================
   BLNR landing — 3D motion scene
   Шёлковая ткань на вершинном шейдере + поле частиц.
   Камера реагирует на скролл и движение мыши (параллакс).
   ============================================================ */

const canvas = document.getElementById('scene');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x12100d, 0.055);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 7);

/* ---------- шёлковая ткань (шейдер) ---------- */
const clothUniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color('#d2693c') },
  uColorB: { value: new THREE.Color('#1c1915') },
  uColorC: { value: new THREE.Color('#e8956b') },
};

const clothMaterial = new THREE.ShaderMaterial({
  uniforms: clothUniforms,
  side: THREE.DoubleSide,
  transparent: true,
  vertexShader: /* glsl */ `
    uniform float uTime;
    varying float vElevation;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 p = position;
      float wave1 = sin(p.x * 1.3 + uTime * 0.7) * 0.35;
      float wave2 = sin(p.y * 1.8 - uTime * 0.45) * 0.28;
      float wave3 = sin((p.x + p.y) * 0.8 + uTime * 0.3) * 0.42;
      p.z += wave1 + wave2 + wave3;
      vElevation = p.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying float vElevation;
    varying vec2 vUv;

    void main() {
      float t = smoothstep(-1.0, 1.0, vElevation);
      vec3 color = mix(uColorB, uColorA, t);
      color = mix(color, uColorC, pow(t, 3.0) * 0.6);
      float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
                     * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
      gl_FragColor = vec4(color, edgeFade * 0.9);
    }
  `,
});

const cloth = new THREE.Mesh(new THREE.PlaneGeometry(16, 10, 140, 90), clothMaterial);
cloth.rotation.x = -0.9;
cloth.position.set(0, -1.6, 0);
scene.add(cloth);

/* ---------- поле частиц («пылинки в гардеробной») ---------- */
const COUNT = 700;
const positions = new Float32Array(COUNT * 3);
const speeds = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 22;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
  speeds[i] = 0.2 + Math.random() * 0.8;
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    color: 0xe8956b,
    size: 0.035,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
scene.add(particles);

/* ---------- плавающие кольца (вешалки-абстракции) ---------- */
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0xf4efe6,
  wireframe: true,
  transparent: true,
  opacity: 0.16,
});
const rings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 + i * 0.7, 0.012, 12, 90), ringMaterial);
  ring.position.set(3.4 - i * 0.4, 1.2 - i * 0.5, -2 - i * 1.5);
  ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  rings.push(ring);
  scene.add(ring);
}

/* ---------- интерактив: мышь + скролл ---------- */
const mouse = { x: 0, y: 0 };
let scrollProgress = 0;

window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener(
  'scroll',
  () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  },
  { passive: true },
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- цикл анимации ---------- */
const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();
  clothUniforms.uTime.value = prefersReducedMotion ? 0 : t;

  // частицы медленно «всплывают»
  if (!prefersReducedMotion) {
    const pos = particleGeometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + speeds[i] * 0.0035;
      if (y > 6) y = -6;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    rings.forEach((ring, i) => {
      ring.rotation.x += 0.0009 * (i + 1);
      ring.rotation.y += 0.0012 * (i + 1);
      ring.position.y += Math.sin(t * 0.5 + i) * 0.0009;
    });
  }

  // камера: параллакс от мыши + погружение при скролле
  const targetX = mouse.x * 0.7;
  const targetY = 0.4 - mouse.y * 0.45 - scrollProgress * 2.2;
  const targetZ = 7 - scrollProgress * 2.8;
  camera.position.x += (targetX - camera.position.x) * 0.04;
  camera.position.y += (targetY - camera.position.y) * 0.04;
  camera.position.z += (targetZ - camera.position.z) * 0.04;
  camera.lookAt(0, -0.4 - scrollProgress * 1.4, 0);

  // ткань слегка «уплывает» вниз по мере скролла
  cloth.rotation.x = -0.9 - scrollProgress * 0.35;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* ============================================================
   Reveal-анимации при скролле + 3D-tilt карточек
   ============================================================ */

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 70}ms`;
  observer.observe(el);
});

if (!prefersReducedMotion) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}
