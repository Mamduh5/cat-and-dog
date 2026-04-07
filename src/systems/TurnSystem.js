import { CONFIG } from "../config.js";
import { SHOT_ORDER, cycleList } from "../utils/helpers.js";
import { clamp, distance, lerp, randRange } from "../utils/math.js";

export class TurnSystem {
  startMatch(game, mode) {
    game.state.mode = mode;
    game.state.scene = "battle";
    game.state.phase = "ready";
    game.state.currentPlayerIndex = 0;
    game.state.pendingGameOver = false;
    game.state.preparedThrow = null;
    game.state.clearDragAim();
    game.clearTransientEffects();
    game.players[0].name = "P1 Cat";
    game.players[1].name = mode === "cpu" ? "CPU Dog" : "P2 Dog";
    game.players.forEach((player) => player.reset());
    game.startTurn(0);
  }

  update(game, dt) {
    if (game.state.phase === "ready") {
      game.state.turnTimer -= dt;
      if (game.state.turnTimer <= 0) this.enterAiming(game);
      return;
    }

    if (game.state.phase === "aiming") {
      if (game.isCpuTurn()) {
        game.state.cpuTimer -= dt;
        if (game.state.cpuTimer <= 0) this.tryShoot(game, true);
      } else {
        this.updateAim(game, dt);
      }
      return;
    }

    if (game.state.phase === "windup") {
      game.state.turnTimer -= dt;
      if (game.state.turnTimer <= 0) game.physicsSystem.launchPreparedShot(game);
      return;
    }

    if (game.state.phase === "projectile") {
      game.physicsSystem.updateProjectile(game, dt);
      return;
    }

    if (game.state.phase === "turn-end") {
      game.state.turnTimer -= dt;
      if (game.state.turnTimer <= 0) {
        if (game.state.pendingGameOver) game.finishGame();
        else game.startTurn(1 - game.state.currentPlayerIndex);
      }
    }
  }

  enterAiming(game) {
    const player = game.getCurrentPlayer();
    game.state.phase = "aiming";
    game.state.hideBanner();
    game.state.clearDragAim();

    if (game.isCpuTurn()) {
      const plan = game.aiSystem.chooseShot(game);
      player.weapon.shotType = plan.shotKey;
      player.aim.angle = plan.angle;
      player.aim.power = plan.power;
      game.state.cpuTimer = plan.delay;
      game.state.hint = `${player.name} is reading the wind...`;
    } else if (game.preset.touch) {
      game.state.hint = "Drag back from the throwing hand, then release to fire.";
    } else {
      game.state.hint = "Adjust angle, power, and projectile, then throw.";
    }
  }

  updateAim(game, dt) {
    if (game.state.dragAim) {
      return;
    }

    const left = game.input.isDown("ArrowLeft") || game.input.isDown("KeyA");
    const right = game.input.isDown("ArrowRight") || game.input.isDown("KeyD");
    const up = game.input.isDown("ArrowUp") || game.input.isDown("KeyW");
    const down = game.input.isDown("ArrowDown") || game.input.isDown("KeyS");

    if (left) this.adjustAim(game, "angle", -CONFIG.aim.angleSpeed * dt);
    if (right) this.adjustAim(game, "angle", CONFIG.aim.angleSpeed * dt);
    if (up) this.adjustAim(game, "power", CONFIG.aim.powerSpeed * dt);
    if (down) this.adjustAim(game, "power", -CONFIG.aim.powerSpeed * dt);
  }

  handleAction(game, code) {
    if (code === "Space" || code === "Enter") {
      this.tryShoot(game, false);
      return;
    }
    if (game.state.phase !== "aiming" || game.isCpuTurn()) {
      return;
    }

    if (code === "ArrowLeft" || code === "KeyA") this.adjustAim(game, "angle", -CONFIG.aim.angleTap);
    if (code === "ArrowRight" || code === "KeyD") this.adjustAim(game, "angle", CONFIG.aim.angleTap);
    if (code === "ArrowUp" || code === "KeyW") this.adjustAim(game, "power", CONFIG.aim.powerTap);
    if (code === "ArrowDown" || code === "KeyS") this.adjustAim(game, "power", -CONFIG.aim.powerTap);
    if (code === "KeyQ") this.setShotType(game, cycleList(SHOT_ORDER, game.getCurrentPlayer().weapon.shotType, -1));
    if (code === "KeyE") this.setShotType(game, cycleList(SHOT_ORDER, game.getCurrentPlayer().weapon.shotType, 1));
    if (code === "Digit1") this.setShotType(game, "normal");
    if (code === "Digit2") this.setShotType(game, "heavy");
    if (code === "Digit3") this.setShotType(game, "light");
  }

  handlePointer(game, event) {
    if (event.type === "cancel-all") {
      this.cancelDragAim(game);
      return;
    }

    if (!game.preset.touch) {
      return;
    }

    if (game.state.dragAim && (game.state.phase !== "aiming" || game.isCpuTurn())) {
      this.cancelDragAim(game);
    }

    if (event.type === "down") {
      this.startDragAim(game, event);
      return;
    }

    const drag = game.state.dragAim;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.type === "move") {
      this.updateDragAim(game, event.x, event.y);
      return;
    }

    if (event.type === "up") {
      this.releaseDragAim(game);
      return;
    }

    if (event.type === "cancel") {
      this.cancelDragAim(game, "Touch canceled. Drag again to aim.");
    }
  }

  adjustAim(game, type, amount) {
    const player = game.getCurrentPlayer();
    if (type === "angle") player.aim.angle = clamp(player.aim.angle + amount, CONFIG.aim.angleMin, CONFIG.aim.angleMax);
    else player.aim.power = clamp(player.aim.power + amount, CONFIG.aim.powerMin, CONFIG.aim.powerMax);
  }

  setShotType(game, shotKey) {
    const player = game.getCurrentPlayer();
    player.weapon.shotType = shotKey;
    game.state.hint = game.preset.touch
      ? `${player.name} switched to ${CONFIG.projectileTypes[shotKey].label.toLowerCase()} shot. Drag and release to fire.`
      : `${player.name} switched to ${CONFIG.projectileTypes[shotKey].label.toLowerCase()} shot.`;
  }

  tryShoot(game, force) {
    if (game.state.phase !== "aiming" || (!force && game.isCpuTurn())) return;

    const player = game.getCurrentPlayer();
    const shot = CONFIG.projectileTypes[player.weapon.shotType];
    game.state.preparedThrow = {
      playerIndex: game.state.currentPlayerIndex,
      angle: player.aim.angle,
      power: player.aim.power,
      shotKey: player.weapon.shotType
    };
    game.state.clearDragAim();
    player.setAnticipation(shot.windup);
    game.state.phase = "windup";
    game.state.turnTimer = shot.windup;
    game.state.hint = `${player.name} winds up a ${shot.label.toLowerCase()} shot...`;
  }

  startTurn(game, index) {
    const player = game.players[index];
    game.state.currentPlayerIndex = index;
    game.state.phase = "ready";
    game.state.turnTimer = CONFIG.turn.readyPause;
    game.state.pendingGameOver = false;
    game.state.preparedThrow = null;
    game.state.clearDragAim();
    game.projectile = null;
    game.state.wind = clamp(
      randRange(-CONFIG.world.maxWind, CONFIG.world.maxWind) + randRange(-CONFIG.world.windJitter, CONFIG.world.windJitter),
      -CONFIG.world.maxWind,
      CONFIG.world.maxWind
    );
    player.aim.angle = clamp(player.aim.angle, CONFIG.aim.angleMin, CONFIG.aim.angleMax);
    player.aim.power = clamp(player.aim.power, CONFIG.aim.powerMin, CONFIG.aim.powerMax);
    game.state.showBanner("Get Ready", `${player.name} Up`);
    game.state.hint = `${player.name} is stepping in.`;
  }

  startDragAim(game, event) {
    if (game.state.phase !== "aiming" || game.isCpuTurn()) {
      return;
    }

    const player = game.getCurrentPlayer();
    const launch = player.getLaunchPoint();
    const anchor = player.getDamageAnchor();
    const withinLaunch = distance(event.x, event.y, launch.x, launch.y) <= CONFIG.touch.pickupRadius;
    const withinBody = distance(event.x, event.y, anchor.x, anchor.y) <= CONFIG.touch.pickupRadius;

    if (!withinLaunch && !withinBody) {
      return;
    }

    game.state.startDragAim({
      pointerId: event.pointerId,
      anchorX: launch.x,
      anchorY: launch.y,
      currentX: event.x,
      currentY: event.y,
      dragDistance: 0,
      normalized: 0,
      angle: player.aim.angle,
      power: player.aim.power,
      canFire: false
    });

    this.updateDragAim(game, event.x, event.y);
    game.state.hint = "Pull back to set the arc and power. Release to fire.";
  }

  updateDragAim(game, x, y) {
    const drag = game.state.dragAim;
    if (!drag) {
      return;
    }

    const player = game.getCurrentPlayer();
    const pullX = Math.max(0, (drag.anchorX - x) * player.facing);
    const pullY = Math.max(0, y - drag.anchorY);
    const rawDistance = Math.hypot(pullX, pullY);
    const dragDistance = clamp(rawDistance, 0, CONFIG.touch.dragMax);
    const normalized = clamp((dragDistance - CONFIG.touch.dragMin) / (CONFIG.touch.dragMax - CONFIG.touch.dragMin), 0, 1);
    const angle = clamp(
      Math.atan2(pullY, Math.max(CONFIG.touch.angleBase, pullX)) * 180 / Math.PI,
      CONFIG.aim.angleMin,
      CONFIG.aim.angleMax
    );
    const power = lerp(CONFIG.aim.powerMin, CONFIG.aim.powerMax, normalized);

    player.aim.angle = angle;
    player.aim.power = power;
    game.state.updateDragAim({
      currentX: x,
      currentY: y,
      pullX,
      pullY,
      rawDistance,
      dragDistance,
      normalized,
      angle,
      power,
      canFire: dragDistance >= CONFIG.touch.fireThreshold
    });
  }

  releaseDragAim(game) {
    const drag = game.state.dragAim;
    if (!drag) {
      return;
    }

    const canFire = drag.canFire;
    game.state.clearDragAim();

    if (!canFire) {
      game.state.hint = "Pull back a little farther, then release to shoot.";
      return;
    }

    this.tryShoot(game, false);
  }

  cancelDragAim(game, hint = "") {
    if (!game.state.dragAim) {
      return;
    }

    game.state.clearDragAim();
    if (hint && game.state.phase === "aiming" && !game.isCpuTurn()) {
      game.state.hint = hint;
    }
  }
}
