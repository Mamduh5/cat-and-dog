import { CONFIG } from "../config.js";
import { FloatingText } from "../entities/FloatingText.js";
import { Particle } from "../entities/Particle.js";
import { Shockwave } from "../entities/Shockwave.js";
import { distance, lerp, randRange } from "../utils/math.js";

export class DamageSystem {
  resolveImpact(game, x, y, impact) {
    const shot = impact.projectile.shot;
    game.projectile = null;
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
        radius: randRange(2.4, 6.4),
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

    game.state.pendingGameOver = game.players.some((player) => player.health.current <= 0);
    game.state.phase = "turn-end";
    game.state.turnTimer = game.state.pendingGameOver ? CONFIG.turn.endPause : CONFIG.turn.impactPause;
    game.state.hint = wasDirect ? "Clean direct hit." : highestDamage > 0 ? "Splash damage landed." : "Missed clean. Wind will change next turn.";
  }

  useHeal(game, player) {
    const healItem = CONFIG.items.heal;
    const healAmount = Math.round(player.health.max * healItem.healRatio);
    const actual = player.heal(healAmount);
    if (actual <= 0) {
      return 0;
    }

    player.consumeAmmo("heal");
    const anchor = player.getDamageAnchor();
    game.shockwaves.push(new Shockwave({ x: anchor.x, y: anchor.y, toRadius: 44, color: "rgba(182, 255, 204," }));
    game.floatingTexts.push(new FloatingText({ x: anchor.x, y: anchor.y - 18, text: `+${actual}`, color: "#dbffdf", size: 24, rise: 34 }));

    for (let index = 0; index < 18; index += 1) {
      const angle = randRange(0, Math.PI * 2);
      const force = randRange(48, 122);
      game.particles.push(new Particle({
        x: anchor.x,
        y: anchor.y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - randRange(18, 70),
        life: randRange(0.26, 0.58),
        radius: randRange(2.6, 5.4),
        color: index % 2 === 0 ? healItem.coreColor : "#d7ffe0",
        gravityScale: 0.32,
        fadeScale: 1.1
      }));
    }

    game.state.hint = `${player.name} recovered ${actual} HP.`;
    return actual;
  }
}
