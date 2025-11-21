import { applySnowEffect, initParticles } from './effect_snow.js';
import { exportFramesAsZip } from './utils.js';

const loopSecondsInput = document.getElementById('loopSeconds');
const fpsSelect = document.getElementById('fpsSelect');
const snowAmountInput = document.getElementById('snowAmount');
const snowAmountValue = document.getElementById('snowAmountValue');
const speedSelect = document.getElementById('speedSelect');
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playPreview');
const stopButton = document.getElementById('stopPreview');

let previewTimer = null;

// プレビューサイズ（16:9で見やすいサイズ）
const PREVIEW_W = 853;
const PREVIEW_H = 480;

// 出力サイズ（フルHD固定）
const OUTPUT_W = 1920;
const OUTPUT_H = 1080;

// 雪の量スライダー連動
snowAmountInput.addEventListener('input', () => {
  snowAmountValue.textContent = snowAmountInput.value;
  initPreview();
});

// 速度プリセットが変わったら即再初期化
speedSelect.addEventListener('change', initPreview);

// 速度設定を取得（これがシームレスループの鍵！）

function getSpeedSettings(loopFrames) {
  const pixelsPerFrame = parseInt(speedSelect.value);   // 13でもOK

  const naturalCycle = pixelsPerFrame * loopFrames;
  const minSafeCycle = 1080 * 3;        // ← ここを固定で3240pxに！
  const cyclePixels = Math.max(naturalCycle, minSafeCycle);

  return { pixelsPerFrame, cyclePixels };
}
// プレビュー描画
function drawPreview(frame, loopFrames, count) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

  ctx.save();
  ctx.scale(PREVIEW_W / OUTPUT_W, PREVIEW_H / OUTPUT_H);

  const { pixelsPerFrame } = getSpeedSettings(loopFrames);
  applySnowEffect(ctx, OUTPUT_W, OUTPUT_H, frame, loopFrames, count, pixelsPerFrame);

  ctx.restore();
}

// プレビュー再生
function startPreview(fps, loopFrames, count) {
  if (previewTimer) clearInterval(previewTimer);
  let frame = 0;
  previewTimer = setInterval(() => {
    drawPreview(frame % loopFrames, loopFrames, count);
    frame++;
  }, 1000 / fps);

  playButton.disabled = true;
  stopButton.disabled = false;
}

function stopPreview() {
  clearInterval(previewTimer);
  previewTimer = null;
  playButton.disabled = false;
  stopButton.disabled = true;
}

// プレビュー初期化（すべての設定変更時に呼ぶ）
function initPreview() {
  const fps = parseInt(fpsSelect.value);
  const sec = parseFloat(loopSecondsInput.value);
  const loopFrames = Math.round(sec * fps);
  const count = parseInt(snowAmountInput.value);

  const { cyclePixels } = getSpeedSettings(loopFrames);

  // 粒子システムを正しいcyclePixelsで再構築
  initParticles(OUTPUT_W, count, cyclePixels);

  drawPreview(0, loopFrames, count);
  startPreview(fps, loopFrames, count);
}

// 生成ボタン
startButton.addEventListener('click', async () => {
  const fps = parseInt(fpsSelect.value);
  const sec = parseFloat(loopSecondsInput.value);
  const loopFrames = Math.round(sec * fps);
  const count = parseInt(snowAmountInput.value);

  const { pixelsPerFrame, cyclePixels } = getSpeedSettings(loopFrames);

  // 粒子再初期化（生成時も完全に同じ状態にする）
  initParticles(OUTPUT_W, count, cyclePixels);

  startButton.disabled = true;
  startButton.textContent = '生成中…（0%）';

  const offscreen = new OffscreenCanvas(OUTPUT_W, OUTPUT_H);
  const offCtx = offscreen.getContext('2d');
  const frames = [];

  for (let i = 0; i < loopFrames; i++) {
    offCtx.clearRect(0, 0, OUTPUT_W, OUTPUT_H);
    applySnowEffect(offCtx, OUTPUT_W, OUTPUT_H, i, loopFrames, count, pixelsPerFrame);

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    frames.push({ blob, index: i });

    // 進捗表示（少し親切に）
    const progress = Math.round((i + 1) / loopFrames * 100);
    startButton.textContent = `生成中…(${progress}%)`;
  }

  await exportFramesAsZip(frames, loopFrames, fps);

  startButton.disabled = false;
  startButton.textContent = '❄️ 雪オーバーレイ連番を書き出す';
});

// 各種コントロール
playButton.onclick = initPreview;
stopButton.onclick = stopPreview;
loopSecondsInput.onchange = initPreview;
fpsSelect.onchange = initPreview;

// ページ読み込み時に即プレビュー開始
initPreview();