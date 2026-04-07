import { CONFIG } from "../config.js";
import { Projectile } from "../entities/Projectile.js";
import { Particle } from "../entities/Particle.js";
import { randRange, clamp } from "../utils/math.js";

export class PhysicsSystem {
  updateEffects(game, dt) {
    game.state.cloudOffsetNear += CONFIG.world.cloudSpeedNear * dt;
    game.state.cloudOffsetFar += CONFIG.world.cloudSpeedFar * dt;
    game.state.screenShake = Math.max(0, game.state.screenShake - dt * 16);
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
  }

  launchPreparedShot(game) {
    const prepared = game.state.preparedThrow;
    if (!prepared) {
      return;
    }

    const player = game.players[prepared.playerIndex];
    const shot = CONFIG.projectileTypes[prepared.shotKey];
    const spawn = player.getLaunchPoint();
    const angle = prepared.angle * Math.PI / 180;
    const launchSpeed = prepared.power * shot.launchSpeedMultiplier;

    game.projectile = new Projectile({
      x: spawn.x,
      y: spawn.y,
      vx: Math.cos(angle) * launchSpeed * player.facing,
      vy: -Math.sin(angle) * launchSpeed,
      ownerId: player.id,
      shotKey: prepared.shotKey,
      shot
    });

    player.consumeAmmo(prepared.shotKey);
    player.ensureSelectableShot();
    player.setRecoil(shot.recoil);
    game.state.preparedThrow = null;
    game.state.phase = "projectile";
    game.state.hint = `${player.name} launched a ${shot.label.toLowerCase()} shot.`;
    game.state.screenShake = Math.max(game.state.screenShake, 2.6);
    this.addLaunchBurst(game, spawn.x, spawn.y, player.facing, shot);
  }

  addLaunchBurst(game, x, y, facing, shot) {
    for (let index = 0; index < shot.launchBurst; index += 1) {
      game.particles.push(new Particle({
        x,
        y,
        vx: randRange(-28, 70) * facing,
        vy: randRange(-70, 15),
        life: randRange(0.18, 0.35),
        radius: randRange(2, 4.5),
        color: shot.coreColor,
        gravityScale: 0.2,
        fadeScale: 1.4
      }));
    }
  }

  updateProjectile(game, dt) {
    const projectile = game.projectile;
    const speed = Math.abs(projectile.transform.vx) + Math.abs(projectile.transform.vy);
    const steps = clamp(Math.ceil((speed * dt) / CONFIG.projectile.maxStepPixels), 1, 8);
    const stepDt = dt / steps;

    for (let step = 0; step < steps; step += 1) {
      const shot = projectile.shot;
      const windAcceleration = game.state.wind * shot.windInfluenceMultiplier / shot.weight;
      projectile.transform.vx += windAcceleration * stepDt;
      projectile.transform.vy += CONFIG.world.gravity * shot.gravityMultiplier * stepDt;
      projectile.transform.x += projectile.transform.vx * stepDt;
      projectile.transform.y += projectile.transform.vy * stepDt;
      projectile.age += stepDt;
      projectile.trail.push({ x: projectile.transform.x, y: projectile.transform.y });
      if (projectile.trail.length > CONFIG.projectile.trailPoints) {
        projectile.trail.shift();
      }
      if (game.collisionSystem.checkProjectile(game)) {
        break;
      }
    }
  }
}
