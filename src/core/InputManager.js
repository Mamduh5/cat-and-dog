export class InputManager {
  constructor() {
    this.keys = new Set();
    this.actions = [];
    this.prevented = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Space",
      "Enter",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
      "KeyQ",
      "KeyE",
      "Digit1",
      "Digit2",
      "Digit3",
      "KeyR",
      "KeyM"
    ]);
    this.pointerHolds = new Map();
  }

  attach() {
    window.addEventListener("keydown", (event) => {
      if (this.prevented.has(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.queueAction(event.code);
      }
      this.keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.pointerHolds.clear();
    });
  }

  bindTouchControls(elements) {
    elements.forEach((element) => {
      const code = element.dataset.inputCode;
      const mode = element.dataset.inputMode || "tap";
      if (!code) {
        return;
      }

      const release = (pointerId) => {
        if (this.pointerHolds.get(pointerId) === code) {
          this.pointerHolds.delete(pointerId);
          this.keys.delete(code);
        }
      };

      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (mode === "hold") {
          this.pointerHolds.set(event.pointerId, code);
          this.keys.add(code);
        }
        this.queueAction(code);
      });

      element.addEventListener("pointerup", (event) => {
        event.preventDefault();
        release(event.pointerId);
      });

      element.addEventListener("pointercancel", (event) => {
        release(event.pointerId);
      });

      element.addEventListener("pointerleave", (event) => {
        if (mode === "hold") {
          release(event.pointerId);
        }
      });
    });
  }

  queueAction(code) {
    this.actions.push(code);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumeActions() {
    const current = [...this.actions];
    this.actions.length = 0;
    return current;
  }
}
