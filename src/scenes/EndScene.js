export class EndScene {
  enter(game, title, subtitle) {
    game.state.scene = "end";
    game.state.phase = "gameover";
    game.state.hideBanner();
    game.ui.showEnd(title, subtitle);
  }
}
