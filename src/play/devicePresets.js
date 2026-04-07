export const DEVICE_PRESETS = {
  desktop: {
    id: "desktop",
    label: "Desktop",
    description: "Keyboard-first layout with sidebar info and full-size arena.",
    shellClass: "device-desktop",
    touch: false,
    controlsHint: "Keyboard controls enabled: arrows / WASD, Q/E, Space, R, M.",
    route: "/play/desktop/"
  },
  tablet: {
    id: "tablet",
    label: "Tablet",
    description: "Touch-friendly landscape shell with larger controls and broader HUD.",
    shellClass: "device-tablet",
    touch: true,
    controlsHint: "Touch controls enabled. Landscape tablet play is recommended.",
    route: "/play/tablet/"
  },
  mobile: {
    id: "mobile",
    label: "Mobile",
    description: "Compact phone shell with large touch controls and simplified side content.",
    shellClass: "device-mobile",
    touch: true,
    controlsHint: "Touch controls enabled. Mobile play works best in landscape.",
    route: "/play/mobile/"
  }
};

export function getDevicePreset(id) {
  return DEVICE_PRESETS[id] || DEVICE_PRESETS.desktop;
}
