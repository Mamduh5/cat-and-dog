import { Game } from "../core/Game.js";
import { getDevicePreset } from "./devicePresets.js";
import { renderShell } from "./renderShell.js";

const preset = getDevicePreset(document.body.dataset.device);
document.title = `Backyard Ballistics - ${preset.label}`;
document.body.classList.add(preset.shellClass);

document.getElementById("app").innerHTML = renderShell(preset);
new Game(preset);
