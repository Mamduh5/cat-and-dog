import { TransformComponent } from "../components/TransformComponent.js";

export class Projectile {
  constructor(options) {
    this.ownerId = options.ownerId;
    this.ownerIndex = options.ownerIndex;
    this.targetIndex = options.targetIndex;
    this.shotKey = options.shotKey;
    this.shot = options.shot;
    this.transform = new TransformComponent(options.x, options.y);
    this.transform.vx = options.vx;
    this.transform.vy = options.vy;
    this.age = 0;
    this.trail = [];
    this.meta = {
      sourceTag: options.sourceTag || "main",
      trackingActive: false,
      baseSpeed: Math.hypot(options.vx, options.vy)
    };
  }
}
