/**
 * Death screen - appears when player HP reaches 0
 * Two options: Respawn here or Respawn at start
 */
export class DeathScreen {
  private container: HTMLDivElement;
  private onRespawnHere: (() => void) | null = null;
  private onRespawnStart: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'death-screen';
    this.container.innerHTML = `
      <style>
        #death-screen {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(10, 0, 0, 0.75);
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 50;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        #death-screen.show {
          display: flex;
        }
        .death-title {
          font-size: 48px;
          font-weight: bold;
          color: #ff2020;
          text-shadow: 0 0 20px rgba(255,0,0,0.5);
          margin-bottom: 40px;
          letter-spacing: 0.2em;
        }
        .death-buttons {
          display: flex;
          gap: 20px;
        }
        .death-btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: bold;
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          cursor: pointer;
          pointer-events: all;
          transition: all 0.2s;
          color: white;
          letter-spacing: 0.05em;
        }
        .death-btn:hover {
          transform: scale(1.05);
        }
        .death-btn.here {
          background: rgba(100, 50, 50, 0.8);
        }
        .death-btn.here:hover {
          background: rgba(140, 60, 60, 0.9);
          border-color: #ff4444;
        }
        .death-btn.start {
          background: rgba(50, 50, 100, 0.8);
        }
        .death-btn.start:hover {
          background: rgba(60, 60, 140, 0.9);
          border-color: #4488ff;
        }
        .death-penalty {
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          margin-top: 20px;
        }
      </style>
      <div class="death-title">OLDUN</div>
      <div class="death-buttons">
        <button class="death-btn here" id="death-respawn-here">Burada Yeniden Dog</button>
        <button class="death-btn start" id="death-respawn-start">Baslangicta Yeniden Dog</button>
      </div>
      <div class="death-penalty">XP kaybı: %5</div>
    `;
    document.body.appendChild(this.container);

    const respawnHereBtn = this.container.querySelector('#death-respawn-here') as HTMLButtonElement;
    const respawnStartBtn = this.container.querySelector('#death-respawn-start') as HTMLButtonElement;

    respawnHereBtn.addEventListener('click', () => {
      this.hide();
      if (this.onRespawnHere) this.onRespawnHere();
    });
    respawnStartBtn.addEventListener('click', () => {
      this.hide();
      if (this.onRespawnStart) this.onRespawnStart();
    });
  }

  public show(): void {
    this.container.classList.add('show');
  }

  public hide(): void {
    this.container.classList.remove('show');
  }

  public setOnRespawnHere(cb: () => void): void { this.onRespawnHere = cb; }
  public setOnRespawnStart(cb: () => void): void { this.onRespawnStart = cb; }

  public dispose(): void {
    this.container.remove();
  }
}
