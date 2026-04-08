import { CONFIG } from "../config.js";
import { Projectile } from "../entities/Projectile.js";
import { Particle } from "../entities/Particle.js";
import { clamp, randRange } from "../utils/math.js";

const normalizeAngle = (value) => {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

export class PhysicsSystem {
  updateEffects(game, dt) {
    game.state.cloudOffsetNear += CONFIG.world.cloudSpeedNear * dt;
    game.state.cloudOffsetFar += CONFIG.world.cloudSpeedFar * dt;
    game.state.screenShake = Math.max(0, game.state.screenShake - dt * 16);
    game.state.wall.flashTimer = Math.max(0, game.state.wall.flashTimer - dt);
    game.players.forEach((player) => player.update(dt));

    game.particles = game.particles.filter((particle) => {
      particle.transform.vy += CONFIG.world.gravity * particle.gravityScale * dt;
      particle.transform.x += particle.transform.vx * dt;
      particle.transform.y += particle.transform.vy * dt;
      particle.life -= dt;
      return particle.life > 0;
    });

    game.shockwaves = game.shockwaves.filter((wave) => (wave.life -= dt) > 0);
    game.floatingTexts = game.floatingTexts.filter((text) => {
      text.y -= text.rise * dt;
      text.life -= dt;
      return text.life > 0;
    });

    const remainingBursts = [];
    for (const burst of game.state.delayedBursts) {
      burst.timer -= dt;
      if (burst.timer <= 0) {
        game.damageSystem.detonateHeavyBurst(game, burst);
      } else {
        remainingBursts.push(burst);
      }
    }
    game.state.delayedBursts = remainingBursts;
  }

  createProjectileSpec(player, shotKey, shot, angle, power, overrides = {}) {
    const radians = angle * Math.PI / 180;
    const launchPoint = player.getLaunchPoint();
    const launchSpeed = power * shot.launchSpeedMultiplier * (overrides.speedScale ?? 1);
    return {
      delay: overrides.delay ?? 0,
      x: launchPoint.x + (overrides.xOffset ?? 0),
      y: launchPoint.y + (overrides.yOffset ?? 0),
      vx: Math.cos(radians + (overrides.angleOffsetRad ?? 0)) * launchSpeed * player.facing,
      vy: -Math.sin(radians + (overrides.angleOffsetRad ?? 0)) * launchSpeed,
      ownerId: player.id,
      ownerIndex: player.id - 1,
      targetIndex: player.id === 1 ? 1 : 0,
      shotKey,
      shot,
      sourceTag: overrides.sourceTag || "main"
    };
  }

  spawnProjectile(game, spec) {
    const projectile = new Projectile(spec);
    game.projectiles.push(projectile);
    this.addLaunchBurst(game, projectile.transform.x, projectile.transform.y, game.players[spec.ownerIndex].facing, projectile.shot, projectile.meta.sourceTag);
    return projectile;
  }

  queueProjectile(game, spec) {
    if ((spec.delay ?? 0) <= 0) {
      this.spawnProjectile(game, spec);
      return;
    }
    game.state.projectileQueue.push(spec);
  }

  flushQueuedProjectiles(game, dt) {
    if (game.state.projectileQueue.length === 0) {
      return;
    }

    const remaining = [];
    for (const spec of game.state.projectileQueue) {
      spec.delay -= dt;
      if (spec.delay <= 0) {
        this.spawnProjectile(game, spec);
      } else {
        remaining.push(spec);
      }
    }
    game.state.projectileQueue = remaining;
  }

  launchPreparedShot(game) {
    const prepared = game.state.preparedThrow;
    if (!prepared) {
      return;
    }

    const player = game.players[prepared.playerIndex];
    const shot = CONFIG.projectileTypes[prepared.shotKey];
    player.consumeAmmo(prepared.shotKey);
    player.ensureSelectableShot();
    player.setRecoil(shot.recoil);
    game.state.preparedThrow = null;
    game.state.phase = "projectile";
    game.sound.play("launch", { shotKey: prepared.shotKey });
    game.state.projectileQueue = [];
    game.state.screenShake = Math.max(game.state.screenShake, 2.2);

    if (prepared.shotKey === "light") {
      this.launchLightBurst(game, player, prepared, shot);
      game.state.hint = `${player.name} sprays a light burst.`;
    } else {
      this.spawnProjectile(game, this.createProjectileSpec(player, prepared.shotKey, shot, prepared.angle, prepared.power));
      if (prepared.bossEcho) {
        const echoShot = CONFIG.specialProjectiles.bossEcho;
        this.queueProjectile(game, this.createProjectileSpec(player, "normal", echoShot, prepared.angle, prepared.power, {
          delay: 0.15,
          angleOffsetRad: randRange(-0.08, 0.08),
          speedScale: 0.9,
          sourceTag: "bossEcho"
        }));
        game.state.hint = `${player.name} cheats in an echo shot.`;
      } else {
        game.state.hint = `${player.name} launched a ${shot.label.toLowerCase()} shot.`;
      }
    }
  }

  launchLightBurst(game, player, prepared, shot) {
    const burstAngles = [0, shot.burstSpread * Math.PI / 180, -shot.burstSpread * 1.45 * Math.PI / 180];
    for (let index = 0; index < shot.burstCount; index += 1) {
      this.queueProjectile(game, this.createProjectileSpec(player, prepared.shotKey, shot, prepared.angle, prepared.power, {
        delay: index * shot.burstDelay,
        angleOffsetRad: burstAngles[index] ?? 0,
        speedScale: 1 - index * shot.burstPowerFalloff,
        sourceTag: `burst-${index + 1}`
      }));
    }
  }

  addLaunchBurst(game, x, y, facing, shot, sourceTag = "main") {
    const burstScale = sourceTag === "bossEcho" ? 0.7 : sourceTag.startsWith("burst-") ? 0.52 : 1;
    for (let index = 0; index < Math.max(4, Math.round(shot.launchBurst * burstScale)); index += 1) {
      game.particles.push(new Particle({
        x,
        y,
        vx: randRange(-28, 70) * facing * burstScale,
        vy: randRange(-70, 15) * burstScale,
        life: randRange(0.16, 0.34),
        radius: randRange(1.6, 4.2) * burstScale,
        color: shot.coreColor,
        gravityScale: 0.2,
        fadeScale: 1.4
      }));
    }
  }

  updateProjectiles(game, dt) {
    this.flushQueuedProjectiles(game, dt);

    for (const projectile of [...game.projectiles]) {
      this.updateProjectile(game, projectile, dt);
    }
  }

  updateProjectile(game, projectile, dt) {
    const speed = Math.abs(projectile.transform.vx) + Math.abs(projectile.transform.vy);
    const steps = clamp(Math.ceil((speed * dt) / CONFIG.projectile.maxStepPixels), 1, 8);
    const stepDt = dt / steps;

    for (let step = 0; step < steps; step += 1) {
      const shot = projectile.shot;
      this.applyTracking(game, projectile, stepDt);
      const windAcceleration = game.state.wind * shot.windInfluenceMultiplier / (shot.weight || 1);
      projectile.transform.vx += windAcceleration * stepDt;
      projectile.transform.vy += CONFIG.world.gravity * shot.gravityMultiplier * stepDt;
      projectile.transform.x += projectile.transform.vx * stepDt;
      projectile.transform.y += projectile.transform.vy * stepDt;
      projectile.age += stepDt;
      projectile.trail.push({ x: projectile.transform.x, y: projectile.transform.y });
      if (projectile.trail.length > CONFIG.projectile.trailPoints) {
        projectile.trail.shift();
      }
      if (game.collisionSystem.checkProjectile(game, projectile)) {
        break;
      }
    }
  }

  applyTracking(game, projectile, dt) {
    const shot = projectile.shot;
    if (!shot.trackingDelay || projectile.age < shot.trackingDelay) {
      return;
    }

    const target = game.players[projectile.targetIndex ?? (projectile.ownerIndex === 0 ? 1 : 0)];
    if (!target || target.health.current <= 0) {
      return;
    }

    const anchor = target.getDamageAnchor();
    const desiredAngle = Math.atan2(anchor.y - projectile.transform.y, anchor.x - projectile.transform.x);
    const currentAngle = Math.atan2(projectile.transform.vy, projectile.transform.vx || 0.001);
    const turn = clamp(normalizeAngle(desiredAngle - currentAngle), -shot.trackingTurnRate * dt, shot.trackingTurnRate * dt);
    const currentSpeed = Math.hypot(projectile.transform.vx, projectile.transform.vy);
    const maxSpeed = projectile.meta.baseSpeed * (shot.trackingMaxSpeedMultiplier ?? 1);
    const nextSpeed = Math.min(maxSpeed, currentSpeed + (shot.trackingAcceleration ?? 0) * dt);
    const nextAngle = currentAngle + turn;

    projectile.meta.trackingActive = true;
    projectile.transform.vx = Math.cos(nextAngle) * nextSpeed;
    projectile.transform.vy = Math.sin(nextAngle) * nextSpeed;
  }
}

