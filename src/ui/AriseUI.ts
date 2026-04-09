/**
 * Sprint 9 — Arise UI
 * Ceset yakininda E-prompt, basili tutma progress bar, ARISE yazisi.
 */

export class AriseUI {
  private promptEl: HTMLDivElement;
  private progressContainer: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private ariseLabel: HTMLDivElement;
  private labelTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // E — Arise prompt
    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText = `
      position: fixed;
      top: 60%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: rgba(200, 150, 255, 0.9);
      text-shadow: 0 0 10px #7B2FBE;
      background: rgba(20, 5, 35, 0.7);
      border: 1px solid rgba(120, 60, 200, 0.5);
      border-radius: 6px;
      padding: 6px 14px;
      pointer-events: none;
      z-index: 250;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    this.promptEl.textContent = '[E] — Arise';
    document.body.appendChild(this.promptEl);

    // Progress bar konteyner
    this.progressContainer = document.createElement('div');
    this.progressContainer.style.cssText = `
      position: fixed;
      top: 62.5%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 160px;
      pointer-events: none;
      z-index: 251;
      opacity: 0;
      transition: opacity 0.15s;
    `;

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 100%; height: 5px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      overflow: hidden;
    `;
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #4A0E78, #C084FC);
      border-radius: 3px;
      transition: width 0.05s linear;
    `;
    barBg.appendChild(this.progressFill);
    this.progressContainer.appendChild(barBg);
    document.body.appendChild(this.progressContainer);

    // ARISE buyuk yazi
    this.ariseLabel = document.createElement('div');
    this.ariseLabel.textContent = 'ARISE';
    this.ariseLabel.style.cssText = `
      position: fixed;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) scale(1);
      font-family: 'Segoe UI', sans-serif;
      font-size: 56px;
      font-weight: 900;
      color: #C084FC;
      text-shadow: 0 0 30px #7B2FBE, 0 0 60px #4A0E78, 0 0 80px #2D0A50;
      letter-spacing: 8px;
      text-transform: uppercase;
      pointer-events: none;
      z-index: 400;
      opacity: 0;
    `;

    if (!document.getElementById('arise-style')) {
      const style = document.createElement('style');
      style.id = 'arise-style';
      style.textContent = `
        @keyframes ariseAnim {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(2.0); filter: blur(8px); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.0); filter: blur(0); }
          70%  { opacity: 1; transform: translate(-50%, -55%) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -65%) scale(0.95); }
        }
        @keyframes ariseAnimBoss {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(3.0); filter: blur(12px); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); filter: blur(0); }
          50%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          80%  { opacity: 1; transform: translate(-50%, -55%) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -65%) scale(0.95); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(this.ariseLabel);
  }

  /** Ceset yakinda — prompt'u goster */
  public showPrompt(isBoss = false): void {
    this.promptEl.textContent = isBoss ? '[E - Basili Tut] ARISE' : '[E] — Arise';
    this.promptEl.style.opacity = '1';
  }

  /** Ceset uzak — prompt'u gizle */
  public hidePrompt(): void {
    this.promptEl.style.opacity = '0';
    this.progressContainer.style.opacity = '0';
    this.progressFill.style.width = '0%';
  }

  /** E basili tutulurken progress guncelle (0-1) */
  public updateProgress(t: number): void {
    this.progressContainer.style.opacity = '1';
    this.progressFill.style.width = `${Math.min(100, t * 100)}%`;
  }

  /** ARISE yazisini goster */
  public showAriseLabel(isBoss = false): void {
    if (this.labelTimeout) clearTimeout(this.labelTimeout);
    const duration = isBoss ? 2.0 : 1.2;
    const animation = isBoss ? 'ariseAnimBoss' : 'ariseAnim';
    this.ariseLabel.style.fontSize = isBoss ? '72px' : '56px';
    this.ariseLabel.style.animation = 'none';
    this.ariseLabel.style.opacity = '0';
    // Reflow tetikle
    void this.ariseLabel.offsetHeight;
    this.ariseLabel.style.animation = `${animation} ${duration}s ease-out forwards`;
    this.labelTimeout = setTimeout(() => {
      this.ariseLabel.style.animation = 'none';
      this.ariseLabel.style.opacity = '0';
    }, duration * 1000 + 50);
  }

  /** Basarisiz mesaj */
  public showFailMessage(): void {
    const msg = document.createElement('div');
    msg.textContent = 'Ruh direniyor...';
    msg.style.cssText = `
      position: fixed;
      top: 55%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Segoe UI', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #888;
      text-shadow: 0 0 8px #444;
      pointer-events: none;
      z-index: 300;
      opacity: 1;
      transition: opacity 0.5s;
    `;
    document.body.appendChild(msg);
    setTimeout(() => {
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 550);
    }, 1200);
  }

  public dispose(): void {
    if (this.labelTimeout) clearTimeout(this.labelTimeout);
    this.promptEl.remove();
    this.progressContainer.remove();
    this.ariseLabel.remove();
  }
}
