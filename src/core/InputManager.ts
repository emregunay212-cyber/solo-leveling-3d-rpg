export class InputManager {
  private keys = new Map<string, boolean>();
  private mouseButtons = new Map<number, boolean>();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private mouseX = 0;
  private mouseY = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupKeyboard();
    this.setupMouse();
    this.setupContextMenu();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });

    // When the window loses focus, clear ALL pressed keys
    // This prevents "stuck keys" when user alt-tabs or clicks outside
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseButtons.clear();
    });

    // Also clear on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.keys.clear();
        this.mouseButtons.clear();
      }
    });
  }

  private setupMouse(): void {
    // Use pointerdown/up instead of mousedown/up - more reliable with Babylon.js
    this.canvas.addEventListener('pointerdown', (e) => {
      this.mouseButtons.set(e.button, true);
    });

    window.addEventListener('pointerup', (e) => {
      this.mouseButtons.set(e.button, false);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  private setupContextMenu(): void {
    // Block context menu at every level with capture phase
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    this.canvas.addEventListener('contextmenu', block, true);
    document.addEventListener('contextmenu', block, true);
    window.addEventListener('contextmenu', block, true);
  }

  public isKeyDown(code: string): boolean {
    return this.keys.get(code) ?? false;
  }

  public isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.get(button) ?? false;
  }

  public getMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  public getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) z += 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) z -= 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;

    const len = Math.sqrt(x * x + z * z);
    if (len > 0) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  public isSprinting(): boolean {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  public isAttacking(): boolean {
    return this.isKeyDown('Space');
  }
}
