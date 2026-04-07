export class GameState {
  constructor() {
    this.scene = "menu";
    this.phase = "menu";
    this.mode = null;
    this.cpuDifficulty = "normal";
    this.currentPlayerIndex = 0;
    this.wind = 0;
    this.turnTimer = 0;
    this.pendingGameOver = false;
    this.cpuTimer = 0;
    this.preparedThrow = null;
    this.screenShake = 0;
    this.hint = "Choose a mode to start a new match.";
    this.banner = { visible: false, label: "Get Ready", title: "P1 Cat" };
    this.cloudOffsetNear = 0;
    this.cloudOffsetFar = 0;
    this.elapsedTime = 0;
  }

  setScene(scene) {
    this.scene = scene;
  }

  setPhase(phase) {
    this.phase = phase;
  }

  showBanner(label, title) {
    this.banner.visible = true;
    this.banner.label = label;
    this.banner.title = title;
  }

  hideBanner() {
    this.banner.visible = false;
  }
}
