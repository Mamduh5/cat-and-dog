import { WEAPON_BAR_ORDER } from "../utils/helpers.js";

const WEAPON_META = {
  normal: { label: "Normal", note: "Ball", iconClass: "weapon-icon-normal" },
  light: { label: "Light", note: "Burst", iconClass: "weapon-icon-light" },
  heavy: { label: "Heavy", note: "Shards", iconClass: "weapon-icon-heavy" },
  super: { label: "Super", note: "Tracks", iconClass: "weapon-icon-super" },
  heal: { label: "Heal", note: "+35%", iconClass: "weapon-icon-heal" }
};

function renderWeaponBar() {
  return `
    <div class="weapon-bar" id="weaponBar" aria-label="Battle weapon bar">
      ${WEAPON_BAR_ORDER.map((key) => {
        const meta = WEAPON_META[key];
        return `
          <button class="weapon-bar-button weapon-${key}" data-weapon-key="${key}" type="button">
            <span class="weapon-icon ${meta.iconClass}">${key === "heal" ? "+" : ""}</span>
            <span class="weapon-copy">
              <span class="weapon-label">${meta.label}</span>
              <span class="weapon-note" data-weapon-note>${meta.note}</span>
            </span>
            <span class="weapon-count" data-weapon-count>${key === "normal" ? "INF" : "1"}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderTouchControls(preset) {
  if (!preset.touch || preset.id === "mobile") {
    return "";
  }

  return `
    <section class="panel touch-controls" aria-label="Touch Controls">
      <div class="touch-header">
        <p class="panel-title touch-title">Touch Play</p>
        <span class="touch-note">Drag from the throwing hand and release to fire.</span>
      </div>
      <div class="touch-grid touch-grid-actions">
        <button class="touch-button" data-input-code="KeyR" data-input-mode="tap">Restart</button>
      </div>
    </section>
  `;
}

function renderSidePanel(preset) {
  if (preset.id === "mobile") {
    return "";
  }

  return `
    <aside class="side-panel">
      ${renderTouchControls(preset)}
      <div class="panel controls-panel">
        <p class="panel-title">Controls</p>
        <ul class="controls-list">
          <li><span>Aim</span><strong>${preset.touch ? "Drag back from hand, release to fire" : "Left / Right or A / D"}</strong></li>
          <li><span>Power</span><strong>${preset.touch ? "Pull farther for more power" : "Up / Down or W / S"}</strong></li>
          <li><span>Weapons</span><strong>1-4 attacks, 5 heal, or tap the arena bar</strong></li>
          <li><span>Throw</span><strong>${preset.touch ? "Release drag" : "Space or Enter"}</strong></li>
          <li><span>Restart / Menu</span><strong>R / M</strong></li>
        </ul>
      </div>

      <div class="panel notes-panel compact-panel">
        <p class="panel-title">Match Notes</p>
        <p id="matchNote">CPU: Solid read, believable mistakes.</p>
      </div>
    </aside>
  `;
}

export function renderShell(preset) {
  return `
    <main class="play-shell ${preset.shellClass}" id="playRoot">
      <header class="play-topbar">
        <a class="back-link" href="../../">Back</a>
        <div class="play-heading">
          <p class="eyebrow">Shared Core / ${preset.label} Shell</p>
          <h1>Backyard Ballistics</h1>
        </div>
        <div class="topbar-actions">
          <div class="mode-pill" id="modeLabel">Mode: Menu</div>
        </div>
      </header>

      <section class="play-frame">
        <div class="panel canvas-wrap" id="gameplaySurface">
          <canvas id="gameCanvas" width="960" height="540" aria-label="Backyard Ballistics game canvas"></canvas>
          <button class="canvas-shell-button" id="fullscreenButton" type="button">Full</button>
          ${renderWeaponBar()}

          <div class="turn-banner hidden" id="turnBanner" aria-live="polite">
            <p class="turn-banner-label" id="turnBannerLabel">Get Ready</p>
            <strong class="turn-banner-title" id="turnBannerTitle">P1 Cat</strong>
          </div>

          <div class="canvas-hint is-hidden" id="canvasHint">Drag to aim, release to shoot.</div>

          <div class="overlay menu-overlay" id="menuOverlay">
            <div class="overlay-card menu-card">
              <h2>Backyard Ballistics</h2>

              <div class="menu-actions" id="menuActions">
                <button class="action-button" id="playCpuButton">Play vs CPU</button>
                <button class="action-button secondary" id="playLocalButton">2 Players</button>
              </div>

              <div class="difficulty-panel is-hidden" id="difficultyPanel">
                <p class="mini-heading">CPU Difficulty</p>
                <div class="segmented" role="group" aria-label="CPU Difficulty">
                  <button class="segment-button easy is-active" data-difficulty="easy">Easy</button>
                  <button class="segment-button normal is-active" data-difficulty="normal">Normal</button>
                  <button class="segment-button hard is-active" data-difficulty="hard">Hard</button>
                  <button class="segment-button impossible is-active" data-difficulty="impossible">Impossible</button>
                </div>
                <p class="difficulty-copy" id="difficultyCopy">Solid read, believable mistakes.</p>
                <div class="button-row menu-subactions">
                  <button class="action-button" id="startCpuButton">Start CPU Match</button>
                  <button class="ghost-button" id="cpuBackButton">Back</button>
                </div>
              </div>
            </div>
          </div>

          <div class="overlay end-overlay hidden" id="endOverlay">
            <div class="overlay-card end-card">
              <p class="eyebrow">Round Complete</p>
              <h2 id="endTitle">Winner</h2>
              <p class="overlay-copy" id="endSubtitle">Press restart to play again.</p>
              <div class="button-row">
                <button class="action-button" id="restartButton">Play Again</button>
                <button class="action-button secondary" id="menuButton">Back To Menu</button>
              </div>
            </div>
          </div>
        </div>

        ${renderSidePanel(preset)}
      </section>
    </main>
  `;
}
