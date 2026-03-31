import React, { useEffect, useRef } from 'react';
import './MatrixHomeButton.css';

export default function MatrixHomeButton({ onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / 10);
    const drops = Array.from({length: cols}, () => Math.random() * -40);
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ$%#@';

    function drawRain() {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '10px monospace';
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = y < 2 ? '#afffbf' : '#00ff41';
        ctx.fillText(ch, i * 10, y * 10);
        if (y * 10 > canvas.height && Math.random() > 0.92) drops[i] = 0;
        drops[i] += 0.5;
      });
    }

    const interval = setInterval(drawRain, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <button className="matrix-btn" onClick={onClick}>
      <canvas ref={canvasRef} width={240} height={50}></canvas>
      <div className="fill"></div>
      <div className="scanline"></div>
      <div className="glow-line"></div>
      <div className="corner tl"></div>
      <div className="corner tr"></div>
      <div className="corner bl"></div>
      <div className="corner br"></div>
      <span className="arrow">&#8962;</span>
      <span className="label">HOME</span>
    </button>
  );
}