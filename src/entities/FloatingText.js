export class FloatingText {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.text = options.text;
    this.color = options.color;
    this.life = options.life ?? 0.9;
    this.maxLife = this.life;
    this.size = options.size ?? 20;
    this.rise = options.rise ?? 38;
  }
}
