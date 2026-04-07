export const ATTACK_ORDER = ["normal", "light", "heavy", "super"];
export const WEAPON_BAR_ORDER = [...ATTACK_ORDER, "heal"];

export const signLabel = (value) => (value > 5 ? "->" : value < -5 ? "<-" : "calm");

export function cycleList(items, current, direction) {
  const index = items.indexOf(current);
  return items[(index + direction + items.length) % items.length];
}

export function formatAmmoCount(value) {
  return Number.isFinite(value) ? `${value}` : "INF";
}

export function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}
