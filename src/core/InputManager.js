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
  }

  attach() {
    window.addEventListener("keydown", (event) => {
      if (this.prevented.has(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.actions.push(event.code);
      }
      this.keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
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
