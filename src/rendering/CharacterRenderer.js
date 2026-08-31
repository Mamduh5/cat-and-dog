import { CONFIG } from "../config.js";
import { easeOutCubic } from "../utils/math.js";

const shape = (ctx, build) => {
  ctx.beginPath();
  build(ctx);
  ctx.closePath();
};

const fillStroke = (ctx, fill, stroke = "#57453a", width = 2.4) => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
};

export class CharacterRenderer {
  draw(ctx, player, game, isCurrent) {
    const time = game.state.elapsedTime;
    const defeat = player.render.defeatProgress;
    const personalityRate = player.species === "cat" ? 2.5 : 1.75;
    const idle = Math.sin((time + player.render.idleTime + player.id * 0.4) * personalityRate);
    const bob = idle * (player.species === "cat" ? 2.2 : 1.25) * (1 - defeat * 0.75);
    const hurtShift = player.render.flashTimer > 0 ? Math.sin(player.render.flashTimer * 52) * 3 : 0;
    const anticipation = player.weapon.anticipationTimer > 0 ? 1 - player.weapon.anticipationTimer / player.weapon.anticipationDuration : 0;
    const recoil = player.weapon.recoilTimer > 0 ? 1 - player.weapon.recoilTimer / player.weapon.recoilDuration : 0;
    const brace = easeOutCubic(anticipation) * (1 - defeat);
    const recoilWave = Math.sin(recoil * Math.PI) * (1 - defeat);
    const bodyRecoil = recoilWave * CONFIG.player.recoilAmount * (player.species === "dog" ? 1.35 : 0.72);
    const tilt = defeat * CONFIG.player.defeatTilt;

    ctx.save();
    ctx.globalAlpha = 1 - defeat * CONFIG.player.defeatFade;
    ctx.translate(player.transform.x + hurtShift, CONFIG.world.groundY + bob + defeat * CONFIG.player.defeatDrop);
    ctx.scale(player.facing, Math.max(0.74, 1 - defeat * 0.22));
    this.drawShadow(ctx, player.species, defeat);
    if (isCurrent && defeat < 0.08) this.drawTurnHalo(ctx, player.species, time);
    ctx.translate(-bodyRecoil, brace * (player.species === "cat" ? 3 : 1.5) + defeat * 5);
    ctx.rotate((idle * (player.species === "cat" ? 0.012 : 0.006)) - tilt);
    if (player.species === "cat") this.drawCat(ctx, player, time, idle, brace, recoilWave, defeat);
    else this.drawCorgi(ctx, player, time, idle, brace, recoilWave, defeat);
    if (player.render.flashTimer > 0) this.drawDamageFlash(ctx, player.species);
    ctx.restore();
  }

  drawShadow(ctx, species, defeat) {
    ctx.fillStyle = "rgba(39,45,34,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 1 + defeat * 2, species === "cat" ? 44 : 49, Math.max(4, 9 - defeat * 3), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTurnHalo(ctx, species, time) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,244,194,0.84)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -time * 10;
    ctx.beginPath();
    ctx.ellipse(0, -49, species === "cat" ? 53 : 58, species === "cat" ? 49 : 45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawCat(ctx, player, time, idle, brace, recoil, defeat) {
    const outline = "#57473e";
    const cream = "#e7d5b3";
    const light = "#f4e7cb";
    const seal = "#665248";
    const earTwitch = Math.sin(time * 3.4 + player.id) * 0.035 * (1 - defeat);
    const tailLift = brace * 7 - recoil * 5;

    ctx.strokeStyle = outline;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-27, -39);
    ctx.bezierCurveTo(-55, -52 - tailLift, -66, -24 - tailLift, -54, -10);
    ctx.bezierCurveTo(-45, 0, -39, -12, -43, -20);
    ctx.stroke();
    ctx.strokeStyle = seal;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-55, -13 - tailLift * 0.3); ctx.quadraticCurveTo(-63, -24, -57, -34); ctx.stroke();

    this.drawCatLeg(ctx, -23, -28, -23 - brace * 2, -2, cream, seal, outline);
    this.drawCatLeg(ctx, 18, -28, 21 + brace * 3, -2, cream, seal, outline);

    const bodyGradient = ctx.createLinearGradient(0, -63, 0, -15);
    bodyGradient.addColorStop(0, light);
    bodyGradient.addColorStop(0.62, cream);
    bodyGradient.addColorStop(1, "#c7af8d");
    shape(ctx, (p) => {
      p.moveTo(-31, -39); p.bezierCurveTo(-22, -67, 10, -69, 31, -47);
      p.bezierCurveTo(38, -34, 28, -20, 6, -18); p.bezierCurveTo(-18, -16, -36, -23, -31, -39);
    });
    fillStroke(ctx, bodyGradient, outline, 2.8);
    ctx.strokeStyle = "rgba(112,83,63,0.2)"; ctx.lineWidth = 1.4;
    for (let y = -49; y < -25; y += 8) { ctx.beginPath(); ctx.moveTo(-17, y); ctx.quadraticCurveTo(2, y - 5, 20, y + 1); ctx.stroke(); }

    ctx.save();
    ctx.translate(25 - brace * 2 + recoil * 2, -55 + brace * 2);
    ctx.rotate(-0.08 - brace * 0.08 + defeat * 0.24);
    shape(ctx, (p) => { p.moveTo(-14, 5); p.quadraticCurveTo(-9, -9, 0, -13); p.quadraticCurveTo(9, -7, 14, 7); p.lineTo(7, 16); p.lineTo(-7, 16); });
    fillStroke(ctx, cream, outline, 2.5);
    ctx.restore();

    const headX = 34 - brace * 3 + recoil * 2;
    const headY = -70 + brace * 2;
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(-brace * 0.05 + defeat * 0.18);
    shape(ctx, (p) => { p.moveTo(-18, -10); p.quadraticCurveTo(-11, -25, 5, -24); p.quadraticCurveTo(22, -20, 22, -3); p.quadraticCurveTo(20, 14, 2, 19); p.quadraticCurveTo(-16, 14, -18, -10); });
    fillStroke(ctx, cream, outline, 2.8);
    ctx.save(); ctx.rotate(earTwitch);
    shape(ctx, (p) => { p.moveTo(-13, -15); p.lineTo(-10, -37); p.lineTo(1, -19); }); fillStroke(ctx, seal, outline, 2.4);
    ctx.fillStyle = "#c99691"; shape(ctx, (p) => { p.moveTo(-10, -21); p.lineTo(-9, -31); p.lineTo(-3, -21); }); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(-earTwitch * 0.7);
    shape(ctx, (p) => { p.moveTo(8, -20); p.lineTo(17, -38); p.lineTo(19, -13); }); fillStroke(ctx, seal, outline, 2.4);
    ctx.fillStyle = "#c99691"; shape(ctx, (p) => { p.moveTo(12, -21); p.lineTo(16, -31); p.lineTo(16, -18); }); ctx.fill(); ctx.restore();
    ctx.fillStyle = seal; ctx.beginPath(); ctx.ellipse(4, -4, 16, 15, -0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#bba592"; ctx.beginPath(); ctx.ellipse(14, 5, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    this.drawCatFace(ctx, defeat);
    ctx.restore();

    this.drawCatLauncher(ctx, player.aim.angle, brace, recoil, defeat);
  }

  drawCatLeg(ctx, hipX, hipY, pawX, pawY, cream, seal, outline) {
    shape(ctx, (p) => { p.moveTo(hipX - 5, hipY); p.quadraticCurveTo(hipX - 4, -12, pawX - 5, pawY - 5); p.quadraticCurveTo(pawX - 7, 1, pawX + 7, 1); p.quadraticCurveTo(pawX + 8, -5, pawX + 4, -9); p.lineTo(hipX + 6, hipY); });
    fillStroke(ctx, cream, outline, 2.4);
    ctx.fillStyle = seal; ctx.beginPath(); ctx.ellipse(pawX + 1, -4, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawCatFace(ctx, defeat) {
    if (defeat > 0.2) {
      ctx.strokeStyle = "#403a37"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(-1, -3); ctx.moveTo(9, -5); ctx.lineTo(15, -9); ctx.stroke();
    } else {
      ctx.fillStyle = "#d7eff2"; ctx.beginPath(); ctx.ellipse(-4, -7, 4.2, 2.6, -0.2, 0, Math.PI * 2); ctx.ellipse(10, -8, 4.2, 2.6, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#315d6d"; ctx.beginPath(); ctx.ellipse(-3, -7, 1.1, 2.4, 0, 0, Math.PI * 2); ctx.ellipse(11, -8, 1.1, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#8e6462"; shape(ctx, (p) => { p.moveTo(4, 0); p.lineTo(8, 2); p.lineTo(4, 5); }); ctx.fill();
    ctx.strokeStyle = "#4e403b"; ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(5 + side * 4, 5); ctx.lineTo(5 + side * 18, 4); ctx.moveTo(5 + side * 4, 7); ctx.lineTo(5 + side * 17, 10); ctx.stroke(); }
  }

  drawCatLauncher(ctx, degrees, brace, recoil, defeat) {
    const angle = -degrees * Math.PI / 180;
    const pivotX = 44 - brace * 3 + recoil * 2;
    const pivotY = -65 + brace * 2;
    ctx.save(); ctx.translate(pivotX, pivotY); ctx.rotate(angle * (1 - defeat) + defeat * 0.6);
    ctx.strokeStyle = "#4f3a2c"; ctx.lineCap = "round";
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(13, 0); ctx.stroke();
    ctx.strokeStyle = "#c69a55"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(31 + brace * 4 - recoil * 4, 0); ctx.stroke();
    ctx.strokeStyle = "#755034"; ctx.lineWidth = 2; for (const x of [7, 13, 19]) { ctx.beginPath(); ctx.moveTo(x, -4); ctx.lineTo(x + 1, 4); ctx.stroke(); }
    ctx.fillStyle = "#6b8790"; ctx.fillRect(-6, -5, 9, 10);
    ctx.strokeStyle = "#a56e43"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, -7); ctx.lineTo(31, 0); ctx.lineTo(24, 7); ctx.stroke();
    ctx.fillStyle = "#4b4b45"; ctx.beginPath(); ctx.arc(31 + brace * 4 - recoil * 4, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawCorgi(ctx, player, time, idle, brace, recoil, defeat) {
    const outline = "#544139";
    const rust = "#b9663f";
    const orange = "#d38350";
    const cream = "#f1dfbd";
    const stance = brace * 4 + recoil * 2;

    ctx.strokeStyle = outline; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-37, -34); ctx.quadraticCurveTo(-50 - idle * 2, -41, -46, -23); ctx.stroke();
    this.drawCorgiLeg(ctx, -28 - stance * 0.4, orange, cream, outline);
    this.drawCorgiLeg(ctx, 25 + stance, orange, cream, outline);

    const bodyGradient = ctx.createLinearGradient(0, -66, 0, -12);
    bodyGradient.addColorStop(0, "#e09a61"); bodyGradient.addColorStop(0.56, orange); bodyGradient.addColorStop(1, rust);
    shape(ctx, (p) => { p.moveTo(-38, -44); p.quadraticCurveTo(-29, -68, 12, -64); p.quadraticCurveTo(42, -63, 47, -39); p.quadraticCurveTo(48, -15, 18, -13); p.lineTo(-22, -15); p.quadraticCurveTo(-47, -21, -38, -44); });
    fillStroke(ctx, bodyGradient, outline, 3);
    ctx.fillStyle = cream;
    shape(ctx, (p) => { p.moveTo(18, -57); p.quadraticCurveTo(44, -57, 45, -37); p.quadraticCurveTo(42, -18, 21, -15); p.quadraticCurveTo(27, -34, 18, -57); }); ctx.fill();
    ctx.strokeStyle = "rgba(107,63,43,0.2)"; ctx.lineWidth = 1.5;
    for (let x = -24; x < 16; x += 12) { ctx.beginPath(); ctx.moveTo(x, -50); ctx.quadraticCurveTo(x + 6, -45, x + 12, -48); ctx.stroke(); }

    ctx.save(); ctx.translate(38 - brace + recoil * 2, -61 + brace); ctx.rotate(-brace * 0.035 + defeat * 0.2);
    shape(ctx, (p) => { p.moveTo(-17, -7); p.quadraticCurveTo(-11, -25, 7, -26); p.quadraticCurveTo(27, -24, 28, -5); p.quadraticCurveTo(29, 14, 8, 19); p.quadraticCurveTo(-16, 16, -17, -7); }); fillStroke(ctx, orange, outline, 2.8);
    shape(ctx, (p) => { p.moveTo(-11, -16); p.lineTo(-7, -39); p.lineTo(5, -21); }); fillStroke(ctx, rust, outline, 2.5);
    ctx.fillStyle = "#c98d86"; shape(ctx, (p) => { p.moveTo(-7, -22); p.lineTo(-6, -33); p.lineTo(0, -22); }); ctx.fill();
    shape(ctx, (p) => { p.moveTo(9, -22); p.lineTo(20, -39); p.lineTo(22, -13); }); fillStroke(ctx, rust, outline, 2.5);
    ctx.fillStyle = "#c98d86"; shape(ctx, (p) => { p.moveTo(14, -22); p.lineTo(19, -33); p.lineTo(19, -18); }); ctx.fill();
    ctx.fillStyle = cream; shape(ctx, (p) => { p.moveTo(-4, -14); p.quadraticCurveTo(9, -22, 18, -10); p.lineTo(17, 8); p.quadraticCurveTo(3, 19, -8, 8); }); ctx.fill();
    ctx.fillStyle = "#f5e8cf"; ctx.beginPath(); ctx.ellipse(20, 6, 15, 10, -0.04, 0, Math.PI * 2); ctx.fill();
    this.drawCorgiFace(ctx, defeat);
    ctx.restore();
    this.drawDogHarness(ctx, brace);
    this.drawDogLauncher(ctx, player.aim.angle, brace, recoil, defeat);
  }

  drawCorgiLeg(ctx, x, orange, cream, outline) {
    shape(ctx, (p) => { p.moveTo(x - 8, -28); p.lineTo(x - 7, -4); p.quadraticCurveTo(x - 10, 1, x + 8, 1); p.quadraticCurveTo(x + 11, -4, x + 7, -8); p.lineTo(x + 8, -28); });
    fillStroke(ctx, orange, outline, 2.5);
    ctx.fillStyle = cream; ctx.beginPath(); ctx.ellipse(x + 1, -4, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 1, -5); ctx.lineTo(x + 1, 0); ctx.stroke();
  }

  drawCorgiFace(ctx, defeat) {
    if (defeat > 0.2) {
      ctx.strokeStyle = "#463934"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(3, -4); ctx.moveTo(11, -4); ctx.lineTo(18, -8); ctx.stroke();
    } else {
      ctx.fillStyle = "#f6ead5"; ctx.beginPath(); ctx.arc(0, -8, 4.5, 0, Math.PI * 2); ctx.arc(14, -8, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#624633"; ctx.beginPath(); ctx.arc(1, -8, 2, 0, Math.PI * 2); ctx.arc(15, -8, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#463832"; ctx.beginPath(); ctx.ellipse(29, 2, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#624839"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(27, 8); ctx.quadraticCurveTo(21, 13, 15, 9); ctx.stroke();
  }

  drawDogHarness(ctx, brace) {
    ctx.strokeStyle = "#755440"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-8, -60 + brace); ctx.quadraticCurveTo(-2, -32, 3, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-29, -34); ctx.lineTo(33, -31); ctx.stroke();
    ctx.fillStyle = "#b98b61"; ctx.fillRect(-13, -66 + brace, 28, 8);
    ctx.fillStyle = "#d6b476"; ctx.beginPath(); ctx.arc(2, -31, 4, 0, Math.PI * 2); ctx.fill();
  }

  drawDogLauncher(ctx, degrees, brace, recoil, defeat) {
    const angle = -degrees * Math.PI / 180;
    ctx.save(); ctx.translate(-2 - recoil * 2, -66 + brace * 2); ctx.rotate(angle * (1 - defeat) + defeat * 0.5);
    ctx.strokeStyle = "#604838"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-9, 11); ctx.lineTo(2, 0); ctx.lineTo(11, 12); ctx.stroke();
    ctx.fillStyle = "#9f593d"; ctx.strokeStyle = "#513f36"; ctx.lineWidth = 2.5;
    shape(ctx, (p) => { p.moveTo(-13, -8); p.lineTo(13, -8); p.lineTo(17, 8); p.lineTo(-14, 8); }); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#bd7450"; ctx.fillRect(-8, -5, 17, 5);
    ctx.strokeStyle = "#7b5b3e"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(40 + brace * 5 - recoil * 6, -1); ctx.stroke();
    ctx.strokeStyle = "#aa8060"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(39 + brace * 5 - recoil * 6, -2); ctx.stroke();
    ctx.fillStyle = "#a9654b"; ctx.fillRect(17, -8, 13, 13);
    ctx.fillStyle = "#6d716c"; ctx.fillRect(29, -6, 8, 9);
    ctx.strokeStyle = "#b87945"; ctx.lineWidth = 2.5; for (const x of [0, 7]) { ctx.beginPath(); ctx.arc(x - 7, 0, 2.4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = "#bd8a55"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, 11); for (let x = -7; x <= 10; x += 4) ctx.lineTo(x, 11 + Math.sin(x) * 2); ctx.stroke();
    ctx.fillStyle = "#5a5952"; ctx.beginPath(); ctx.arc(41 + brace * 5 - recoil * 6, -1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawDamageFlash(ctx, species) {
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = "rgba(255,244,223,0.25)";
    ctx.beginPath(); ctx.ellipse(0, species === "cat" ? -39 : -38, species === "cat" ? 39 : 48, 31, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
