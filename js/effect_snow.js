let particles = [];

export function initParticles(width, count, cyclePixels) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      // ← これが最後の鍵！拡張されたcyclePixels全体に均等に散らす
      phase: Math.random() * cyclePixels,
      size: 1 + Math.random() * 3,
      swing: 15 + Math.random() * 45
    });
  }
}

export function applySnowEffect(
  ctx,
  width,
  height,
  frameIndex,
  loopFrames,
  particleCount,
  pixelsPerFrame = 36,
  options = {}
) {
  const ppf = pixelsPerFrame;

  // ここを main.js と完全に一致させる（超重要）
  const naturalCycle = ppf * loopFrames;
  const minSafeCycle = height * 3;           // 3240px（1080×3）
  const cyclePixels = Math.max(naturalCycle, minSafeCycle);

  const swingFreq = options.swingFreq ?? 0.03;
  const twinkleFreq = options.twinkleFreq ?? 0.15;
  const phaseScale = options.phaseScale ?? 0.01;

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(200,230,255,0.9)';

  for (const p of particles) {
    // 正しくモジュロを取る（これがないと繋がらない）
    const progressed = (p.phase + frameIndex * ppf) % cyclePixels;
    const y = progressed - height;   // 画面上から降ってくる

    // 描画範囲を広めに（これで一瞬の消えもゼロ）
    if (y < -height * 2 || y > height * 2) continue;

    const swing = Math.sin(frameIndex * swingFreq + p.phase * phaseScale) * p.swing;
    const x = p.x + swing;

    const twinkle = 1 + Math.sin(frameIndex * twinkleFreq + p.phase * phaseScale * 2) * 0.3;
    const size = p.size * twinkle;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}