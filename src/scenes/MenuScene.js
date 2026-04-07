export class MenuScene {
  enter(game) {
    game.state.mode = null;
    game.state.scene = "menu";
    game.state.phase = "menu";
    game.state.hideBanner();
    game.projectile = null;
    game.particles = [];
    game.shockwaves = [];
    game.floatingTexts = [];
    game.ui.refs.menuOverlay.classList.remove("hidden");
    game.ui.refs.endOverlay.classList.add("hidden");
    game.state.hint = "Choose a mode to start a new match.";
  }
}
