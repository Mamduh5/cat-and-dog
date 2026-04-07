export class EndScene {
  enter(game, title, subtitle) {
    game.state.scene = "end";
    game.state.phase = "gameover";
    game.state.hideBanner();
    game.ui.refs.endTitle.textContent = title;
    game.ui.refs.endSubtitle.textContent = subtitle;
    game.ui.refs.endOverlay.classList.remove("hidden");
  }
}
