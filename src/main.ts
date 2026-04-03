import { Game } from './Game';

// Babylon.js side-effect imports for tree shaking
import '@babylonjs/core/Engines/engine';
import '@babylonjs/core/scene';
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Lights/hemisphericLight';
import '@babylonjs/core/Lights/directionalLight';
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Physics/v2/physicsEngineComponent';
import '@babylonjs/core/Physics/v2/physicsBody';
import '@babylonjs/core/Physics/v2/physicsAggregate';
import '@babylonjs/core/Materials/Textures/dynamicTexture';
import '@babylonjs/core/Culling/ray';

async function main() {
  const loadingBar = document.getElementById('loadingBarFill');
  const loadingText = document.getElementById('loadingText');

  try {
    if (loadingBar) loadingBar.style.width = '20%';
    if (loadingText) loadingText.textContent = 'Motor baslatiliyor...';

    const game = new Game();

    if (loadingBar) loadingBar.style.width = '40%';
    if (loadingText) loadingText.textContent = 'Fizik motoru yukleniyor...';

    await game.init();

    if (loadingBar) loadingBar.style.width = '100%';
    if (loadingText) loadingText.textContent = 'Hazir!';

    (window as any).__game = game;

    console.log('Solo Leveling Game initialized with Havok Physics!');
    console.log('Controls: WASD = Move, Shift = Sprint, Space = Jump, C = Dodge');
    console.log('Camera: Right-click drag = Rotate, Scroll = Zoom');

  } catch (error) {
    console.error('Failed to initialize game:', error);
    if (loadingText) {
      loadingText.textContent = `Hata: ${error}`;
      loadingText.style.color = '#ff4444';
    }
  }
}

main();
