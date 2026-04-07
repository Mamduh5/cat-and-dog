import { CONFIG } from "../config.js";
import { DOM_IDS, DIFFICULTY_SELECTOR } from "../core/AssetRefs.js";
import { formatAmmoCount, setText } from "../utils/helpers.js";

const ROTATING_HINTS = [
  "Drag to aim, release to shoot.",
  "Wind affects light shots most.",
  "Heavy shots resist wind better.",
  "Super is powerful but hard to land.",
  "Heal consumes your turn."
];

export class UISystem {
  constructor() {
    this.refs = {};
    for (const [key, id] of Object.entries(DOM_IDS)) {
      this.refs[key] = document.getElementById(id);
    }
    this.difficultyButtons = Array.from(document.querySelectorAll(DIFFICULTY_SELECTOR));
    this.touchButtons = Array.from(document.querySelectorAll("[data-input-code]"));
    this.weaponButtons = Array.from(document.querySelectorAll("[data-weapon-key]"));
    this.lastHintText = "";
    this.activeHintText = "";
    this.hintVisibleUntil = 0;
    this.nextTipAt = 0;
    this.tipIndex = 0;
  }

  bindMenuControls(handlers) {
    this.refs.playCpuButton?.addEventListener("click", () => this.showCpuSetup());
    this.refs.startCpuButton?.addEventListener("click", handlers.onPlayCpu);
    this.refs.cpuBackButton?.addEventListener("click", () => this.hideCpuSetup());
    this.refs.playLocalButton?.addEventListener("click", handlers.onPlayLocal);
    this.refs.restartButton?.addEventListener("click", handlers.onRestart);
    this.refs.menuButton?.addEventListener("click", handlers.onMenu);
    this.difficultyButtons.forEach((button) => {
      button.addEventListener("click", () => handlers.onDifficulty(button.dataset.difficulty));
    });
  }

  bindShellControls(handlers) {
    this.refs.fullscreenButton?.addEventListener("click", handlers.onFullscreen);
  }

  bindBattleControls(handlers) {
    this.weaponButtons.forEach((button) => {
      button.addEventListener("click", () => handlers.onWeaponSelect(button.dataset.weaponKey));
    });
  }

  bindTouchControls(input) {
    input.bindTouchControls(this.touchButtons);
  }

  setFullscreenAvailability(enabled) {
    if (this.refs.fullscreenButton) {
      this.refs.fullscreenButton.hidden = !enabled;
    }
  }

  updateFullscreenState(active) {
    setText(this.refs.fullscreenButton, active ? "Exit" : "Full");
  }

  setDifficulty(level, description) {
    this.difficultyButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.difficulty === level);
    });
    setText(this.refs.difficultyCopy, description);
    setText(this.refs.matchNote, `CPU: ${CONFIG.cpuProfiles[level].description}`);
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

  showCpuSetup() {
    this.refs.difficultyPanel?.classList.remove("is-hidden");
    if (this.refs.playCpuButton) this.refs.playCpuButton.hidden = true;
    if (this.refs.playLocalButton) this.refs.playLocalButton.hidden = true;
  }

  hideCpuSetup() {
    this.refs.difficultyPanel?.classList.add("is-hidden");
    if (this.refs.playCpuButton) this.refs.playCpuButton.hidden = false;
    if (this.refs.playLocalButton) this.refs.playLocalButton.hidden = false;
  }

  resetHintCycle() {
    this.lastHintText = "";
    this.activeHintText = "";
    this.hintVisibleUntil = 0;
    this.nextTipAt = 0;
  }

  showMenu() {
    this.hideCpuSetup();
    this.resetHintCycle();
    this.refs.menuOverlay?.classList.remove("hidden");
    this.refs.endOverlay?.classList.add("hidden");
  }

  showBattle() {
    this.refs.menuOverlay?.classList.add("hidden");
    this.refs.endOverlay?.classList.add("hidden");
  }

  showEnd(title, subtitle) {
    setText(this.refs.endTitle, title);
    setText(this.refs.endSubtitle, subtitle);
    this.refs.endOverlay?.classList.remove("hidden");
  }

  updateWeaponBar(game, current) {
    const showWeaponBar = Boolean(game.state.mode) && game.state.scene === "battle" && game.state.phase === "aiming" && !game.isCpuTurn();
    this.refs.weaponBar?.classList.toggle("is-hidden", !showWeaponBar);

    this.weaponButtons.forEach((button) => {
      const key = button.dataset.weaponKey;
      const isHeal = key === "heal";
      const countNode = button.querySelector("[data-weapon-count]");
      const noteNode = button.querySelector("[data-weapon-note]");
      const count = current.getAmmo(key);
      const config = isHeal ? CONFIG.items.heal : CONFIG.projectileTypes[key];
      button.classList.toggle("is-active", !isHeal && current.weapon.shotType === key && showWeaponBar);
      button.classList.toggle("is-disabled", !current.hasAmmo(key));
      button.disabled = !current.hasAmmo(key);
      setText(countNode, formatAmmoCount(count));
      setText(noteNode, isHeal ? `+${Math.round(current.health.max * config.healRatio)}` : config.label);
    });
  }

  resolveHint(game) {
    const { state } = game;
    const now = state.elapsedTime;
    const allowHints = Boolean(state.mode) && state.scene === "battle" && !state.banner.visible && state.phase !== "projectile";

    if (!allowHints) {
      return { visible: false, text: "" };
    }

    if (state.hint && state.hint !== this.lastHintText) {
      this.lastHintText = state.hint;
      this.activeHintText = state.hint;
      this.hintVisibleUntil = now + 3;
      this.nextTipAt = this.hintVisibleUntil + 7;
    }

    if (now <= this.hintVisibleUntil) {
      return { visible: true, text: this.activeHintText };
    }

    if (state.phase === "aiming" && now >= this.nextTipAt) {
      this.activeHintText = ROTATING_HINTS[this.tipIndex % ROTATING_HINTS.length];
      this.tipIndex += 1;
      this.hintVisibleUntil = now + 3;
      this.nextTipAt = this.hintVisibleUntil + 8;
      return { visible: true, text: this.activeHintText };
    }

    return { visible: false, text: this.activeHintText };
  }

  update(game) {
    const { state, players } = game;
    const current = players[state.currentPlayerIndex] || players[0];
    this.setModeLabel(state.mode, state.cpuDifficulty);
    this.updateWeaponBar(game, current);

    const hint = this.resolveHint(game);
    setText(this.refs.canvasHint, hint.text);
    this.refs.canvasHint?.classList.toggle("is-hidden", !hint.visible);

    this.refs.turnBanner?.classList.toggle("hidden", !state.banner.visible);
    setText(this.refs.turnBannerLabel, state.banner.label);
    setText(this.refs.turnBannerTitle, state.banner.title);
  }
}


