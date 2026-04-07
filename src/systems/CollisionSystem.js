import { CONFIG } from "../config.js";
import { clamp, distance } from "../utils/math.js";

export class CollisionSystem {
  checkProjectile(game) {
    const projectile = game.projectile;
    if (!projectile) {
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
      game.damageSystem.resolveImpact(game, clamp(projectile.transform.x, 0, CONFIG.canvas.width), clamp(projectile.transform.y, 0, CONFIG.world.groundY), { projectile });
      return true;
    }

    return false;
  }
}
