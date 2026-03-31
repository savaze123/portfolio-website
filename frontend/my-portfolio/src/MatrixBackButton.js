import React, { useEffect, useRef } from 'react';

export default function MatrixBackButton({ onClick, label = 'BACK' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const COLS = 42, ROWS = 14;
    const cellW = W / COLS, cellH = H / ROWS;
    let mouse = { x: -999, y: -999 };
    const mouseRadius = 90;
    let t = 0;
    let cells = [];
    let animId;

    const offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    const octx = offscreen.getContext('2d');

    function buildCells() {
    octx.clearRect(0, 0, W, H);
    octx.fillStyle = '#fff';
    const fs = Math.min(W * 0.32, 140);
    octx.font = `900 ${fs}px 'Share Tech Mono', monospace`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(label, W / 2, H / 2);
    octx.strokeStyle = '#fff';
    octx.lineWidth = 7;
    octx.strokeText(label, W / 2, H / 2);
    const mask = octx.getImageData(0, 0, W, H);

      cells = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cx = col * cellW + cellW / 2;
          const cy = row * cellH + cellH / 2;
          const idx = (Math.floor(cy) * W + Math.floor(cx)) * 4;
          const inside = mask.data[idx] > 128;
          const brightness = inside
            ? 1.95 + Math.random() * 0.25
            : Math.random() < 0.06 ? 0.05 + Math.random() * 0.05 : 0;
          cells.push({
            col, row, cx, cy, inside,
            hPhase: (col / COLS) * Math.PI * 2 + Math.random() * 0.3,
            vPhase: (row / ROWS) * Math.PI * 2 + Math.random() * 0.3,
            speed: 0.4 + Math.random() * 0.5,
            brightness,
            baseX: cx, baseY: cy,
            char: '01アイウｺﾗｼﾓﾄｿﾊﾐﾀ$#%'.charAt(Math.floor(Math.random() * 19))
          });
        }
      }
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function draw() {
      t += 0.018;
      ctx.clearRect(0, 0, W, H);
      ctx.clearRect(0, 0, W, H);

      for (const cell of cells) {
        if (cell.brightness === 0) continue;
        const dx = cell.baseX - mouse.x;
        const dy = cell.baseY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / mouseRadius);
        const ripple = influence > 0 ? Math.pow(influence, 1.4) : 0;
        const hWave = Math.sin(t * cell.speed + cell.hPhase) * 1.2;
        const vWave = Math.sin(t * cell.speed * 0.8 + cell.vPhase) * 1.2;
        const tearH = ripple * (dx / (dist + 0.001)) * mouseRadius * 0.55;
        const tearV = ripple * (dy / (dist + 0.001)) * mouseRadius * 0.35;
        const drawX = cell.baseX + hWave + tearH;
        const drawY = cell.baseY + vWave + tearV;
        const flicker = 0.97 + 0.2 * Math.sin(t * 3.1 + cell.hPhase * 2.7);
        const bright = cell.brightness * flicker;

        let r, g, b;
        if (ripple > 0.2 && cell.inside) {
          const hot = (ripple - 0.2) / 0.8;
          r = Math.floor(lerp(0, 180, hot));
          g = Math.floor(lerp(255 * bright, 255, hot));
          b = Math.floor(lerp(70 * bright, 200, hot));
        } else {
          r = 0; g = Math.floor(265 * bright); b = Math.floor(70 * bright);
        }

        const sz = cellW * (0.72 + ripple * 0.5);
        ctx.font = `${Math.floor(sz)}px 'Share Tech Mono', monospace`;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (ripple > 0.05) {
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.transform(1, tearV * 0.01, tearH * 0.018, 1, 0, 0);
          ctx.fillText(cell.char, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(cell.char, drawX, drawY);
        }
      }
      animId = requestAnimationFrame(draw);
    }

    const wrap = canvas.parentElement;
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);

    buildCells();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
    };
  }, [label]);

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'inline-block', background: 'transparent' }}
    >
      <canvas ref={canvasRef} width={320} height={100} />
    </div>
  );
  
}


