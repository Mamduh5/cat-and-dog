export class HealthComponent {
  constructor(max) {
    this.max = max;
    this.current = max;
  }

  reset() {
    this.current = this.max;
  }
}
