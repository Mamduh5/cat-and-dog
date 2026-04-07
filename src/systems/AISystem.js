import { CONFIG } from "../config.js";
import { distance, DEG_TO_RAD, randInt, randRange } from "../utils/math.js";
import { ATTACK_ORDER } from "../utils/helpers.js";

export class AISystem {
  chooseShot(game) {
    const profile = CONFIG.cpuProfiles[game.state.cpuDifficulty];
    const cpu = game.players[1];
    const target = game.players[0];

    if (cpu.hasAmmo("heal") && cpu.health.current <= cpu.health.max * 0.34 && target.health.current > cpu.health.current - 10) {
      return {
        action: "heal",
        delay: randRange(profile.delayMin * 0.8, profile.delayMax * 0.9)
      };
    }

    const candidates = [];
    const availableShots = ATTACK_ORDER.filter((shotKey) => cpu.hasAmmo(shotKey));

    for (const shotKey of availableShots) {
      const shot = CONFIG.projectileTypes[shotKey];
      for (let angle = CONFIG.aim.angleMin; angle <= CONFIG.aim.angleMax; angle += profile.angleStep) {
        for (let power = CONFIG.aim.powerMin; power <= CONFIG.aim.powerMax; power += profile.powerStep) {
          const result = this.simulate(game, cpu, target, shot, angle, power);
          candidates.push({ shotKey, angle, power, score: result.score * profile.scoreBias + shot.aiBias });
        }
      }
    }

    candidates.sort((a, b) => a.score - b.score);
    const pool = candidates.slice(0, profile.topChoices);
    const pick = pool[randInt(0, Math.min(pool.length - 1, profile.choiceSpread))] || candidates[0];

    return {
      action: "projectile",
      shotKey: pick.shotKey,
      angle: Math.max(CONFIG.aim.angleMin, Math.min(CONFIG.aim.angleMax, pick.angle + randRange(-profile.angleJitter, profile.angleJitter))),
      power: Math.max(CONFIG.aim.powerMin, Math.min(CONFIG.aim.powerMax, pick.power + randRange(-profile.powerJitter, profile.powerJitter))),
      delay: randRange(profile.delayMin, profile.delayMax)
    };
  }

  simulate(game, cpu, target, shot, angle, power) {
    const angleRad = angle * DEG_TO_RAD;
    let x = cpu.transform.x + cpu.facing * (CONFIG.player.handOffsetX + Math.cos(angleRad) * 10);
    let y = CONFIG.world.groundY - CONFIG.player.handOffsetY - Math.sin(angleRad) * 8;
    let vx = Math.cos(angleRad) * power * shot.launchSpeedMultiplier * cpu.facing;
    let vy = -Math.sin(angleRad) * power * shot.launchSpeedMultiplier;
    let bestDistance = Number.POSITIVE_INFINITY;
    let finalDistance = Number.POSITIVE_INFINITY;
    let directHit = false;

    for (let step = 0; step < 320; step += 1) {
      vx += (game.state.wind * shot.windInfluenceMultiplier / shot.weight) * (1 / 60);
      vy += CONFIG.world.gravity * shot.gravityMultiplier * (1 / 60);
      x += vx * (1 / 60);
      y += vy * (1 / 60);

      const targetAnchor = target.getDamageAnchor();
      const currentDistance = distance(x, y, targetAnchor.x, targetAnchor.y);
      bestDistance = Math.min(bestDistance, currentDistance);

      for (const circle of target.getHitCircles()) {
        if (distance(x, y, circle.x, circle.y) <= shot.radius + circle.radius) {
          directHit = true;
          finalDistance = 0;
          break;
        }
      }

      if (directHit) {
        break;
      }
      if (y >= CONFIG.world.groundY) {
        finalDistance = distance(x, CONFIG.world.groundY, targetAnchor.x, targetAnchor.y);
        break;
      }
      if (x < -60 || x > CONFIG.canvas.width + 60) {
        finalDistance = currentDistance + 40;
        break;
      }
    }

    if (!Number.isFinite(finalDistance)) {
      finalDistance = bestDistance;
    }

    const splashScore = Math.max(0, finalDistance - shot.splashRadius * 0.7);
    return { score: directHit ? -35 : Math.min(bestDistance, splashScore * 1.06 + bestDistance * 0.24) };
  }
}
