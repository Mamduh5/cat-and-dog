import { CONFIG } from "../config.js";
import { DOM_IDS, DIFFICULTY_SELECTOR } from "../core/AssetRefs.js";
import { setText, signLabel } from "../utils/helpers.js";

export class UISystem {
  constructor() {
    this.refs = {};
    for (const [key, id] of Object.entries(DOM_IDS)) {
      this.refs[key] = document.getElementById(id);
    }
    this.difficultyButtons = Array.from(document.querySelectorAll(DIFFICULTY_SELECTOR));
    this.touchButtons = Array.from(document.querySelectorAll("[data-input-code]"));
  }

  bindMenuControls(handlers) {
    this.refs.playCpuButton.addEventListener("click", handlers.onPlayCpu);
    this.refs.playLocalButton.addEventListener("click", handlers.onPlayLocal);
    this.refs.restartButton.addEventListener("click", handlers.onRestart);
    this.refs.menuButton.addEventListener("click", handlers.onMenu);
    this.difficultyButtons.forEach((button) => {
      button.addEventListener("click", () => handlers.onDifficulty(button.dataset.difficulty));
    });
  }

  bindTouchControls(input) {
    input.bindTouchControls(this.touchButtons);
  }

  setDifficulty(level, description) {
    this.difficultyButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.difficulty === level);
    });
    setText(this.refs.difficultyCopy, description);
    setText(this.refs.matchNote, `Wind changes every turn. ${CONFIG.cpuProfiles[level].label} CPU is selected for single-player games.`);
  }

  setModeLabel(mode, difficulty) {
    if (!mode) {
      setText(this.refs.modeLabel, "Mode: Menu");
    } else if (mode === "cpu") {
      setText(this.refs.modeLabel, `Mode: 1P vs CPU / ${CONFIG.cpuProfiles[difficulty].label}`);
    } else {
      setText(this.refs.modeLabel, "Mode: 2 Players");
    }
  }

  showMenu() {
    this.refs.menuOverlay.classList.remove("hidden");
    this.refs.endOverlay.classList.add("hidden");
  }

  showBattle() {
    this.refs.menuOverlay.classList.add("hidden");
    this.refs.endOverlay.classList.add("hidden");
  }

  showEnd(title, subtitle) {
    setText(this.refs.endTitle, title);
    setText(this.refs.endSubtitle, subtitle);
    this.refs.endOverlay.classList.remove("hidden");
  }

  update(game) {
    const { state, players } = game;
    const current = players[state.currentPlayerIndex] || players[0];
    const shot = CONFIG.projectileTypes[current.weapon.shotType];

    this.setModeLabel(state.mode, state.cpuDifficulty);
    setText(this.refs.p1Label, players[0].name);
    setText(this.refs.p2Label, players[1].name);
    setText(this.refs.p1Hp, `${players[0].health.current}`);
    setText(this.refs.p2Hp, `${players[1].health.current}`);
    this.refs.p1Bar.style.width = `${(players[0].health.current / players[0].health.max) * 100}%`;
    this.refs.p2Bar.style.width = `${(players[1].health.current / players[1].health.max) * 100}%`;
    setText(this.refs.angleValue, `${Math.round(current.aim.angle)} deg`);
    setText(this.refs.powerValue, `${Math.round(current.aim.power)}`);
    setText(this.refs.shotValue, shot.label);
    setText(this.refs.shotNote, shot.note);
    setText(this.refs.windValue, `${signLabel(state.wind)} ${Math.round(Math.abs(state.wind))}`);
    setText(this.refs.canvasHint, state.hint);

    if (!state.mode) {
      setText(this.refs.turnValue, "Waiting");
      setText(this.refs.turnSubtext, "Pick a mode to begin.");
    } else if (state.phase === "gameover") {
      setText(this.refs.turnValue, "Match Over");
      setText(this.refs.turnSubtext, "Restart or return to menu.");
    } else if (state.phase === "ready") {
      setText(this.refs.turnValue, current.name);
      setText(this.refs.turnSubtext, "Wind settles before the turn opens.");
    } else if (state.phase === "windup") {
      setText(this.refs.turnValue, `${current.name} Throwing`);
      setText(this.refs.turnSubtext, `${shot.label} shot primed.`);
    } else if (state.phase === "turn-end") {
      setText(this.refs.turnValue, "Resolving");
      setText(this.refs.turnSubtext, "Preparing the next turn.");
    } else if (game.isCpuTurn()) {
      setText(this.refs.turnValue, current.name);
      setText(this.refs.turnSubtext, `${CONFIG.cpuProfiles[state.cpuDifficulty].label} CPU is lining up a shot.`);
    } else if (game.preset.touch) {
      setText(this.refs.turnValue, current.name);
      setText(this.refs.turnSubtext, "Drag from the hand to aim, release to fire.");
    } else {
      setText(this.refs.turnValue, current.name);
      setText(this.refs.turnSubtext, "Adjust, choose projectile, and fire.");
    }

    this.refs.turnBanner.classList.toggle("hidden", !state.banner.visible);
    setText(this.refs.turnBannerLabel, state.banner.label);
    setText(this.refs.turnBannerTitle, state.banner.title);
  }
}
