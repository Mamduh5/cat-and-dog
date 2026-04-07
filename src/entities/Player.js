import { CONFIG } from "../config.js";
import { HealthComponent } from "../components/HealthComponent.js";
import { TransformComponent } from "../components/TransformComponent.js";
import { ATTACK_ORDER } from "../utils/helpers.js";
import { DEG_TO_RAD, clamp } from "../utils/math.js";

export class Player {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.species = options.species;
    this.facing = options.facing;
    this.transform = new TransformComponent(options.x, CONFIG.world.groundY);
    this.health = new HealthComponent(CONFIG.player.maxHp);
    this.aim = {
      angle: CONFIG.aim.defaultAngle,
      power: CONFIG.aim.defaultPower
    };
    this.render = {
      colors: options.colors,
      flashTimer: 0,
      idleTime: Math.random() * 100
    };
    this.weapon = {
      shotType: "normal",
      ammo: this.createAmmoState(),
      anticipationTimer: 0,
      anticipationDuration: 0.001,
      recoilTimer: 0,
      recoilDuration: 0.001
    };
  }

  createAmmoState() {
    return {
      normal: CONFIG.projectileTypes.normal.ammo,
      light: CONFIG.projectileTypes.light.ammo,
      heavy: CONFIG.projectileTypes.heavy.ammo,
      super: CONFIG.projectileTypes.super.ammo,
      heal: CONFIG.items.heal.ammo
    };
  }

  reset() {
    this.health.reset();
    this.aim.angle = CONFIG.aim.defaultAngle;
    this.aim.power = CONFIG.aim.defaultPower;
    this.weapon.shotType = "normal";
    this.weapon.ammo = this.createAmmoState();
    this.render.flashTimer = 0;
    this.weapon.anticipationTimer = 0;
    this.weapon.recoilTimer = 0;
  }

  update(dt) {
    this.render.idleTime += dt;
    this.render.flashTimer = Math.max(0, this.render.flashTimer - dt);
    this.weapon.anticipationTimer = Math.max(0, this.weapon.anticipationTimer - dt);
    this.weapon.recoilTimer = Math.max(0, this.weapon.recoilTimer - dt);
  }

  takeDamage(amount) {
    this.health.current = clamp(this.health.current - amount, 0, this.health.max);
    this.render.flashTimer = 0.34;
  }

  heal(amount) {
    const before = this.health.current;
    this.health.current = clamp(this.health.current + amount, 0, this.health.max);
    return this.health.current - before;
  }

  hasAmmo(key) {
    const amount = this.weapon.ammo[key];
    return !Number.isFinite(amount) || amount > 0;
  }

  getAmmo(key) {
    return this.weapon.ammo[key];
  }

  consumeAmmo(key) {
    const amount = this.weapon.ammo[key];
    if (Number.isFinite(amount) && amount > 0) {
      this.weapon.ammo[key] -= 1;
    }
  }

  ensureSelectableShot() {
    if (ATTACK_ORDER.includes(this.weapon.shotType) && this.hasAmmo(this.weapon.shotType)) {
      return this.weapon.shotType;
    }

    const next = ATTACK_ORDER.find((key) => this.hasAmmo(key)) || "normal";
    this.weapon.shotType = next;
    return next;
  }

  setAnticipation(duration) {
    this.weapon.anticipationDuration = Math.max(duration, 0.001);
    this.weapon.anticipationTimer = duration;
  }

  setRecoil(duration) {
    this.weapon.recoilDuration = Math.max(duration, 0.001);
    this.weapon.recoilTimer = duration;
  }

  getLaunchPoint() {
    const angle = this.aim.angle * DEG_TO_RAD;
    return {
      x: this.transform.x + this.facing * (CONFIG.player.handOffsetX + Math.cos(angle) * 10),
      y: CONFIG.world.groundY - CONFIG.player.handOffsetY - Math.sin(angle) * 8
    };
  }

  getHitCircles() {
    return [
      { x: this.transform.x, y: CONFIG.world.groundY - 73, radius: CONFIG.player.headRadius },
      { x: this.transform.x, y: CONFIG.world.groundY - 39, radius: CONFIG.player.bodyRadius }
    ];
  }

  getDamageAnchor() {
    return { x: this.transform.x, y: CONFIG.world.groundY - 46 };
  }
}
