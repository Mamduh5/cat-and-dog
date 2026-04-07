export class RenderComponent {
  constructor(colors = {}) {
    this.colors = colors;
    this.flashTimer = 0;
    this.idleTime = Math.random() * 100;
  }
}
