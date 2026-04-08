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
    this.removeProjectile(game, projectile);
    game.shockwaves.push(new Shockwave({ x, y, toRadius: shot.splashRadius * 0.9 }));

    let highestDamage = 0;
    let wasDirect = false;

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
      }
    }

    if (wasDirect) {
      game.floatingTexts.push(new FloatingText({ x, y: y - 26, text: "Direct Hit!", color: "#ffd978", size: 26, life: 0.72, rise: 28 }));
    }

    if (highestDamage >= 12 || wasDirect) {
      game.state.screenShake = Math.max(game.state.screenShake, shot.shake + (wasDirect ? 2.5 : 0));
    }

    if (shot.fragmentCount) {
      this.spawnHeavyFragments(game, projectile, x, y, shot.fragmentCount, shot.fragmentSpeedMin, shot.fragmentSpeedMax);
    }

    game.state.pendingGameOver = game.players.some((player) => player.health.current <= 0);
    game.state.hint = wasDirect ? "Clean direct hit." : highestDamage > 0 ? "Splash damage landed." : "Missed clean. Wind will change next turn.";

    if (game.projectiles.length === 0 && game.state.projectileQueue.length === 0) {
      game.turnSystem.finishProjectileSequence(game);
    }
  }

  spawnHeavyFragments(game, projectile, x, y, count, speedMin, speedMax) {
    const shot = CONFIG.specialProjectiles.heavyShard;
    const owner = game.players[projectile.ownerIndex];
    const baseAngles = [225, 270, 315];

    for (let index = 0; index < count; index += 1) {
      const angle = (baseAngles[index] + randRange(-12, 12)) * DEG_TO_RAD;
      const speed = randRange(speedMin, speedMax);
      game.projectiles.push(new Projectile({
        x,
        y: y - 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ownerId: projectile.ownerId,
        ownerIndex: projectile.ownerIndex,
        targetIndex: projectile.targetIndex,
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
