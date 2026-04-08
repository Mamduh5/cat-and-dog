import { CONFIG } from "../config.js";
import { clamp, distance } from "../utils/math.js";

export class CollisionSystem {
  checkProjectile(game, projectile) {
    if (!projectile) {
      return true;
    }

    const wallImpact = this.checkWallCollision(game, projectile);
    if (wallImpact) {
      game.damageSystem.resolveImpact(game, wallImpact.x, wallImpact.y, { projectile, wallTarget: game.state.wall });
      return true;
    }

    for (const player of game.players) {
      for (const circle of player.getHitCircles()) {
        if (distance(projectile.transform.x, projectile.transform.y, circle.x, circle.y) <= projectile.shot.radius + circle.radius) {
          game.damageSystem.resolveImpact(game, projectile.transform.x, projectile.transform.y, { projectile, directTarget: player });
          return true;
        }
      }
    }

    if (projectile.transform.y + projectile.shot.radius >= CONFIG.world.groundY) {
      game.damageSystem.resolveImpact(game, projectile.transform.x, CONFIG.world.groundY - 1, { projectile });
      return true;
    }

    if (
      projectile.transform.x < -80 ||
      projectile.transform.x > CONFIG.canvas.width + 80 ||
      projectile.transform.y > CONFIG.canvas.height + 80
    ) {
      game.damageSystem.resolveImpact(
        game,
        clamp(projectile.transform.x, 0, CONFIG.canvas.width),
        clamp(projectile.transform.y, 0, CONFIG.world.groundY),
        { projectile }
      );
      return true;
    }

    return false;
  }

  checkWallCollision(game, projectile) {
    const wall = game.state.wall;
    if (!wall || wall.destroyed || projectile.meta.sourceTag === "heavy-shard") {
      return null;
    }

    const left = wall.x - wall.width / 2;
    const right = wall.x + wall.width / 2;
    const top = CONFIG.world.groundY - wall.height;
    const bottom = CONFIG.world.groundY;
    const closestX = clamp(projectile.transform.x, left, right);
    const closestY = clamp(projectile.transform.y, top, bottom);

    if (distance(projectile.transform.x, projectile.transform.y, closestX, closestY) <= projectile.shot.radius) {
      return { x: closestX, y: closestY };
    }

    return null;
  }
}
