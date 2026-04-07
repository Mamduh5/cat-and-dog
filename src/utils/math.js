export const DEG_TO_RAD = Math.PI / 180;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const randRange = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(randRange(min, max + 1));
export const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
