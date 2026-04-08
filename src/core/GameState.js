import { CONFIG } from "../config.js";

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
    this.cpuPlan = null;
    this.preparedThrow = null;
    this.projectileQueue = [];
    this.delayedBursts = [];
    this.bossShotsRemaining = 0;
    this.isBossFollowUpTurn = false;
    this.screenShake = 0;
    this.hint = "Choose a mode to start a new match.";
    this.banner = { visible: false, label: "Get Ready", title: "P1 Cat" };
    this.dragAim = null;
    this.cloudOffsetNear = 0;
    this.cloudOffsetFar = 0;
    this.elapsedTime = 0;
    this.resetWall();
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

  startDragAim(data) {
    this.dragAim = { active: true, ...data };
  }

  updateDragAim(data) {
    if (this.dragAim) {
      Object.assign(this.dragAim, data);
    }
  }

  clearDragAim() {
    this.dragAim = null;
  }

  resetWall() {
    this.wall = {
      x: CONFIG.wall.x,
      width: CONFIG.wall.width,
      height: CONFIG.wall.height,
      maxHp: CONFIG.wall.maxHp,
      hp: CONFIG.wall.maxHp,
      destroyed: false,
      flashTimer: 0
    };
  }

  clearProjectileFlow() {
    this.preparedThrow = null;
    this.projectileQueue = [];
    this.delayedBursts = [];
    this.bossShotsRemaining = 0;
    this.isBossFollowUpTurn = false;
  }
}
