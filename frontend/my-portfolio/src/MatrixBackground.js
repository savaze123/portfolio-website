import React, { useEffect } from 'react';
import axios from 'axios';
import './MatrixBackground.css';

function MatrixBackground() {
  useEffect(() => {
    const canvas = document.getElementById('matrix');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const FONT_SIZE = 16;
    const totalCols = Math.floor(canvas.width / (FONT_SIZE * 2));

    const coins = [
      { name: 'BTC', digits: '0123456789'.split(''), color: '#f7931a' },
      { name: 'ETH', digits: '0123456789'.split(''), color: '#627eea' },
      { name: 'SOL', digits: '0123456789'.split(''), color: '#00ff9d' },
    ];

    const colsPerCoin = Math.floor(totalCols / coins.length);
    const colCoin = [];
    for (let i = 0; i < totalCols; i++) {
      const coinIdx = Math.min(Math.floor(i / colsPerCoin), coins.length - 1);
      colCoin.push(coinIdx);
    }

    const drops = Array.from({ length: totalCols }, () => Math.random() * -(canvas.height / FONT_SIZE));
    const speeds = Array.from({ length: totalCols }, () => 0.2 + Math.random() * 0.3);
    const streamLengths = Array.from({ length: totalCols }, () => 6 + Math.floor(Math.random() * 12));

    let lastTime = 0;

    const fetchCryptoPrices = async () => {
      try {
        const response = await axios.get('/api/crypto');
        const prices = response.data;
        console.log('Crypto prices:', prices);
        coins[0].digits = String(prices.bitcoin).replace('.', '').split('');
        coins[1].digits = String(prices.ethereum).replace('.', '').split('');
        coins[2].digits = String(prices.solana).replace('.', '').split('');
      } catch (error) {
        console.log('Crypto fetch failed:', error);
      }
    };

    fetchCryptoPrices();
    const cryptoInterval = setInterval(fetchCryptoPrices, 60000);

    function draw(timestamp) {
      if (timestamp - lastTime < 50) {
        requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < totalCols; i++) {
        const coin = coins[colCoin[i]];
        const x = i * (FONT_SIZE * 2);
        const streamLen = streamLengths[i];

        for (let j = 0; j < streamLen; j++) {
          const y = (drops[i] - j) * FONT_SIZE;
          if (y < -FONT_SIZE || y > canvas.height) continue;

          const digit = coin.digits[Math.floor(Math.random() * coin.digits.length)];
          const alpha = 1 - j / streamLen;

          if (j === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = coin.color;
            ctx.shadowBlur = 20;
          } else if (j < 3) {
            ctx.fillStyle = coin.color;
            ctx.shadowColor = coin.color;
            ctx.shadowBlur = 10;
          } else {
            ctx.shadowBlur = 0;
            const r = parseInt(coin.color.slice(1, 3), 16);
            const g = parseInt(coin.color.slice(3, 5), 16);
            const b = parseInt(coin.color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.85})`;
          }

          ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
          ctx.textAlign = 'left';
          ctx.fillText(digit, x, y);
        }

        ctx.shadowBlur = 0;
        drops[i] += speeds[i];

        if (drops[i] * FONT_SIZE > canvas.height + streamLen * FONT_SIZE) {
          drops[i] = -streamLen - Math.random() * 20;
          speeds[i] = 0.2 + Math.random() * 0.5;
          streamLengths[i] = 6 + Math.floor(Math.random() * 12);
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
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(cryptoInterval);
    };
  }, []);

  return <canvas id="matrix"></canvas>;
}

export default MatrixBackground;