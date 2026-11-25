// ==================== 全局导航切换 ====================
const navButtons = document.querySelectorAll('.nav-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
let activeTab = 'particles';

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    activeTab = target;

    navButtons.forEach((b) => b.classList.remove('active'));
    tabPanels.forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`tab-${target}`).classList.add('active');

    if (target === 'particles') resizeParticleCanvas();
    if (target === 'synth') resizeScopeCanvas();
  });
});

// ==================== 模块 1：引力粒子画板 ====================
const pCanvas = document.getElementById('particle-canvas');
const pCtx = pCanvas.getContext('2d');
const pCountEl = document.getElementById('particle-count');
const pModeEl = document.getElementById('particle-mode');
const pTrailEl = document.getElementById('particle-trail');

let particles = [];
const pointer = { x: 0, y: 0, active: false };

function resizeParticleCanvas() {
  const rect = pCanvas.parentElement.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    pCanvas.width = rect.width;
    pCanvas.height = rect.height;
  }
}
window.addEventListener('resize', () => {
  resizeParticleCanvas();
  resizeScopeCanvas();
});
resizeParticleCanvas();

class Particle {
  constructor(x, y, vx, vy, hue) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.hue = hue;
    this.size = Math.random() * 3 + 1.5;
    this.life = 1;
    this.decay = Math.random() * 0.004 + 0.002;
  }

  update(mode) {
    if (pointer.active && mode !== 'firework') {
      const dx = pointer.x - this.x;
      const dy = pointer.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = Math.min(180 / (dist + 20), 2.5);

      if (mode === 'attract') {
        this.vx += (dx / dist) * force * 0.25;
        this.vy += (dy / dist) * force * 0.25;
      } else if (mode === 'repel') {
        if (dist < 160) {
          this.vx -= (dx / dist) * force * 0.6;
          this.vy -= (dy / dist) * force * 0.6;
        }
      } else if (mode === 'orbit') {
        // 切向力 + 轻微向心力实现环绕
        this.vx += (-dy / dist) * 0.35 + (dx / dist) * 0.08;
        this.vy += (dx / dist) * 0.35 + (dy / dist) * 0.08;
      }
    }

    if (mode === 'firework') {
      this.vy += 0.04; // 重力下落
    }

    this.vx *= 0.985;
    this.vy *= 0.985;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;

    // 边界反弹
    if (this.x < 0 || this.x > pCanvas.width) this.vx *= -0.8;
    if (this.y < 0 || this.y > pCanvas.height) this.vy *= -0.8;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${Math.max(this.life, 0)})`;
    ctx.fill();
  }
}

function spawnParticles(x, y, count = 6, speed = 3) {
  const baseHue = (Date.now() * 0.05) % 360;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel = Math.random() * speed + 0.5;
    particles.push(
      new Particle(
        x,
        y,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel,
        (baseHue + Math.random() * 50) % 360
      )
    );
  }
  if (particles.length > 900) {
    particles.splice(0, particles.length - 900);
  }
}

pCanvas.addEventListener('pointermove', (e) => {
  const rect = pCanvas.getBoundingClientRect();
  pointer.x = e.clientX - rect.left;
  pointer.y = e.clientY - rect.top;
  pointer.active = true;
  if (pModeEl.value !== 'firework') {
    spawnParticles(pointer.x, pointer.y, 3, 2.2);
  }
});

pCanvas.addEventListener('pointerdown', (e) => {
  const rect = pCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  spawnParticles(x, y, pModeEl.value === 'firework' ? 45 : 20, 5.5);
});

pCanvas.addEventListener('pointerleave', () => {
  pointer.active = false;
});

document.getElementById('btn-burst').addEventListener('click', () => {
  const x = Math.random() * pCanvas.width;
  const y = Math.random() * pCanvas.height;
  spawnParticles(x, y, 60, 6);
});

document.getElementById('btn-clear-particles').addEventListener('click', () => {
  particles = [];
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
});

document.getElementById('btn-save-art').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `nexus-particles-${Date.now()}.png`;
  link.href = pCanvas.toDataURL('image/png');
  link.click();
});

function animateParticles() {
  if (activeTab === 'particles') {
    const trailAlpha = parseFloat(pTrailEl.value);
    pCtx.fillStyle = `rgba(5, 8, 17, ${trailAlpha})`;
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

    const mode = pModeEl.value;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(mode);
      p.draw(pCtx);
      if (p.life <= 0) particles.splice(i, 1);
    }
    pCountEl.textContent = particles.length;
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ==================== 模块 2：赛博电子琴与节拍器 ====================
let audioCtx = null;
let analyser = null;
const scopeCanvas = document.getElementById('synth-scope');
const scopeCtx = scopeCanvas.getContext('2d');
const waveSelect = document.getElementById('synth-wave');
const volumeSlider = document.getElementById('synth-volume');

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.connect(audioCtx.destination);
    drawScope();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function resizeScopeCanvas() {
  const rect = scopeCanvas.parentElement.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    scopeCanvas.width = rect.width;
    scopeCanvas.height = rect.height;
  }
}
resizeScopeCanvas();

const NOTES = [
  { note: 'C4', freq: 261.63, key: 'a', type: 'white' },
  { note: 'C#4', freq: 277.18, key: 'w', type: 'black' },
  { note: 'D4', freq: 293.66, key: 's', type: 'white' },
  { note: 'D#4', freq: 311.13, key: 'e', type: 'black' },
  { note: 'E4', freq: 329.63, key: 'd', type: 'white' },
  { note: 'F4', freq: 349.23, key: 'f', type: 'white' },
  { note: 'F#4', freq: 369.99, key: 't', type: 'black' },
  { note: 'G4', freq: 392.0, key: 'g', type: 'white' },
  { note: 'G#4', freq: 415.3, key: 'y', type: 'black' },
  { note: 'A4', freq: 440.0, key: 'h', type: 'white' },
  { note: 'A#4', freq: 466.16, key: 'u', type: 'black' },
  { note: 'B4', freq: 493.88, key: 'j', type: 'white' },
  { note: 'C5', freq: 523.25, key: 'k', type: 'white' },
];

const pianoEl = document.getElementById('piano-keyboard');
const keyElements = {};

NOTES.forEach((item) => {
  const btn = document.createElement('div');
  btn.className = `piano-key ${item.type}`;
  btn.innerHTML = `<span>${item.note}</span><small>${item.key.toUpperCase()}</small>`;
  btn.addEventListener('pointerdown', () => playNote(item.freq, btn));
  pianoEl.appendChild(btn);
  keyElements[item.key] = { ...item, el: btn };
});

function playNote(freq, el) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = waveSelect.value;
  osc.frequency.setValueAtTime(freq, now);

  const vol = parseFloat(volumeSlider.value);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  osc.connect(gain);
  gain.connect(analyser);

  osc.start(now);
  osc.stop(now + 0.56);

  if (el) {
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 180);
  }
}

function playDrum(type) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const vol = parseFloat(volumeSlider.value);

  if (type === 'kick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain.gain.setValueAtTime(vol * 1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(analyser);
    osc.start(now);
    osc.stop(now + 0.23);
  } else {
    // 使用白噪声合成军鼓 / 踩镲 / 拍手
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type === 'hihat' ? 'highpass' : 'bandpass';
    filter.frequency.value = type === 'hihat' ? 6500 : type === 'clap' ? 1800 : 1000;

    const gain = audioCtx.createGain();
    const duration = type === 'hihat' ? 0.08 : 0.18;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    noise.start(now);
    noise.stop(now + duration);
  }
}

document.querySelectorAll('.drum-btn').forEach((btn) => {
  btn.addEventListener('pointerdown', () => {
    playDrum(btn.dataset.drum);
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 120);
  });
});

window.addEventListener('keydown', (e) => {
  if (activeTab !== 'synth' || e.repeat) return;
  const k = e.key.toLowerCase();
  if (keyElements[k]) {
    playNote(keyElements[k].freq, keyElements[k].el);
  }
  const drumMap = { '1': 'kick', '2': 'snare', '3': 'hihat', '4': 'clap' };
  if (drumMap[k]) {
    playDrum(drumMap[k]);
  }
});

function drawScope() {
  if (analyser && activeTab === 'synth') {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    scopeCtx.fillStyle = '#050811';
    scopeCtx.fillRect(0, 0, scopeCanvas.width, scopeCanvas.height);

    scopeCtx.lineWidth = 2.5;
    scopeCtx.strokeStyle = '#06b6d4';
    scopeCtx.beginPath();

    const sliceWidth = scopeCanvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * scopeCanvas.height) / 2;
      if (i === 0) scopeCtx.moveTo(x, y);
      else scopeCtx.lineTo(x, y);
      x += sliceWidth;
    }
    scopeCtx.lineTo(scopeCanvas.width, scopeCanvas.height / 2);
    scopeCtx.stroke();
  }
  requestAnimationFrame(drawScope);
}

// ==================== 模块 3：AI 寻路算法可视化 ====================
const ROWS = 15;
const COLS = 25;
const pfGridEl = document.getElementById('pf-grid');
const pfAlgoEl = document.getElementById('pf-algo');
const pfBrushEl = document.getElementById('pf-brush');
const pfStatusEl = document.getElementById('pf-status');
const pfVisitedEl = document.getElementById('pf-visited');
const pfLengthEl = document.getElementById('pf-length');

let startPos = { r: 7, c: 3 };
let endPos = { r: 7, c: 21 };
let walls = new Set();
let isDrawing = false;
let pfRunId = 0;
const cellEls = [];

function keyOf(r, c) {
  return `${r},${c}`;
}

function initGrid() {
  pfGridEl.innerHTML = '';
  cellEls.length = 0;
  for (let r = 0; r < ROWS; r++) {
    const rowArr = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'pf-cell';
      cell.addEventListener('pointerdown', () => {
        isDrawing = true;
        applyBrush(r, c);
      });
      cell.addEventListener('pointerenter', () => {
        if (isDrawing && pfBrushEl.value === 'wall') applyBrush(r, c);
      });
      pfGridEl.appendChild(cell);
      rowArr.push(cell);
    }
    cellEls.push(rowArr);
  }
  renderGridState();
}
window.addEventListener('pointerup', () => (isDrawing = false));

function applyBrush(r, c) {
  pfRunId++; // 停止正在进行的动画
  clearPathVisuals();
  const k = keyOf(r, c);
  const brush = pfBrushEl.value;

  if (brush === 'start') {
    if (k !== keyOf(endPos.r, endPos.c)) {
      walls.delete(k);
      startPos = { r, c };
    }
  } else if (brush === 'end') {
    if (k !== keyOf(startPos.r, startPos.c)) {
      walls.delete(k);
      endPos = { r, c };
    }
  } else {
    if (k !== keyOf(startPos.r, startPos.c) && k !== keyOf(endPos.r, endPos.c)) {
      if (walls.has(k)) walls.delete(k);
      else walls.add(k);
    }
  }
  renderGridState();
}

function renderGridState() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = cellEls[r][c];
      el.classList.remove('wall', 'start', 'end');
      const k = keyOf(r, c);
      if (r === startPos.r && c === startPos.c) el.classList.add('start');
      else if (r === endPos.r && c === endPos.c) el.classList.add('end');
      else if (walls.has(k)) el.classList.add('wall');
    }
  }
}

function clearPathVisuals() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cellEls[r][c].classList.remove('visited', 'path');
    }
  }
  pfVisitedEl.textContent = '0';
  pfLengthEl.textContent = '0';
  pfStatusEl.textContent = '就绪';
}

document.getElementById('btn-pf-maze').addEventListener('click', () => {
  pfRunId++;
  walls.clear();
  clearPathVisuals();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = keyOf(r, c);
      if (k !== keyOf(startPos.r, startPos.c) && k !== keyOf(endPos.r, endPos.c)) {
        if (Math.random() < 0.26) walls.add(k);
      }
    }
  }
  renderGridState();
});

document.getElementById('btn-pf-clear').addEventListener('click', () => {
  pfRunId++;
  walls.clear();
  clearPathVisuals();
  renderGridState();
});

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

document.getElementById('btn-pf-run').addEventListener('click', async () => {
  const currentRun = ++pfRunId;
  clearPathVisuals();
  pfStatusEl.textContent = '搜索中...';

  const algo = pfAlgoEl.value;
  const startKey = keyOf(startPos.r, startPos.c);
  const endKey = keyOf(endPos.r, endPos.c);

  const open = [{ r: startPos.r, c: startPos.c, g: 0, f: 0 }];
  const dist = { [startKey]: 0 };
  const parent = {};
  const visitedOrder = [];
  const closed = new Set();
  let found = false;

  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];

  while (open.length > 0) {
    if (algo !== 'bfs') {
      open.sort((a, b) => a.f - b.f);
    }
    const curr = open.shift();
    const ck = keyOf(curr.r, curr.c);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (ck !== startKey && ck !== endKey) visitedOrder.push(curr);
    if (ck === endKey) {
      found = true;
      break;
    }

    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const nk = keyOf(nr, nc);
      if (walls.has(nk) || closed.has(nk)) continue;

      const ng = curr.g + 1;
      if (dist[nk] === undefined || ng < dist[nk]) {
        dist[nk] = ng;
        parent[nk] = ck;
        const h = algo === 'astar' ? Math.abs(nr - endPos.r) + Math.abs(nc - endPos.c) : 0;
        open.push({ r: nr, c: nc, g: ng, f: ng + h });
      }
    }
  }

  // 动画播放探索过程
  for (let i = 0; i < visitedOrder.length; i++) {
    if (pfRunId !== currentRun) return;
    const { r, c } = visitedOrder[i];
    cellEls[r][c].classList.add('visited');
    pfVisitedEl.textContent = i + 1;
    await sleep(12);
  }

  if (!found) {
    pfStatusEl.textContent = '无法到达终点 ❌';
    return;
  }

  // 回溯最短路径
  const path = [];
  let trace = endKey;
  while (trace && trace !== startKey) {
    const [r, c] = trace.split(',').map(Number);
    if (trace !== endKey) path.unshift({ r, c });
    trace = parent[trace];
  }

  for (const { r, c } of path) {
    if (pfRunId !== currentRun) return;
    cellEls[r][c].classList.add('path');
    await sleep(22);
  }

  pfLengthEl.textContent = path.length + 1;
  pfStatusEl.textContent = '找到最短路径 ✅';
});

initGrid();

// ==================== 模块 4：决策大转盘 ====================
const wCanvas = document.getElementById('wheel-canvas');
const wCtx = wCanvas.getContext('2d');
const wOptionsEl = document.getElementById('wheel-options');
const wResultEl = document.getElementById('wheel-result');

const PRESETS = {
  food: ['火锅', '麻辣烫', '黄焖鸡', '轻食沙拉', '烤肉', '拉面'],
  study: ['Python 自动化', 'LangChain Agent', 'React 前端', 'SQL 数据分析', '算法刷题'],
  relax: ['看一部电影', '散步听播客', '打一局游戏', '喝杯奶茶发呆', '早点睡觉'],
};

const SLICE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];
let wheelItems = [...PRESETS.food];
let currentAngle = 0;
let isSpinning = false;

wOptionsEl.value = wheelItems.join('\n');

function drawWheel() {
  const cx = wCanvas.width / 2;
  const cy = wCanvas.height / 2;
  const radius = cx - 10;
  wCtx.clearRect(0, 0, wCanvas.width, wCanvas.height);

  if (wheelItems.length === 0) return;
  const arc = (Math.PI * 2) / wheelItems.length;

  wheelItems.forEach((label, i) => {
    const start = currentAngle + i * arc;
    const end = start + arc;

    wCtx.beginPath();
    wCtx.moveTo(cx, cy);
    wCtx.arc(cx, cy, radius, start, end);
    wCtx.closePath();
    wCtx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
    wCtx.fill();
    wCtx.strokeStyle = '#0b0f19';
    wCtx.lineWidth = 3;
    wCtx.stroke();

    // 绘制文字
    wCtx.save();
    wCtx.translate(cx, cy);
    wCtx.rotate(start + arc / 2);
    wCtx.textAlign = 'right';
    wCtx.fillStyle = '#fff';
    wCtx.font = 'bold 15px sans-serif';
    wCtx.fillText(label.slice(0, 10), radius - 20, 5);
    wCtx.restore();
  });

  // 中心圆点
  wCtx.beginPath();
  wCtx.arc(cx, cy, 22, 0, Math.PI * 2);
  wCtx.fillStyle = '#0f172a';
  wCtx.fill();
  wCtx.lineWidth = 4;
  wCtx.strokeStyle = '#fff';
  wCtx.stroke();
}

function updateWheelFromText() {
  const lines = wOptionsEl.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    wheelItems = lines;
    drawWheel();
  }
}

document.getElementById('btn-update-wheel').addEventListener('click', updateWheelFromText);

document.querySelectorAll('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    wheelItems = [...PRESETS[btn.dataset.preset]];
    wOptionsEl.value = wheelItems.join('\n');
    drawWheel();
  });
});

document.getElementById('btn-spin').addEventListener('click', () => {
  if (isSpinning || wheelItems.length < 2) return;
  isSpinning = true;
  wResultEl.textContent = '命运齿轮转动中...';

  const spinDuration = 3400;
  const extraAngle = Math.PI * 8 + Math.random() * Math.PI * 4;
  const startAngle = currentAngle;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / spinDuration, 1);
    // 三次方缓出
    const ease = 1 - Math.pow(1 - t, 3);
    currentAngle = startAngle + extraAngle * ease;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      isSpinning = false;
      // 指针在正上方 (-Math.PI / 2)
      const pointerAngle = (-Math.PI / 2 - (currentAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2);
      const arc = (Math.PI * 2) / wheelItems.length;
      const index = Math.floor(pointerAngle / arc) % wheelItems.length;
      wResultEl.textContent = `🎉 决定就是：【${wheelItems[index]}】！`;
    }
  }
  requestAnimationFrame(step);
});

drawWheel();
