function renderTouchControls(preset) {
  if (!preset.touch) {
    return "";
  }

  return `
    <section class="panel touch-controls" aria-label="Touch Controls">
      <div class="touch-header">
        <p class="panel-title touch-title">Touch Controls</p>
        <span class="touch-note">${preset.controlsHint}</span>
      </div>

      <div class="touch-grid touch-grid-aim">
        <button class="touch-button" data-input-code="ArrowLeft" data-input-mode="hold">Angle -</button>
        <button class="touch-button" data-input-code="ArrowRight" data-input-mode="hold">Angle +</button>
        <button class="touch-button" data-input-code="ArrowDown" data-input-mode="hold">Power -</button>
        <button class="touch-button" data-input-code="ArrowUp" data-input-mode="hold">Power +</button>
      </div>

      <div class="touch-grid touch-grid-actions">
        <button class="touch-button touch-button-secondary" data-input-code="KeyQ" data-input-mode="tap">Shot Prev</button>
        <button class="touch-button touch-button-primary" data-input-code="Space" data-input-mode="tap">Throw</button>
        <button class="touch-button touch-button-secondary" data-input-code="KeyE" data-input-mode="tap">Shot Next</button>
        <button class="touch-button" data-input-code="KeyR" data-input-mode="tap">Restart</button>
      </div>
    </section>
  `;
}

export function renderShell(preset) {
  return `
    <main class="play-shell ${preset.shellClass}">
      <header class="play-topbar">
        <a class="back-link" href="../../">Back</a>
        <div class="play-heading">
          <p class="eyebrow">Shared Core / ${preset.label} Shell</p>
          <h1>Backyard Ballistics</h1>
        </div>
        <div class="mode-pill" id="modeLabel">Mode: Menu</div>
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

          <div class="turn-banner hidden" id="turnBanner" aria-live="polite">
            <p class="turn-banner-label" id="turnBannerLabel">Get Ready</p>
            <strong class="turn-banner-title" id="turnBannerTitle">P1 Cat</strong>
          </div>

          <div class="canvas-hint" id="canvasHint">Adjust angle and power, then throw.</div>

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
              <li><span>Angle</span><strong>Left / Right or A / D</strong></li>
              <li><span>Power</span><strong>Up / Down or W / S</strong></li>
              <li><span>Projectile</span><strong>Q / E or 1 / 2 / 3</strong></li>
              <li><span>Throw</span><strong>Space or Enter</strong></li>
              <li><span>Restart / Menu</span><strong>R / M</strong></li>
            </ul>
          </div>

          <div class="panel notes-panel">
            <p class="panel-title">Shot Types</p>
            <p><strong>Normal:</strong> reliable all-round shot with balanced speed and damage.</p>
            <p><strong>Heavy:</strong> stronger blast and heavier drop. Best when your read is precise.</p>
            <p><strong>Light:</strong> flatter, easier arc with lighter damage and knock.</p>
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
