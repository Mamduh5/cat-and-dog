export class MenuScene {
  enter(game) {
    game.state.mode = null;
    game.state.scene = "menu";
    game.state.phase = "menu";
    game.state.hideBanner();
    game.clearTransientEffects();
    game.ui.showMenu();
    game.state.hint = "Choose a mode to start a new match.";
  }
}
