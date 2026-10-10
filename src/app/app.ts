import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `

    <router-outlet></router-outlet>
  `
})
export class AppComponent implements AfterViewInit{
ngAfterViewInit() {
  const canvasEl = document.getElementById('myChart') as HTMLCanvasElement | null;

  if (!canvasEl) {
    return;
  }

  const ctxEl = canvasEl.getContext('2d');
  if (!ctxEl) {
    return;
  }

  // ✅ Tell TypeScript these are definitely not null
  const canvas = canvasEl!;
  const ctx = ctxEl!;

  let particles: any[] = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class CarParticle {
    x: number;
    y: number;
    speed: number;
    size: number;

    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.speed = 0.8 + Math.random() * 1.5;
      this.size = 3 + Math.random() * 3;
    }

    update() {
      this.x += this.speed;

      if (this.x > canvas.width + 50) {
        this.x = -50;
        this.y = Math.random() * canvas.height;
      }
    }

    draw() {
      ctx.fillStyle = "rgba(52, 211, 153, 0.7)";
      ctx.fillRect(this.x, this.y, this.size * 4, this.size);

      const gradient = ctx.createRadialGradient(
        this.x + this.size * 4,
        this.y + this.size / 2,
        0,
        this.x + this.size * 4,
        this.y + this.size / 2,
        this.size * 6
      );

      gradient.addColorStop(0, "rgba(255, 255, 200, 0.6)");
      gradient.addColorStop(1, "rgba(255, 255, 200, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.size * 4,
        this.y + this.size / 2,
        this.size * 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push(new CarParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
      p.update();
      p.draw();
    }

    requestAnimationFrame(animate);
  }

  initParticles();
  animate();
}

}
