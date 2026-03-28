import React, { useEffect } from 'react';
import './MatrixBackground.css';

function MatrixBackground() {
  useEffect(() => {
    const canvas = document.getElementById('matrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const FONT_SIZE = 18;
    const cols = Math.floor(canvas.width / FONT_SIZE);
    const digits = '0123456789'.split('');

    const drops = Array.from({ length: cols }, () => Math.random() * -60);
    const speeds = Array.from({ length: cols }, () => 0.35 + Math.random() * 0.35);

    let lastTime = 0;
    const interval = 80;

    function draw(timestamp) {
      if (timestamp - lastTime < interval) {
        requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;
        const digit = digits[Math.floor(Math.random() * digits.length)];

        // Glowing white head
        ctx.font = `bold ${FONT_SIZE}px 'Courier New', monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 16;
        ctx.fillText(digit, x, y);

        // Green trail character
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 230, 60, 0.9)';
        ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
        ctx.fillText(digits[Math.floor(Math.random() * digits.length)], x, y - FONT_SIZE);

        drops[i] += speeds[i];

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -30;
          speeds[i] = 0.35 + Math.random() * 0.35;
        }
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas id="matrix"></canvas>;
}

export default MatrixBackground;