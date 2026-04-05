import { Engine as BabylonEngine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';
import { ENGINE } from '../config/GameConfig';

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
    this.scene.clearColor = new Color4(ENGINE.clearColor.r, ENGINE.clearColor.g, ENGINE.clearColor.b, 1);
    this.scene.ambientColor = new Color3(ENGINE.ambientColor.r, ENGINE.ambientColor.g, ENGINE.ambientColor.b);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = ENGINE.fog.density;
    this.scene.fogColor = new Color3(ENGINE.fog.color.r, ENGINE.fog.color.g, ENGINE.fog.color.b);

    this.setupLights();
    this.setupResize();
  }

  public async initPhysics(): Promise<void> {
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, ENGINE.gravity, 0), havokPlugin);
  }

  private setupLights(): void {
    this.ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    this.ambientLight.intensity = ENGINE.ambientLight.intensity;
    this.ambientLight.diffuse = new Color3(ENGINE.ambientLight.diffuse.r, ENGINE.ambientLight.diffuse.g, ENGINE.ambientLight.diffuse.b);
    this.ambientLight.groundColor = new Color3(ENGINE.ambientLight.groundColor.r, ENGINE.ambientLight.groundColor.g, ENGINE.ambientLight.groundColor.b);

    this.sunLight = new DirectionalLight(
      'sunLight',
      new Vector3(ENGINE.sunLight.direction.x, ENGINE.sunLight.direction.y, ENGINE.sunLight.direction.z).normalize(),
      this.scene
    );
    this.sunLight.intensity = ENGINE.sunLight.intensity;
    this.sunLight.diffuse = new Color3(ENGINE.sunLight.diffuse.r, ENGINE.sunLight.diffuse.g, ENGINE.sunLight.diffuse.b);
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
