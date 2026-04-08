import { CONFIG } from "../config.js";
import { clamp, distance, DEG_TO_RAD, randInt, randRange } from "../utils/math.js";
import { ATTACK_ORDER } from "../utils/helpers.js";

const normalizeAngle = (value) => {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

export class AISystem {
  chooseShot(game, options = {}) {
    const profile = CONFIG.cpuProfiles[game.state.cpuDifficulty];
    const cpu = game.players[1];
    const target = game.players[0];

    if (game.state.cpuDifficulty === "impossible") {
      return this.chooseImpossibleShot(game, cpu, target, profile, options);
    }

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

  chooseImpossibleShot(game, cpu, target, profile, options) {
    const wallAlive = Boolean(game.state.wall && !game.state.wall.destroyed);
    const targetLead = target.health.current - cpu.health.current;
    const desperate = cpu.health.current <= cpu.health.max * profile.fullHealThreshold;
    const pressured = cpu.health.current <= profile.killPressureHp || targetLead >= 10;

    if (!options.followUp && cpu.hasAmmo("heal") && (desperate || pressured)) {
      return {
        action: "heal",
        fullHeal: true,
        delay: randRange(profile.delayMin * 0.72, profile.delayMax * 0.84)
      };
    }

    const shot = CONFIG.projectileTypes.normal;
    const candidates = [];
    for (let angle = CONFIG.aim.angleMin; angle <= CONFIG.aim.angleMax; angle += profile.angleStep) {
      for (let power = CONFIG.aim.powerMin; power <= CONFIG.aim.powerMax; power += profile.powerStep) {
        const result = this.simulate(game, cpu, target, shot, angle, power);
        candidates.push({ angle, power, score: result.score * profile.scoreBias, ...result });
      }
    }

    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0];
    const cleanPunish = best.directHit || best.bestDistance <= profile.punishWindow;
    const killWindow = target.health.current <= profile.killPressureHp;
    const stablePick = candidates.find((candidate) => !candidate.wallHit && candidate.bestDistance <= profile.punishWindow + 8) || best;
    const bossDouble = !options.followUp && (cleanPunish || killWindow || Math.random() < profile.doubleShotChance);
    const bossEcho = cleanPunish || (!wallAlive && target.health.current <= CONFIG.player.maxHp * 0.62) || Math.random() < profile.echoShotChance;
    const chosen = cleanPunish ? stablePick : best;
    const angleJitter = cleanPunish ? profile.angleJitter * 0.55 : profile.angleJitter;
    const powerJitter = cleanPunish ? profile.powerJitter * 0.55 : profile.powerJitter;

    return {
      action: "projectile",
      shotKey: "normal",
      angle: Math.max(CONFIG.aim.angleMin, Math.min(CONFIG.aim.angleMax, chosen.angle + randRange(-angleJitter, angleJitter))),
      power: Math.max(CONFIG.aim.powerMin, Math.min(CONFIG.aim.powerMax, chosen.power + randRange(-powerJitter, powerJitter))),
      delay: randRange(profile.delayMin, profile.delayMax),
      bossDouble,
      bossEcho,
      cleanPunish
    };
  }

  simulate(game, cpu, target, shot, angle, power) {
    if (shot.burstCount) {
      return this.simulateBurst(game, cpu, target, shot, angle, power);
    }
    return this.simulateSingle(game, cpu, target, shot, angle, power);
  }

  simulateBurst(game, cpu, target, shot, angle, power) {
    const offsets = [0, shot.burstSpread, -shot.burstSpread * 1.45];
    let bestScore = Number.POSITIVE_INFINITY;
    let bestDistance = Number.POSITIVE_INFINITY;
    let directHit = false;

    for (let index = 0; index < shot.burstCount; index += 1) {
      const result = this.simulateSingle(game, cpu, target, shot, angle + (offsets[index] ?? 0), power * (1 - index * shot.burstPowerFalloff));
      bestScore = Math.min(bestScore, result.score + index * 2.2);
      bestDistance = Math.min(bestDistance, result.bestDistance);
      directHit ||= result.directHit;
    }

    return { score: bestScore, bestDistance, directHit, wallHit: false };
  }

  simulateSingle(game, cpu, target, shot, angle, power) {
    const angleRad = angle * DEG_TO_RAD;
    let x = cpu.transform.x + cpu.facing * (CONFIG.player.handOffsetX + Math.cos(angleRad) * 10);
    let y = CONFIG.world.groundY - CONFIG.player.handOffsetY - Math.sin(angleRad) * 8;
    let vx = Math.cos(angleRad) * power * shot.launchSpeedMultiplier * cpu.facing;
    let vy = -Math.sin(angleRad) * power * shot.launchSpeedMultiplier;
    let bestDistance = Number.POSITIVE_INFINITY;
    let finalDistance = Number.POSITIVE_INFINITY;
    let directHit = false;
    let wallHit = false;

    for (let step = 0; step < 380; step += 1) {
      if (shot.trackingDelay && step / 60 >= shot.trackingDelay) {
        const anchor = target.getDamageAnchor();
        const desiredAngle = Math.atan2(anchor.y - y, anchor.x - x);
        const currentAngle = Math.atan2(vy, vx || 0.001);
        const turn = clamp(normalizeAngle(desiredAngle - currentAngle), -shot.trackingTurnRate / 60, shot.trackingTurnRate / 60);
        const currentSpeed = Math.hypot(vx, vy);
        const maxSpeed = power * shot.launchSpeedMultiplier * (shot.trackingMaxSpeedMultiplier ?? 1);
        const nextSpeed = Math.min(maxSpeed, currentSpeed + (shot.trackingAcceleration ?? 0) / 60);
        vx = Math.cos(currentAngle + turn) * nextSpeed;
        vy = Math.sin(currentAngle + turn) * nextSpeed;
      }

      vx += (game.state.wind * shot.windInfluenceMultiplier / shot.weight) * (1 / 60);
      vy += CONFIG.world.gravity * shot.gravityMultiplier * (1 / 60);
      x += vx * (1 / 60);
      y += vy * (1 / 60);

      const targetAnchor = target.getDamageAnchor();
      const currentDistance = distance(x, y, targetAnchor.x, targetAnchor.y);
      bestDistance = Math.min(bestDistance, currentDistance);

      const wallPenalty = this.checkWall(game, x, y, shot.radius);
      if (wallPenalty.hit) {
        wallHit = true;
        finalDistance = currentDistance + wallPenalty.penalty;
        break;
      }

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
    return {
      score: directHit ? -35 : Math.min(bestDistance, splashScore * 1.06 + bestDistance * 0.24),
      directHit,
      bestDistance,
      wallHit
    };
  }

  checkWall(game, x, y, radius) {
    const wall = game.state.wall;
    if (!wall || wall.destroyed) {
      return { hit: false, penalty: 0 };
    }

    const left = wall.x - wall.width / 2;
    const right = wall.x + wall.width / 2;
    const top = CONFIG.world.groundY - wall.height;
    const bottom = CONFIG.world.groundY;
    const closestX = clamp(x, left, right);
    const closestY = clamp(y, top, bottom);
    const hit = distance(x, y, closestX, closestY) <= radius;
    return { hit, penalty: 110 };
  }
}
