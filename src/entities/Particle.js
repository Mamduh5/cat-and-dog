import { TransformComponent } from "../components/TransformComponent.js";

export class Particle {
  constructor(options) {
    this.transform = new TransformComponent(options.x, options.y);
    this.transform.vx = options.vx;
    this.transform.vy = options.vy;
    this.life = options.life;
    this.maxLife = options.life;
    this.radius = options.radius;
    this.color = options.color;
    this.gravityScale = options.gravityScale ?? 0.55;
    this.fadeScale = options.fadeScale ?? 1;
  }
}
