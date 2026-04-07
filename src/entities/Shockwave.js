export class Shockwave {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.life = options.life ?? 0.34;
    this.maxLife = this.life;
    this.fromRadius = options.fromRadius ?? 12;
    this.toRadius = options.toRadius ?? 62;
    this.color = options.color ?? "rgba(255, 247, 224,";
  }
}
