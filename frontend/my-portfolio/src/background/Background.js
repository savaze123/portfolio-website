import React, { useEffect } from "react";
import "./Background.css";

const Background = () => {
  useEffect(() => {
    const canvas = document.getElementById("myCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    let stars = [];
    let speed = 10;
    const maxSpeed = 10;
    const minSpeed = 0;

    // Generate stars
    for (let i = 0; i < 100; i++) {
      let loc = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      };
      stars.push(new Star(loc));
    }

    // Adjust speed based on scroll position
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      speed = minSpeed + (scrollPosition / maxScroll) * (maxSpeed - minSpeed);
      speed = Math.max(minSpeed, Math.min(speed, maxSpeed)); // Clamp speed
    };

    window.addEventListener("scroll", onScroll);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < stars.length; i++) {
        stars[i].update(speed, maxSpeed);
        stars[i].draw(ctx, speed, maxSpeed);
      }
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas id="myCanvas" className="background-canvas"></canvas>;
};

class Star {
  constructor(location) {
    this.location = location;
    this.radius = 2 + Math.random() * 2;
  }

  update(speed) {
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const angle = Math.atan2(
      this.location.y - center.y,
      this.location.x - center.x
    );

    this.location.x += speed * Math.cos(angle);
    this.location.y += speed * Math.sin(angle);

    if (
      this.location.x > window.innerWidth ||
      this.location.x < 0 ||
      this.location.y > window.innerHeight ||
      this.location.y < 0
    ) {
      this.location.x = Math.random() * window.innerWidth;
      this.location.y = Math.random() * window.innerHeight;
    }

    const distToCenter = Math.sqrt(
      Math.pow(this.location.x - center.x, 2) +
        Math.pow(this.location.y - center.y, 2)
    );
    this.radius = 1 + (3 * distToCenter) / window.innerWidth;
  }

  draw(ctx, speed, maxSpeed) {
    ctx.beginPath();
    ctx.moveTo(this.location.x, this.location.y);

    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const weight = 80 - 70 * (speed / maxSpeed);
    const pastLocation = {
      x: (weight * this.location.x + center.x) / (weight + 1),
      y: (weight * this.location.y + center.y) / (weight + 1),
    };
    ctx.lineTo(pastLocation.x, pastLocation.y);
    ctx.strokeStyle = "white";
    ctx.lineWidth = this.radius;
    ctx.stroke();
  }
}

export default Background;
