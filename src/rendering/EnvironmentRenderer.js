import { CONFIG } from "../config.js";

const path = (ctx, commands) => {
  ctx.beginPath();
  commands(ctx);
  ctx.closePath();
};

const roundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
};

export class EnvironmentRenderer {
  constructor(canvas) {
    this.canvas = canvas;
  }

  drawBackground(ctx, game) {
    const groundY = CONFIG.world.groundY;
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, "#93cbd9");
    sky.addColorStop(0.52, "#d9e8d2");
    sky.addColorStop(1, "#f3d6a3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.canvas.width, groundY);

    const glow = ctx.createRadialGradient(126, 108, 4, 126, 108, 88);
    glow.addColorStop(0, "rgba(255,244,190,0.96)");
    glow.addColorStop(0.34, "rgba(255,226,153,0.46)");
    glow.addColorStop(1, "rgba(255,226,153,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(30, 12, 192, 190);

    this.drawCloud(ctx, 74 + (game.state.cloudOffsetFar * 0.45) % 1120 - 150, 132, 1.05, 0.55);
    this.drawCloud(ctx, 354 + (game.state.cloudOffsetNear * 0.55) % 1080 - 180, 96, 0.76, 0.68);
    this.drawCloud(ctx, 752 + (game.state.cloudOffsetFar * 0.35) % 1160 - 190, 154, 1.08, 0.48);

    this.drawDistantNeighborhood(ctx);
    this.drawRearFence(ctx);
    this.drawRearVegetation(ctx, game.state.elapsedTime, game.state.wind);
  }

  drawCloud(ctx, x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(255, 250, 235, ${alpha})`;
    path(ctx, (shape) => {
      shape.moveTo(-15, 12);
      shape.bezierCurveTo(-22, -2, -7, -14, 7, -8);
      shape.bezierCurveTo(14, -30, 48, -24, 49, -2);
      shape.bezierCurveTo(72, -7, 85, 10, 73, 22);
      shape.bezierCurveTo(45, 27, 8, 25, -15, 12);
    });
    ctx.fill();
    ctx.strokeStyle = "rgba(109,139,137,0.13)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawDistantNeighborhood(ctx) {
    ctx.fillStyle = "#9eb68a";
    path(ctx, (shape) => {
      shape.moveTo(0, 330);
      shape.quadraticCurveTo(105, 264, 220, 326);
      shape.quadraticCurveTo(340, 254, 482, 324);
      shape.quadraticCurveTo(640, 250, 782, 323);
      shape.quadraticCurveTo(870, 278, 960, 314);
      shape.lineTo(960, 390);
      shape.lineTo(0, 390);
    });
    ctx.fill();

    const houses = [
      { x: 34, y: 279, w: 174, body: "#d6b98d", roof: "#826a58" },
      { x: 748, y: 282, w: 180, body: "#cda67e", roof: "#765f54" }
    ];
    for (const house of houses) {
      ctx.fillStyle = house.body;
      ctx.fillRect(house.x, house.y, house.w, 84);
      ctx.fillStyle = house.roof;
      path(ctx, (shape) => {
        shape.moveTo(house.x - 14, house.y + 3);
        shape.lineTo(house.x + house.w * 0.5, house.y - 48);
        shape.lineTo(house.x + house.w + 14, house.y + 3);
      });
      ctx.fill();
      ctx.fillStyle = "rgba(109,151,165,0.72)";
      ctx.fillRect(house.x + 30, house.y + 23, 34, 31);
      ctx.fillRect(house.x + house.w - 64, house.y + 23, 34, 31);
      ctx.strokeStyle = "rgba(88,70,58,0.32)";
      ctx.lineWidth = 3;
      ctx.strokeRect(house.x + 30, house.y + 23, 34, 31);
      ctx.strokeRect(house.x + house.w - 64, house.y + 23, 34, 31);
    }
  }

  drawRearFence(ctx) {
    ctx.fillStyle = "#cbb487";
    for (let x = -8; x < this.canvas.width + 20; x += 30) {
      path(ctx, (shape) => {
        shape.moveTo(x, 350);
        shape.lineTo(x + 10, 340 + ((x / 30) % 2) * 3);
        shape.lineTo(x + 20, 350);
        shape.lineTo(x + 18, 426);
        shape.lineTo(x + 1, 426);
      });
      ctx.fill();
      ctx.strokeStyle = "rgba(99,75,50,0.18)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.fillStyle = "#b79b70";
    ctx.fillRect(0, 373, this.canvas.width, 9);
    ctx.fillRect(0, 409, this.canvas.width, 9);
    ctx.fillStyle = "rgba(255,245,215,0.2)";
    ctx.fillRect(0, 373, this.canvas.width, 2);
  }

  drawRearVegetation(ctx, time, wind) {
    const clusters = [
      [20, 410, 1.15, "#547d50"], [102, 420, 0.9, "#618b55"], [258, 414, 1.03, "#4f7b4b"],
      [622, 415, 1.05, "#547c4f"], [786, 410, 1.1, "#4d754a"], [900, 420, 0.92, "#608654"]
    ];
    for (const [x, y, scale, color] of clusters) this.drawBush(ctx, x, y, scale, color);

    ctx.save();
    ctx.translate(282, 360);
    ctx.rotate(Math.sin(time * 0.65) * 0.006 + wind * 0.00002);
    ctx.strokeStyle = "#725840";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 62);
    ctx.quadraticCurveTo(-4, 12, 20, -50);
    ctx.stroke();
    ctx.strokeStyle = "#80664a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(13, -28);
    ctx.quadraticCurveTo(60, -50, 106, -37);
    ctx.stroke();
    for (const leaf of [[12, -56, 29], [45, -58, 26], [82, -45, 29], [105, -34, 20]]) {
      ctx.fillStyle = leaf[0] % 2 ? "#557c4b" : "#668a50";
      ctx.beginPath();
      ctx.ellipse(leaf[0], leaf[1], leaf[2], leaf[2] * 0.66, -0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBush(ctx, x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    path(ctx, (shape) => {
      shape.moveTo(-18, 12);
      shape.bezierCurveTo(-31, -3, -12, -23, 5, -14);
      shape.bezierCurveTo(14, -37, 45, -30, 46, -9);
      shape.bezierCurveTo(69, -17, 78, 12, 59, 24);
      shape.lineTo(-10, 25);
    });
    ctx.fill();
    ctx.fillStyle = "rgba(236,222,132,0.18)";
    ctx.beginPath();
    ctx.ellipse(19, -12, 25, 8, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawGround(ctx, game) {
    const groundY = CONFIG.world.groundY;
    const grass = ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
    grass.addColorStop(0, "#648d4c");
    grass.addColorStop(1, "#446d3e");
    ctx.fillStyle = grass;
    ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);

    ctx.fillStyle = "rgba(223,190,128,0.34)";
    path(ctx, (shape) => {
      shape.moveTo(40, groundY + 29);
      shape.quadraticCurveTo(190, groundY + 2, 350, groundY + 37);
      shape.quadraticCurveTo(190, groundY + 55, 40, groundY + 29);
    });
    ctx.fill();
    path(ctx, (shape) => {
      shape.moveTo(618, groundY + 35);
      shape.quadraticCurveTo(802, groundY + 2, 956, groundY + 28);
      shape.lineTo(960, groundY + 64);
      shape.quadraticCurveTo(775, groundY + 62, 618, groundY + 35);
    });
    ctx.fill();

    this.drawCatYardProps(ctx);
    this.drawDogYardProps(ctx);
    this.drawGrassTexture(ctx, game.state.elapsedTime, game.state.wind);
  }

  drawCatYardProps(ctx) {
    for (const [x, y, rx, ry] of [[58, 465, 27, 7], [95, 478, 23, 6], [126, 491, 18, 5]]) {
      ctx.fillStyle = "rgba(209,188,148,0.9)";
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, -0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#a86045";
    path(ctx, (shape) => {
      shape.moveTo(238, 426); shape.lineTo(278, 426); shape.lineTo(271, 459); shape.lineTo(245, 459);
    });
    ctx.fill();
    ctx.fillStyle = "#d18760";
    ctx.fillRect(235, 421, 46, 8);
    ctx.fillStyle = "#668652";
    for (const x of [246, 258, 270]) {
      ctx.beginPath(); ctx.ellipse(x, 412, 9, 18, (x - 258) * 0.025, 0, Math.PI * 2); ctx.fill();
    }
    for (const [x, color] of [[244, "#e6b8bd"], [258, "#f1d58b"], [271, "#c7b9dd"]]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, 403, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawDogYardProps(ctx) {
    ctx.fillStyle = "#9c6047";
    path(ctx, (shape) => {
      shape.moveTo(805, 438); shape.lineTo(805, 390); shape.lineTo(856, 354); shape.lineTo(910, 390); shape.lineTo(910, 438);
    });
    ctx.fill();
    ctx.fillStyle = "#714839";
    path(ctx, (shape) => {
      shape.moveTo(793, 390); shape.lineTo(856, 346); shape.lineTo(921, 390); shape.lineTo(909, 399); shape.lineTo(856, 364); shape.lineTo(805, 400);
    });
    ctx.fill();
    ctx.fillStyle = "#493a31";
    ctx.beginPath(); ctx.arc(858, 418, 20, Math.PI, 0); ctx.lineTo(878, 438); ctx.lineTo(838, 438); ctx.fill();
    ctx.fillStyle = "#d3ad61";
    ctx.beginPath(); ctx.ellipse(740, 476, 20, 7, 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b46450";
    ctx.beginPath(); ctx.arc(719, 468, 8, 0, Math.PI * 2); ctx.arc(761, 482, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#718287";
    path(ctx, (shape) => {
      shape.moveTo(925, 423); shape.lineTo(953, 423); shape.lineTo(948, 457); shape.lineTo(930, 457);
    });
    ctx.fill();
    ctx.strokeStyle = "#59686b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(939, 423, 13, Math.PI, 0); ctx.stroke();
  }

  drawGrassTexture(ctx, time, wind) {
    ctx.lineCap = "round";
    for (let x = 8; x < this.canvas.width; x += 18) {
      const row = (x / 18) % 3;
      const y = CONFIG.world.groundY + 10 + row * 21;
      const sway = Math.sin(time * 2.2 + x * 0.07) * 2 + wind * 0.006;
      ctx.strokeStyle = row === 1 ? "rgba(43,92,48,0.48)" : "rgba(224,208,126,0.26)";
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.quadraticCurveTo(x + sway, y, x + sway + 2, y - 7); ctx.stroke();
    }
  }

  drawWall(ctx, wall) {
    if (!wall || wall.destroyed) return;
    const left = wall.x - wall.width / 2;
    const top = CONFIG.world.groundY - wall.height;
    const hpRatio = Math.max(0, wall.hp / wall.maxHp);
    ctx.save();
    ctx.fillStyle = "rgba(45,36,30,0.2)";
    ctx.beginPath(); ctx.ellipse(wall.x, CONFIG.world.groundY + 3, wall.width * 0.8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#9f7954";
    roundedRect(ctx, left, top, wall.width, wall.height, 8); ctx.fill();
    ctx.strokeStyle = "#624a37"; ctx.lineWidth = 3; ctx.stroke();
    for (let row = 0; row < 6; row += 1) {
      const y = top + row * 23;
      ctx.fillStyle = row % 2 ? "#b08860" : "#a77f59";
      ctx.fillRect(left + 3, y + 2, wall.width - 6, 18);
      ctx.strokeStyle = "rgba(82,58,42,0.38)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(left + 4, y + 21); ctx.lineTo(left + wall.width - 4, y + 21); ctx.stroke();
      const seam = left + (row % 2 ? 18 : 37);
      ctx.beginPath(); ctx.moveTo(seam, y + 2); ctx.lineTo(seam, y + 20); ctx.stroke();
    }
    ctx.fillStyle = "#d6bd86";
    path(ctx, (shape) => { shape.moveTo(left - 4, top + 2); shape.lineTo(wall.x, top - 12); shape.lineTo(left + wall.width + 4, top + 2); shape.lineTo(left + wall.width, top + 10); shape.lineTo(left, top + 10); });
    ctx.fill();
    ctx.strokeStyle = "#6b5038"; ctx.lineWidth = 2; ctx.stroke();
    if (wall.flashTimer > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.3)"; roundedRect(ctx, left, top, wall.width, wall.height, 8); ctx.fill();
    }
    const damage = 1 - hpRatio;
    if (damage > 0.08) {
      ctx.strokeStyle = "rgba(65,44,31,0.82)"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(wall.x - 3, top + 8); ctx.lineTo(wall.x + 5, top + 31 + damage * 7); ctx.lineTo(wall.x - 9, top + 58 + damage * 11); ctx.lineTo(wall.x + 6, top + 84 + damage * 17); ctx.stroke();
    }
    ctx.fillStyle = "rgba(38,48,45,0.76)"; roundedRect(ctx, wall.x - 32, top - 25, 64, 8, 4); ctx.fill();
    ctx.fillStyle = "#e1a45d"; roundedRect(ctx, wall.x - 32, top - 25, 64 * hpRatio, 8, 4); ctx.fill();
    ctx.restore();
  }
}
