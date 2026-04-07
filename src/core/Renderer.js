import { CONFIG } from "../config.js";
import { formatAmmoCount, signLabel } from "../utils/helpers.js";
import { easeOutCubic, lerp } from "../utils/math.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvas.width = CONFIG.canvas.width;
    this.canvas.height = CONFIG.canvas.height;
  }

  render(game) {
    const ctx = this.ctx;
    const shake = game.state.screenShake;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
    }
    this.drawBackground(ctx, game);
    this.drawWindIndicator(ctx, game.state.wind);
    this.drawGround(ctx, game);
    this.drawAimGuide(ctx, game);
    game.players.forEach((player, index) => {
      const active = index === game.state.currentPlayerIndex && ["ready", "aiming", "windup"].includes(game.state.phase);
      this.drawPlayer(ctx, player, game, active);
    });
    if (game.state.dragAim) this.drawDragAim(ctx, game);
    game.particles.forEach((particle) => this.drawParticle(ctx, particle));
    game.shockwaves.forEach((wave) => this.drawShockwave(ctx, wave));
    if (game.projectile) this.drawProjectile(ctx, game.projectile);
    game.floatingTexts.forEach((text) => this.drawFloatingText(ctx, text));
    ctx.restore();
    this.drawCanvasHud(ctx, game);
  }

  drawBackground(ctx, game) {
    const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.world.groundY);
    sky.addColorStop(0, "#d6f1ff");
    sky.addColorStop(0.65, "#f9efc9");
    sky.addColorStop(1, "#f5ddab");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.canvas.width, CONFIG.world.groundY);
    ctx.fillStyle = "#fff4b4";
    ctx.beginPath();
    ctx.arc(120, 92, 38, 0, Math.PI * 2);
    ctx.fill();
    this.drawCloud(ctx, 90 + (game.state.cloudOffsetFar * 0.6) % 1120 - 160, 120, 0.9, 0.88);
    this.drawCloud(ctx, 340 + (game.state.cloudOffsetNear * 0.7) % 1080 - 180, 74, 0.78, 0.94);
    this.drawCloud(ctx, 740 + (game.state.cloudOffsetFar * 0.4) % 1160 - 190, 144, 1.04, 0.86);
    ctx.fillStyle = "#b1c6d7";
    ctx.fillRect(0, 255, this.canvas.width, 70);
    this.drawHouse(ctx, 90, 278, "#9bb6c8");
    this.drawHouse(ctx, 290, 286, "#b6c8d8");
    this.drawHouse(ctx, 635, 280, "#9eb6c9");
    ctx.fillStyle = "#9dbe7c";
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.world.groundY);
    ctx.quadraticCurveTo(170, 355, 360, CONFIG.world.groundY);
    ctx.quadraticCurveTo(560, 332, 760, CONFIG.world.groundY);
    ctx.lineTo(this.canvas.width, CONFIG.world.groundY);
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.lineTo(0, this.canvas.height);
    ctx.closePath();
    ctx.fill();
    this.drawFence(ctx);
    this.drawBush(ctx, 46, 404, 1.1);
    this.drawBush(ctx, 262, 416, 0.94);
    this.drawBush(ctx, 665, 410, 1.08);
    this.drawBush(ctx, 852, 418, 0.9);
  }

  drawHouse(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 54, 84, 54);
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 54);
    ctx.lineTo(x + 42, y - 86);
    ctx.lineTo(x + 94, y - 54);
    ctx.closePath();
    ctx.fill();
  }

  drawFence(ctx) {
    ctx.fillStyle = "#d7c39a";
    for (let x = 0; x < this.canvas.width; x += 28) ctx.fillRect(x, 350, 16, 80);
    ctx.fillStyle = "#c2ab7f";
    ctx.fillRect(0, 368, this.canvas.width, 10);
    ctx.fillRect(0, 404, this.canvas.width, 10);
  }

  drawBush(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5b9b57";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.arc(24, -8, 22, 0, Math.PI * 2);
    ctx.arc(48, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCloud(ctx, x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(18, -10, 24, 0, Math.PI * 2);
    ctx.arc(40, -2, 20, 0, Math.PI * 2);
    ctx.arc(55, 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawWindIndicator(ctx, wind) {
    const normalized = Math.max(-1, Math.min(1, wind / CONFIG.world.maxWind));
    const intensity = Math.abs(normalized);
    ctx.save();
    ctx.translate(this.canvas.width / 2, 76);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    this.fillRoundedRect(ctx, -108, -24, 216, 52, 18);
    ctx.fillStyle = "#17304d";
    ctx.font = "bold 16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(`Wind ${wind > 5 ? "->" : wind < -5 ? "<-" : "calm"} ${Math.round(Math.abs(wind))}`, 0, -2);
    ctx.strokeStyle = "rgba(23, 48, 77, 0.14)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-74, 14);
    ctx.lineTo(74, 14);
    ctx.stroke();
    const arrowX = normalized * 74;
    ctx.strokeStyle = intensity > 0.58 ? "#e8703a" : "#3786d2";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(arrowX, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowX, 14);
    ctx.lineTo(arrowX - Math.sign(wind || 1) * 11, 8);
    ctx.lineTo(arrowX - Math.sign(wind || 1) * 11, 20);
    ctx.closePath();
    ctx.fillStyle = intensity > 0.58 ? "#e8703a" : "#3786d2";
    ctx.fill();
    ctx.restore();
  }

  drawGround(ctx, game) {
    ctx.fillStyle = "#5c8b48";
    ctx.fillRect(0, CONFIG.world.groundY, this.canvas.width, this.canvas.height - CONFIG.world.groundY);
    ctx.fillStyle = "#7c5b3d";
    ctx.fillRect(72, CONFIG.world.groundY - 24, 160, 24);
    ctx.fillRect(this.canvas.width - 232, CONFIG.world.groundY - 24, 160, 24);
    ctx.fillStyle = "#9a714d";
    for (let plank = 0; plank < 5; plank += 1) {
      ctx.fillRect(80 + plank * 30, CONFIG.world.groundY - 22, 23, 20);
      ctx.fillRect(this.canvas.width - 224 + plank * 30, CONFIG.world.groundY - 22, 23, 20);
    }
    ctx.strokeStyle = "rgba(54, 95, 44, 0.6)";
    ctx.lineWidth = 2;
    const time = game.state.elapsedTime;
    for (let x = 14; x < this.canvas.width; x += 30) {
      const sway = Math.sin(time * 3 + x * 0.08 + game.state.wind * 0.01) * 5;
      ctx.beginPath();
      ctx.moveTo(x, CONFIG.world.groundY + 10);
      ctx.lineTo(x + sway, CONFIG.world.groundY - 8);
      ctx.stroke();
    }
  }

  drawAimGuide(ctx, game) {
    if (game.state.phase !== "aiming" || !game.state.mode) return;
    const player = game.getCurrentPlayer();
    const shot = CONFIG.projectileTypes[player.weapon.shotType];
    const start = player.getLaunchPoint();
    const angle = player.aim.angle * Math.PI / 180;
    let x = start.x;
    let y = start.y;
    let vx = Math.cos(angle) * player.aim.power * shot.launchSpeedMultiplier * player.facing;
    let vy = -Math.sin(angle) * player.aim.power * shot.launchSpeedMultiplier;
    const dragging = Boolean(game.state.dragAim);
    ctx.save();
    for (let step = 0; step < (dragging ? 25 : 22); step += 1) {
      vx += game.state.wind * shot.windInfluenceMultiplier * 0.055;
      vy += CONFIG.world.gravity * shot.gravityMultiplier * 0.055;
      x += vx * 0.055;
      y += vy * 0.055;
      ctx.globalAlpha = Math.max(0.14, (dragging ? 0.88 : 0.7) - step * (dragging ? 0.026 : 0.03));
      ctx.fillStyle = step < (dragging ? 6 : 5) ? shot.ringColor : "rgba(255,255,255,0.34)";
      ctx.beginPath();
      ctx.arc(x, y, (dragging ? 4.8 : 4.4) - step * 0.14, 0, Math.PI * 2);
      ctx.fill();
      if (y >= CONFIG.world.groundY) break;
    }
    ctx.restore();
  }

  drawDragAim(ctx, game) {
    const drag = game.state.dragAim;
    if (!drag) {
      return;
    }

    const shot = CONFIG.projectileTypes[game.getCurrentPlayer().weapon.shotType];
    const accent = drag.canFire ? shot.ringColor : "rgba(255, 214, 170, 0.96)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(drag.anchorX, drag.anchorY);
    ctx.lineTo(drag.currentX, drag.currentY);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(drag.anchorX, drag.anchorY);
    ctx.lineTo(drag.currentX, drag.currentY);
    ctx.stroke();

    ctx.fillStyle = "rgba(20, 37, 57, 0.42)";
    ctx.beginPath();
    ctx.arc(drag.anchorX, drag.anchorY, 14, 0, Math.PI * 2);
    ctx.fill();

    this.drawWeaponShape(ctx, shot.shape, drag.anchorX, drag.anchorY, 0, 0.8, shot.coreColor, shot.ringColor);

    ctx.fillStyle = drag.canFire ? "rgba(19, 41, 63, 0.92)" : "rgba(86, 54, 35, 0.9)";
    ctx.beginPath();
    ctx.arc(drag.currentX, drag.currentY, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(drag.currentX, drag.currentY, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx, player, game, isCurrent) {
    const time = game.state.elapsedTime;
    const bob = Math.sin((time + player.id * 0.6 + player.render.idleTime) * 2.3) * CONFIG.player.idleBobAmount;
    const sway = Math.sin((time + player.id * 0.7) * 1.9) * 1.8;
    const hurtShift = player.render.flashTimer > 0 ? Math.sin(player.render.flashTimer * 52) * 3 : 0;
    const flash = player.render.flashTimer > 0 ? 0.26 : 0;
    const anticipation = player.weapon.anticipationTimer > 0 ? 1 - player.weapon.anticipationTimer / player.weapon.anticipationDuration : 0;
    const recoil = player.weapon.recoilTimer > 0 ? 1 - player.weapon.recoilTimer / player.weapon.recoilDuration : 0;
    const colors = player.render.colors;
    ctx.save();
    ctx.translate(player.transform.x + hurtShift, CONFIG.world.groundY + bob);
    ctx.scale(player.facing, 1);
    ctx.fillStyle = "rgba(24, 39, 58, 0.16)";
    ctx.beginPath();
    ctx.ellipse(0, -2, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isCurrent) {
      ctx.strokeStyle = "rgba(255, 250, 236, 0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -52, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    const bodyPull = easeOutCubic(anticipation) * CONFIG.player.anticipationLift;
    const bodyRecoil = Math.sin(recoil * Math.PI) * CONFIG.player.recoilAmount;
    ctx.translate(-bodyRecoil * 0.8, -bodyPull);
    ctx.rotate(sway * Math.PI / 180);
    ctx.fillStyle = colors.legs;
    ctx.fillRect(-12, -34, 8, 30);
    ctx.fillRect(5, -34, 8, 30);
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.ellipse(0, -42, 25, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(0, -35, 13, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(18, -48);
    ctx.quadraticCurveTo(34, -58, 31, player.species === "cat" ? -88 : -30);
    ctx.stroke();
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.arc(0, -79, 20, 0, Math.PI * 2);
    ctx.fill();
    if (player.species === "cat") {
      ctx.beginPath();
      ctx.moveTo(-12, -90);
      ctx.lineTo(-5, -110);
      ctx.lineTo(2, -88);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, -90);
      ctx.lineTo(5, -110);
      ctx.lineTo(-2, -88);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = colors.ear;
      ctx.beginPath();
      ctx.ellipse(-15, -80, 8, 15, -0.4, 0, Math.PI * 2);
      ctx.ellipse(15, -80, 8, 15, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash})`;
      ctx.beginPath();
      ctx.ellipse(0, -42, 25, 28, 0, 0, Math.PI * 2);
      ctx.arc(0, -79, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-7, -82, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -82, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17304d";
    ctx.beginPath();
    ctx.arc(-7, -82, 1.6, 0, Math.PI * 2);
    ctx.arc(7, -82, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.species === "cat" ? "#f28a8a" : "#4f392e";
    ctx.beginPath();
    ctx.arc(0, -74, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -70);
    ctx.quadraticCurveTo(0, -66, 4, -70);
    ctx.stroke();
    const angle = player.aim.angle * Math.PI / 180;
    const aimPull = easeOutCubic(anticipation);
    const targetX = 20 + Math.cos(angle) * (22 + aimPull * 8) - aimPull * 12;
    const targetY = -63 - Math.sin(angle) * 22 + aimPull * 2;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, -53);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawProjectile(ctx, projectile) {
    for (let index = 0; index < projectile.trail.length; index += 1) {
      const point = projectile.trail[index];
      const alpha = (index + 1) / projectile.trail.length;
      ctx.fillStyle = projectile.shot.trailColor.replace(/0\.\d+\)$/u, `${(alpha * 0.35).toFixed(2)})`);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.4 + alpha * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const { x, y, vx, vy } = projectile.transform;
    const angle = Math.atan2(vy, vx || 0.001);
    this.drawWeaponShape(ctx, projectile.shot.shape, x, y, angle, 1, projectile.shot.coreColor, projectile.shot.ringColor);
  }

  drawWeaponShape(ctx, shape, x, y, rotation, scale, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    if (shape === "ball") {
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape === "stick") {
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(-7, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "rock") {
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.lineTo(-4, -9);
      ctx.lineTo(6, -8);
      ctx.lineTo(10, -1);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 9);
      ctx.lineTo(-10, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === "rocket") {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(4, -4);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd98a";
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff7cf";
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawParticle(ctx, particle) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = `${particle.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(particle.transform.x, particle.transform.y, particle.radius * Math.max(0.2, alpha * particle.fadeScale), 0, Math.PI * 2);
    ctx.fill();
  }

  drawShockwave(ctx, wave) {
    const t = 1 - wave.life / wave.maxLife;
    ctx.strokeStyle = `${wave.color}${1 - t})`;
    ctx.lineWidth = lerp(6, 1, t);
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, lerp(wave.fromRadius, wave.toRadius, easeOutCubic(t)), 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFloatingText(ctx, text) {
    const alpha = Math.max(0, text.life / text.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = text.color;
    ctx.font = `bold ${text.size}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }

  drawCanvasHud(ctx, game) {
    if (!game.state.mode || game.state.scene === "menu") {
      return;
    }

    const player = game.getCurrentPlayer();
    const p1 = game.players[0];
    const p2 = game.players[1];
    const shot = CONFIG.projectileTypes[player.weapon.shotType];
    const ammoText = formatAmmoCount(player.getAmmo(player.weapon.shotType));
    const turnLabel = game.state.phase === "gameover"
      ? "Match Over"
      : game.state.phase === "projectile"
        ? "Shot In Flight"
        : game.state.phase === "turn-end"
          ? "Resolving"
          : player.name;

    this.drawInfoCard(ctx, 16, 14, 136, 44, p1.name, `${p1.health.current} HP`, null, "#f2965a", "rgba(255, 178, 103, 0.95)");
    this.drawInfoCard(ctx, 162, 14, 170, 44, "Shot", `${shot.label} ${ammoText}`, shot.shape, shot.coreColor, shot.ringColor);
    this.drawInfoCard(ctx, this.canvas.width - 332, 14, 170, 44, "Turn", turnLabel, null, "#2f75c0", "rgba(255, 241, 180, 0.95)");
    this.drawInfoCard(ctx, this.canvas.width - 152, 14, 136, 44, p2.name, `${p2.health.current} HP`, null, "#63a1db", "rgba(122, 182, 255, 0.95)");

    if (game.state.dragAim) {
      const drag = game.state.dragAim;
      this.drawDragReadout(ctx, drag, shot);
    } else {
      this.drawAimReadout(ctx, player, game.state.wind);
    }
  }

  drawInfoCard(ctx, x, y, width, height, label, value, shape, coreColor, accentColor) {
    ctx.save();
    ctx.fillStyle = "rgba(16, 31, 48, 0.72)";
    this.fillRoundedRect(ctx, x, y, width, height, 16);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    this.strokeRoundedRect(ctx, x, y, width, height, 16);

    if (shape) {
      this.drawWeaponShape(ctx, shape, x + 20, y + height / 2, 0, 0.78, coreColor, accentColor);
    }

    const textX = x + (shape ? 38 : 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
    ctx.font = "bold 10px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), textX, y + 15);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Trebuchet MS";
    ctx.fillText(value, textX, y + 32);

    ctx.fillStyle = accentColor;
    ctx.fillRect(x + 10, y + height - 5, width - 20, 2);
    ctx.restore();
  }

  drawAimReadout(ctx, player, wind) {
    const text = `${Math.round(player.aim.angle)} deg  |  ${Math.round(player.aim.power)} power  |  ${signLabel(wind)} ${Math.round(Math.abs(wind))}`;
    ctx.save();
    const width = 258;
    const x = (this.canvas.width - width) / 2;
    const y = this.canvas.height - 148;
    ctx.fillStyle = "rgba(16, 31, 48, 0.74)";
    this.fillRoundedRect(ctx, x, y, width, 38, 19);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "bold 15px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(text, x + width / 2, y + 24);
    ctx.restore();
  }

  drawDragReadout(ctx, drag, shot) {
    ctx.save();
    const width = 286;
    const x = (this.canvas.width - width) / 2;
    const y = this.canvas.height - 152;
    ctx.fillStyle = drag.canFire ? "rgba(16, 31, 48, 0.82)" : "rgba(80, 56, 35, 0.88)";
    this.fillRoundedRect(ctx, x, y, width, 44, 20);
    ctx.fillStyle = shot.ringColor;
    ctx.fillRect(x + 14, y + 34, (width - 28) * drag.normalized, 4);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Trebuchet MS";
    ctx.textAlign = "center";
    const verb = drag.canFire ? "Release to fire" : "Pull farther";
    ctx.fillText(`${verb}  |  ${Math.round(drag.angle)} deg  |  ${Math.round(drag.power)} power`, x + width / 2, y + 24);
    ctx.restore();
  }

  fillRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, radius);
    else ctx.rect(x, y, width, height);
    ctx.fill();
  }

  strokeRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, radius);
    else ctx.rect(x, y, width, height);
    ctx.stroke();
  }
}


