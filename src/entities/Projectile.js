import { TransformComponent } from "../components/TransformComponent.js";

export class Projectile {
  constructor(options) {
    this.ownerId = options.ownerId;
    this.shotKey = options.shotKey;
    this.shot = options.shot;
    this.transform = new TransformComponent(options.x, options.y);
    this.transform.vx = options.vx;
    this.transform.vy = options.vy;
    this.age = 0;
    this.trail = [];
  }
}
