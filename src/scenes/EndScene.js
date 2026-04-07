export class EndScene {
  enter(game, title, subtitle) {
    game.state.scene = "end";
    game.state.phase = "gameover";
    game.state.hideBanner();
    game.state.clearDragAim();
    game.ui.showEnd(title, subtitle);
  }
}
