export class WeaponComponent {
  constructor(shotType = "normal") {
    this.shotType = shotType;
    this.anticipationTimer = 0;
    this.anticipationDuration = 0.001;
    this.recoilTimer = 0;
    this.recoilDuration = 0.001;
  }
}
