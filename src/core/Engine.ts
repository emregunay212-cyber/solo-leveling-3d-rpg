import { Engine as BabylonEngine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';

export class Engine {
  public babylonEngine: BabylonEngine;
  public scene: Scene;
  public sunLight!: DirectionalLight;
  public ambientLight!: HemisphericLight;

  private canvas: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }

    this.babylonEngine = new BabylonEngine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    this.scene = new Scene(this.babylonEngine);
    this.scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);
    this.scene.ambientColor = new Color3(0.1, 0.1, 0.15);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.002;
    this.scene.fogColor = new Color3(0.05, 0.05, 0.1);

    this.setupLights();
    this.setupResize();
  }

  public async initPhysics(): Promise<void> {
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
    console.log('Havok physics engine initialized');
  }

  private setupLights(): void {
    this.ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    this.ambientLight.intensity = 0.5;
    this.ambientLight.diffuse = new Color3(0.8, 0.8, 0.9);
    this.ambientLight.groundColor = new Color3(0.2, 0.2, 0.3);

    this.sunLight = new DirectionalLight(
      'sunLight',
      new Vector3(-1, -2, -1).normalize(),
      this.scene
    );
    this.sunLight.intensity = 0.8;
    this.sunLight.diffuse = new Color3(1, 0.95, 0.85);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.babylonEngine.resize();
    });
  }

  public startRenderLoop(onUpdate: () => void): void {
    this.babylonEngine.runRenderLoop(() => {
      onUpdate();
      this.scene.render();
    });
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getDeltaTime(): number {
    return this.babylonEngine.getDeltaTime() / 1000;
  }

  public dispose(): void {
    this.scene.dispose();
    this.babylonEngine.dispose();
  }
}
