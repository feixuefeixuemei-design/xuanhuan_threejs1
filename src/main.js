import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ================================
// 0. Section 随机错落布局
// ================================
const sections = document.querySelectorAll('main section');
sections.forEach((sec, i) => {
  // 随机左右偏移 -5 ~ 5 vw
  const offsetX = (Math.random() - 0.5) * 10;
  sec.style.transform = `translateX(${offsetX}vw)`;
  // 随机 min-height 180 ~ 260px
  sec.style.minHeight = `${180 + Math.floor(Math.random() * 80)}px`;
  // 随机 margin-bottom 140 ~ 220px
  sec.style.marginBottom = `${140 + Math.floor(Math.random() * 80)}px`;
});

// ================================
// 1. 场景配置
// ================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);
scene.fog = new THREE.FogExp2(0x050508, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 60, 130);

const renderer = new THREE.WebGLRenderer({ 
  canvas: document.querySelector('#bg'), 
  antialias: true 
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;

// ================================
// 2. 动态 Low-Poly 山脉
// ================================
const mountainGeo = new THREE.PlaneGeometry(600, 600, 55, 55);
const count = mountainGeo.attributes.position.count;
mountainGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

const mountainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  transparent: true,
  opacity: 0.95,
  roughness: 1.0
});
const mountain = new THREE.Mesh(mountainGeo, mountainMat);
mountain.rotation.x = -Math.PI / 2;
mountain.position.y = -40;
scene.add(mountain);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const blueLight = new THREE.PointLight(0x00ffff, 30000, 2000);
blueLight.position.set(100, 200, 100);
scene.add(blueLight);

// ================================
// 3. 远景积云
// ================================
const cloudGroups = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xeeeeff, transparent: true, opacity: 0.2, depthWrite: false });
for (let i = 0; i < 20; i++) {
  const group = new THREE.Group();
  for (let j = 0; j < 6; j++) {
    const radius = Math.random() * 10 + 5;
    const part = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), cloudMat);
    part.position.set(Math.random() * 30 - 15, Math.random() * 10 - 5, Math.random() * 30 - 15);
    part.scale.set(3, 0.6, 1.5);
    group.add(part);
  }
  group.position.set((Math.random() - 0.5) * 1000, 65 + Math.random() * 50, -Math.random() * 400 + 50);
  scene.add(group);
  cloudGroups.push({ mesh: group, speed: 0.05 + Math.random() * 0.1 });
}

// ================================
// 4. 图片布局
// ================================
const planes = [];
const loader = new THREE.TextureLoader();
const imgNames = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'];
let activePlane = null;

for (let i = 0; i < 5; i++) {
  const texture = loader.load(imgNames[i]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 16, 25, 25), 
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, fog: false })
  );

  const angle = (i / 4) * Math.PI - Math.PI / 2;
  const baseRadius = 60;
  const px = Math.sin(angle) * baseRadius + (Math.random() - 0.5) * 15;
  const pz = Math.cos(angle) * baseRadius - 20 + (Math.random() - 0.5) * 15;
  const py = 20 + (Math.random() - 0.5) * 40;

  mesh.position.set(px, py, pz);
  mesh.lookAt(0, 15, 0);
  mesh.rotation.z += (Math.random() - 0.5) * 0.4;

  mesh.userData = { 
    index: i, 
    originalPos: mesh.position.clone(), 
    originalRot: mesh.quaternion.clone(), 
    floatSpeed: 0.4 + Math.random() * 0.5, 
    windFreq: 1.8 + Math.random() * 1.5 
  };
  scene.add(mesh);
  planes.push(mesh);
}

// ================================
// 5. 圆润发光星空
// ================================
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'white');
  grad.addColorStop(0.3, 'rgba(0, 255, 255, 0.4)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}
const starsGeo = new THREE.BufferGeometry();
const starArray = new Float32Array(7000 * 3);
for (let i = 0; i < 21000; i++) starArray[i] = (Math.random() - 0.5) * 1600;
starsGeo.setAttribute('position', new THREE.BufferAttribute(starArray, 3));
const starField = new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 5, map: createStarTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(starField);

// ================================
// 6. 交互逻辑
// ================================
let scrollPercent = 0;
window.addEventListener('scroll', () => {
  scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
  camera.position.x = Math.sin(scrollPercent * Math.PI * 1.5) * 85;
  camera.position.y = 65 - (scrollPercent * 35);
  camera.position.z = 135 - (scrollPercent * 100); 
  camera.lookAt(Math.sin(scrollPercent * Math.PI) * 20, 10, -scrollPercent * 60);
});

window.addEventListener('click', (e) => {
  const mouse = new THREE.Vector2((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planes);
  
  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    activePlane = (activePlane === clicked) ? null : clicked;
  } else {
    activePlane = null;
  }
});

// ================================
// 7. 动画循环
// ================================
let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // --- 山脉波动 ---
  const mPos = mountainGeo.attributes.position;
  const mCol = mountainGeo.attributes.color;
  for (let i = 0; i < mPos.count; i++) {
    const px = mPos.getX(i);
    const py = mPos.getY(i);
    let z = Math.sin(px * 0.05 + elapsed * 0.4) * 16 + Math.cos(py * 0.06 + elapsed * 0.5) * 12;
    z += Math.sin(px * 0.15 + py * 0.15) * 5;
    if (z > 0) z *= 1.8;
    mPos.setZ(i, z);
    const mix = (z + 15) / 50;
    mCol.setXYZ(i, mix * 0.05, 0.4 + mix * 0.6, 0.7 + (1 - mix) * 0.3);
  }
  mPos.needsUpdate = true; mCol.needsUpdate = true;
  mountainGeo.computeVertexNormals();

  // --- 图片漂浮与选中 ---
  planes.forEach((p) => {
    const vPos = p.geometry.attributes.position;
    if (activePlane === p) {
      const targetPos = new THREE.Vector3(0, 0, -22).applyQuaternion(camera.quaternion).add(camera.position);
      p.position.lerp(targetPos, 0.1);
      p.quaternion.slerp(camera.quaternion, 0.1);
      p.scale.lerp(new THREE.Vector3(1.6, 1.6, 1.6), 0.1);
      for (let i = 0; i < vPos.count; i++) vPos.setZ(i, 0);
    } else {
      p.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      let fPos = p.userData.originalPos.clone();
      fPos.z -= scrollPercent * 40;
      if (activePlane) fPos.x += (p.userData.index < activePlane.userData.index ? -35 : 35);
      p.position.lerp(fPos, 0.08);
      p.quaternion.slerp(p.userData.originalRot, 0.08);
      p.position.y += Math.sin(elapsed * p.userData.floatSpeed) * 0.06;
      for (let i = 0; i < vPos.count; i++) vPos.setZ(i, Math.sin(vPos.getX(i) * 0.5 + elapsed * p.userData.windFreq) * 0.7);
    }
    vPos.needsUpdate = true;
  });

  cloudGroups.forEach(c => {
    c.mesh.position.x += c.speed;
    if (c.mesh.position.x > 500) c.mesh.position.x = -500;
  });

  starField.rotation.y += 0.0002;
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
