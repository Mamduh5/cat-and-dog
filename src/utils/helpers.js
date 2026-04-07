export const SHOT_ORDER = ["normal", "heavy", "light"];

export const signLabel = (value) => (value > 5 ? "->" : value < -5 ? "<-" : "calm");

export function cycleList(items, current, direction) {
  const index = items.indexOf(current);
  return items[(index + direction + items.length) % items.length];
}

export function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}
