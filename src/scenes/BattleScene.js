export class BattleScene {
  enter(game) {
    game.state.scene = "battle";
    game.ui.refs.menuOverlay.classList.add("hidden");
    game.ui.refs.endOverlay.classList.add("hidden");
  }
}
