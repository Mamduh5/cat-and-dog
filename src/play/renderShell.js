import { WEAPON_BAR_ORDER } from "../utils/helpers.js";

const WEAPON_META = {
  normal: { label: "Normal", note: "Ball", iconClass: "weapon-icon-normal" },
  light: { label: "Light", note: "Stick", iconClass: "weapon-icon-light" },
  heavy: { label: "Heavy", note: "Rock", iconClass: "weapon-icon-heavy" },
  super: { label: "Super", note: "Rocket", iconClass: "weapon-icon-super" },
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
  if (!preset.touch) {
    return "";
  }

  return `
    <section class="panel touch-controls" aria-label="Touch Controls">
      <div class="touch-header">
        <p class="panel-title touch-title">Touch Play</p>
        <span class="touch-note">Weapon bar appears only when you can act.</span>
      </div>

      <div class="touch-grid touch-grid-actions">
        <button class="touch-button" data-input-code="KeyR" data-input-mode="tap">Restart</button>
      </div>
    </section>
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
          <button class="shell-button" id="fullscreenButton" type="button">Fullscreen</button>
          <div class="mode-pill" id="modeLabel">Mode: Menu</div>
        </div>
      </header>

      <section class="hud" aria-label="Game HUD">
        <div class="panel stat-card">
          <span class="stat-label" id="p1Label">P1 HP</span>
          <strong class="stat-value" id="p1Hp">100</strong>
          <div class="hp-bar"><div class="hp-fill hp-fill-p1" id="p1Bar"></div></div>
        </div>

        <div class="panel stat-card">
          <span class="stat-label" id="p2Label">P2 HP</span>
          <strong class="stat-value" id="p2Hp">100</strong>
          <div class="hp-bar"><div class="hp-fill hp-fill-p2" id="p2Bar"></div></div>
        </div>

        <div class="panel info-card spotlight-card">
          <span class="stat-label">Turn</span>
          <strong class="stat-value" id="turnValue">Waiting</strong>
          <span class="info-note" id="turnSubtext">Pick a mode to begin.</span>
        </div>

        <div class="panel info-card">
          <span class="stat-label">Angle</span>
          <strong class="stat-value" id="angleValue">45 deg</strong>
        </div>

        <div class="panel info-card">
          <span class="stat-label">Power</span>
          <strong class="stat-value" id="powerValue">380</strong>
        </div>

        <div class="panel info-card">
          <span class="stat-label">Projectile</span>
          <strong class="stat-value" id="shotValue">Normal</strong>
          <span class="info-note" id="shotNote">Balanced</span>
        </div>

        <div class="panel info-card">
          <span class="stat-label">Wind</span>
          <strong class="stat-value" id="windValue">calm 0</strong>
        </div>
      </section>

      <section class="play-frame">
        <div class="panel canvas-wrap">
          <canvas id="gameCanvas" width="960" height="540" aria-label="Backyard Ballistics game canvas"></canvas>
          ${renderWeaponBar()}

          <div class="turn-banner hidden" id="turnBanner" aria-live="polite">
            <p class="turn-banner-label" id="turnBannerLabel">Get Ready</p>
            <strong class="turn-banner-title" id="turnBannerTitle">P1 Cat</strong>
          </div>

          <div class="canvas-hint" id="canvasHint">Drag from the throwing hand, then release to fire.</div>

          <div class="overlay menu-overlay" id="menuOverlay">
            <div class="overlay-card">
              <p class="eyebrow">Pick A Mode</p>
              <h2>Backyard Ballistics</h2>
              <p class="overlay-copy">${preset.description}</p>
              <div class="difficulty-panel">
                <p class="mini-heading">CPU Difficulty</p>
                <div class="segmented" role="group" aria-label="CPU Difficulty">
                  <button class="segment-button is-active" data-difficulty="easy">Easy</button>
                  <button class="segment-button" data-difficulty="normal">Normal</button>
                  <button class="segment-button" data-difficulty="hard">Hard</button>
                </div>
                <p class="difficulty-copy" id="difficultyCopy">Forgiving aim, slower throws, and wider misses.</p>
              </div>
              <div class="button-row">
                <button class="action-button" id="playCpuButton">Play vs CPU</button>
                <button class="action-button secondary" id="playLocalButton">2 Players</button>
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

          <div class="panel notes-panel">
            <p class="panel-title">Arsenal</p>
            <p><strong>Normal:</strong> reliable baseline.</p>
            <p><strong>Light:</strong> faster, wind-sensitive, weaker.</p>
            <p><strong>Heavy:</strong> slower, heavier, stronger.</p>
            <p><strong>Super:</strong> special, demanding, powerful.</p>
            <p><strong>Heal:</strong> one instant recovery action.</p>
          </div>

          <div class="panel notes-panel compact-panel">
            <p class="panel-title">Match Notes</p>
            <p id="matchNote">Wind changes each turn. Device shell: ${preset.label}. Shared game logic stays the same.</p>
          </div>
        </aside>
      </section>
    </main>
  `;
}
