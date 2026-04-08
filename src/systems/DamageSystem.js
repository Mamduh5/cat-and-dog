import { CONFIG } from "../config.js";
import { FloatingText } from "../entities/FloatingText.js";
import { Particle } from "../entities/Particle.js";
import { Projectile } from "../entities/Projectile.js";
import { Shockwave } from "../entities/Shockwave.js";
import { DEG_TO_RAD, distance, lerp, randRange } from "../utils/math.js";

export class DamageSystem {
  removeProjectile(game, projectile) {
    game.projectiles = game.projectiles.filter((entry) => entry !== projectile);
  }

  resolveImpact(game, x, y, impact) {
    const { projectile } = impact;
    const shot = projectile.shot;

    if (shot.fragmentCount && projectile.meta.sourceTag !== "heavy-detonation") {
      this.resolveHeavyImpact(game, x, y, impact);
      return;
    }

    this.removeProjectile(game, projectile);
    this.spawnExplosionFx(game, x, y, shot);
    game.sound.play("impact", { heavy: shot.shape === "rock" || shot.shape === "rocket", wall: Boolean(impact.wallTarget) });
    const result = this.applyImpactDamage(game, x, y, impact, shot);

    if (result.wasDirect) {
      game.floatingTexts.push(new FloatingText({ x, y: y - 26, text: "Direct Hit!", color: "#ffd978", size: 26, life: 0.72, rise: 28 }));
    }

    if (result.highestDamage >= 12 || result.wasDirect || result.wallDamage > 0) {
      game.state.screenShake = Math.max(game.state.screenShake, shot.shake + (result.wasDirect ? 2.5 : 0));
    }

    game.state.pendingGameOver = game.players.some((player) => player.health.current <= 0);
    game.state.hint = this.getImpactHint(result);

    this.finishIfSettled(game);
  }

  resolveHeavyImpact(game, x, y, impact) {
    const { projectile } = impact;
    const shot = projectile.shot;
    this.removeProjectile(game, projectile);
    const result = this.applyImpactDamage(game, x, y, impact, shot);

    game.sound.play("impact", { heavy: true, wall: Boolean(impact.wallTarget) });
    game.state.screenShake = Math.max(game.state.screenShake, 3.4 + (result.wasDirect ? 1.8 : 0));
    game.state.hint = result.wasDirect ? "Heavy impact landed. Burst incoming." : result.wallDamage > 0 ? "Heavy rock lodged in the wall." : "Heavy shot stuck. Burst incoming.";
    game.state.pendingGameOver = game.players.some((player) => player.health.current <= 0);

    game.state.delayedBursts.push({
      kind: "heavy",
      x,
      y,
      timer: CONFIG.turn.heavyBurstDelay,
      ownerId: projectile.ownerId,
      ownerIndex: projectile.ownerIndex,
      targetIndex: projectile.targetIndex
    });
  }

  detonateHeavyBurst(game, burst) {
    const shot = CONFIG.projectileTypes.heavy;
    this.spawnExplosionFx(game, burst.x, burst.y, shot);
    game.sound.play("impact", { heavy: true });
    this.spawnHeavyFragments(game, burst.x, burst.y, burst.ownerId, burst.ownerIndex, burst.targetIndex, shot.fragmentCount, shot.fragmentSpeedMin, shot.fragmentSpeedMax);
    game.state.hint = "Heavy burst scatters shards.";
    this.finishIfSettled(game);
  }

  spawnExplosionFx(game, x, y, shot) {
    game.shockwaves.push(new Shockwave({ x, y, toRadius: shot.splashRadius * 0.9 }));

    for (let index = 0; index < shot.explosionParticles; index += 1) {
      const angle = randRange(0, Math.PI * 2);
      const force = randRange(80, 210) * shot.explosionForce;
      game.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - randRange(20, 90),
        life: randRange(0.22, CONFIG.particles.maxLife),
        radius: randRange(2.4, 6.4) * (shot.renderScale ?? 1),
        color: index % 3 === 0 ? shot.coreColor : "#ffdca4",
        gravityScale: 0.46,
        fadeScale: 1.2
      }));
    }
  }

  applyImpactDamage(game, x, y, impact, shot) {
    let highestDamage = 0;
    let wasDirect = false;
    let wallDamage = 0;

    if (impact.wallTarget && !impact.wallTarget.destroyed) {
      wallDamage = shot.directDamage ?? shot.damageMax + shot.directBonus;
      this.damageWall(game, wallDamage);
    }

    for (const player of game.players) {
      const anchor = player.getDamageAnchor();
      const dist = distance(x, y, anchor.x, anchor.y);
      const direct = impact.directTarget === player;
      let damage = 0;

      if (direct) {
        damage = shot.directDamage ?? shot.damageMax + shot.directBonus;
        wasDirect = true;
      } else if (dist <= shot.splashRadius) {
        const ratio = 1 - dist / shot.splashRadius;
        damage = Math.round(lerp(shot.damageMin, shot.damageMax, Math.pow(ratio, 1.15)));
      }

      if (damage > 0) {
        const wasAlive = player.health.current > 0;
        highestDamage = Math.max(highestDamage, damage);
        player.takeDamage(damage);
        game.floatingTexts.push(new FloatingText({
          x: anchor.x,
          y: anchor.y - (direct ? 24 : 14),
          text: direct ? `DIRECT -${damage}` : `-${damage}`,
          color: direct ? "#fff0c8" : "#fff8e7",
          size: direct ? 24 : 20,
          rise: direct ? 46 : 36
        }));
        if (wasAlive && player.health.current <= 0) {
          game.floatingTexts.push(new FloatingText({
            x: anchor.x,
            y: anchor.y - 40,
            text: "K.O.",
            color: "#ffd978",
            size: 28,
            life: 0.9,
            rise: 18
          }));
          game.state.screenShake = Math.max(game.state.screenShake, shot.shake + 2.4);
        }
      }
    }

    return { highestDamage, wasDirect, wallDamage };
  }

  damageWall(game, amount) {
    const wall = game.state.wall;
    if (!wall || wall.destroyed || amount <= 0) {
      return 0;
    }

    const actual = Math.min(amount, wall.hp);
    wall.hp = Math.max(0, wall.hp - amount);
    wall.flashTimer = 0.24;
    game.floatingTexts.push(new FloatingText({ x: wall.x, y: CONFIG.world.groundY - wall.height - 10, text: `-${actual}`, color: "#fff0d2", size: 18, rise: 22 }));

    if (wall.hp <= 0) {
      wall.destroyed = true;
      game.shockwaves.push(new Shockwave({ x: wall.x, y: CONFIG.world.groundY - wall.height * 0.48, toRadius: 58 }));
      game.floatingTexts.push(new FloatingText({ x: wall.x, y: CONFIG.world.groundY - wall.height - 24, text: "Wall Down", color: "#ffe3bf", size: 24, rise: 26 }));
      for (let index = 0; index < 24; index += 1) {
        const angle = randRange(-Math.PI, 0);
        const force = randRange(60, 180);
        game.particles.push(new Particle({
          x: wall.x,
          y: CONFIG.world.groundY - wall.height * 0.45,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          life: randRange(0.22, 0.52),
          radius: randRange(2.2, 5.2),
          color: index % 2 === 0 ? "#c6864f" : "#7b5a40",
          gravityScale: 0.44,
          fadeScale: 1.1
        }));
      }
    }

    return actual;
  }

  spawnHeavyFragments(game, x, y, ownerId, ownerIndex, targetIndex, count, speedMin, speedMax) {
    const shot = CONFIG.specialProjectiles.heavyShard;
    const owner = game.players[ownerIndex];
    const baseAngles = [225, 270, 315];

    for (let index = 0; index < count; index += 1) {
      const angle = (baseAngles[index] + randRange(-12, 12)) * DEG_TO_RAD;
      const speed = randRange(speedMin, speedMax);
      game.projectiles.push(new Projectile({
        x,
        y: y - 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ownerId,
        ownerIndex,
        targetIndex,
        shotKey: "heavy",
        shot,
        sourceTag: "heavy-shard"
      }));
      game.particles.push(new Particle({
        x,
        y,
        vx: randRange(-60, 60),
        vy: randRange(-140, -36),
        life: randRange(0.16, 0.28),
        radius: randRange(1.6, 3.2),
        color: owner.render.colors.accent,
        gravityScale: 0.3,
        fadeScale: 1.1
      }));
    }
  }

  getImpactHint(result) {
    if (result.wasDirect) {
      return "Clean direct hit.";
    }
    if (result.wallDamage > 0) {
      return result.highestDamage > 0 ? "Wall hit and splash damage landed." : "Shot slammed into the wall.";
    }
    if (result.highestDamage > 0) {
      return "Splash damage landed.";
    }
    return "Missed clean. Wind will change next turn.";
  }

  finishIfSettled(game) {
    if (game.projectiles.length === 0 && game.state.projectileQueue.length === 0 && game.state.delayedBursts.length === 0) {
      game.turnSystem.finishProjectileSequence(game);
    }
  }

  useHeal(game, player, options = {}) {
    const healItem = CONFIG.items.heal;
    const healAmount = options.full ? player.health.max : Math.round(player.health.max * healItem.healRatio);
    const actual = player.heal(healAmount);
    if (actual <= 0) {
      return 0;
    }

    player.consumeAmmo("heal");
    const anchor = player.getDamageAnchor();
    game.shockwaves.push(new Shockwave({ x: anchor.x, y: anchor.y, toRadius: options.full ? 62 : 44, color: "rgba(182, 255, 204," }));
    game.floatingTexts.push(new FloatingText({ x: anchor.x, y: anchor.y - 18, text: `+${actual}`, color: "#dbffdf", size: options.full ? 28 : 24, rise: 34 }));

    for (let index = 0; index < (options.full ? 28 : 18); index += 1) {
      const angle = randRange(0, Math.PI * 2);
      const force = randRange(48, options.full ? 156 : 122);
      game.particles.push(new Particle({
        x: anchor.x,
        y: anchor.y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - randRange(18, 70),
        life: randRange(0.26, 0.62),
        radius: randRange(2.6, 5.8),
        color: index % 2 === 0 ? healItem.coreColor : "#d7ffe0",
        gravityScale: 0.32,
        fadeScale: 1.1
      }));
    }

    game.state.hint = options.full ? `${player.name} cheats back to full HP.` : `${player.name} recovered ${actual} HP.`;
    return actual;
  }
}

