export class BattleScene {
  enter(game) {
    game.state.scene = "battle";
    game.ui.showBattle();
  }
}
