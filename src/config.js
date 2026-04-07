export const CONFIG = {
  canvas: { width: 960, height: 540 },
  world: {
    groundY: 455,
    gravity: 830,
    maxWind: 130,
    windJitter: 18,
    cloudSpeedNear: 18,
    cloudSpeedFar: 9
  },
  aim: {
    angleMin: 14,
    angleMax: 82,
    angleSpeed: 78,
    angleTap: 1.8,
    defaultAngle: 46,
    powerMin: 270,
    powerMax: 615,
    powerSpeed: 240,
    powerTap: 14,
    defaultPower: 398
  },
  turn: {
    readyPause: 0.82,
    impactPause: 0.92,
    endPause: 1.25
  },
  player: {
    maxHp: 110,
    headRadius: 17,
    bodyRadius: 24,
    handOffsetX: 34,
    handOffsetY: 63,
    idleBobAmount: 4,
    anticipationLift: 7,
    recoilAmount: 7
  },
  projectile: {
    maxStepPixels: 16,
    trailPoints: 18
  },
  particles: {
    maxLife: 0.85
  },
  projectileTypes: {
    normal: {
      label: "Normal",
      note: "Reliable all-rounder",
      speedScale: 1,
      gravityScale: 1,
      windScale: 1,
      radius: 7,
      damageMin: 10,
      damageMax: 31,
      splashRadius: 70,
      directBonus: 11,
      trailColor: "rgba(255, 245, 205, 0.35)",
      coreColor: "#f3b14c",
      ringColor: "rgba(255, 223, 143, 0.9)",
      windup: 0.17,
      recoil: 0.18,
      launchBurst: 7,
      explosionParticles: 22,
      explosionForce: 1,
      shake: 6
    },
    heavy: {
      label: "Heavy",
      note: "Big damage, sharper drop",
      speedScale: 0.94,
      gravityScale: 1.24,
      windScale: 0.88,
      radius: 8.5,
      damageMin: 13,
      damageMax: 39,
      splashRadius: 78,
      directBonus: 16,
      trailColor: "rgba(255, 220, 170, 0.4)",
      coreColor: "#d8783b",
      ringColor: "rgba(255, 186, 119, 0.92)",
      windup: 0.22,
      recoil: 0.24,
      launchBurst: 9,
      explosionParticles: 28,
      explosionForce: 1.26,
      shake: 8.5
    },
    light: {
      label: "Light",
      note: "Flatter arc, lower damage",
      speedScale: 1.08,
      gravityScale: 0.8,
      windScale: 1.08,
      radius: 5.8,
      damageMin: 7,
      damageMax: 22,
      splashRadius: 58,
      directBonus: 8,
      trailColor: "rgba(212, 245, 255, 0.42)",
      coreColor: "#7fd0eb",
      ringColor: "rgba(170, 235, 255, 0.9)",
      windup: 0.12,
      recoil: 0.14,
      launchBurst: 6,
      explosionParticles: 17,
      explosionForce: 0.78,
      shake: 4.5
    }
  },
  cpuProfiles: {
    easy: {
      label: "Easy",
      description: "Forgiving aim, slower throws, and wider misses.",
      angleStep: 3,
      powerStep: 18,
      topChoices: 12,
      choiceSpread: 7,
      angleJitter: 5.8,
      powerJitter: 36,
      delayMin: 1.1,
      delayMax: 1.7,
      scoreBias: 1.15
    },
    normal: {
      label: "Normal",
      description: "Solid reads with believable mistakes under pressure.",
      angleStep: 2,
      powerStep: 12,
      topChoices: 8,
      choiceSpread: 4,
      angleJitter: 3.2,
      powerJitter: 20,
      delayMin: 0.9,
      delayMax: 1.35,
      scoreBias: 1
    },
    hard: {
      label: "Hard",
      description: "Sharper decisions, faster releases, and tighter corrections.",
      angleStep: 1,
      powerStep: 8,
      topChoices: 4,
      choiceSpread: 2,
      angleJitter: 1.7,
      powerJitter: 10,
      delayMin: 0.55,
      delayMax: 0.92,
      scoreBias: 0.84
    }
  }
};
