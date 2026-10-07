import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/noto-nastaliq-urdu/arabic-400.css';
import '@fontsource/noto-nastaliq-urdu/arabic-700.css';
import './styles.css';
import { loadContent } from './content';
import { setStrings } from './content/strings';
import { App } from './app';
import { titleScene } from './scenes/title';
import { setupPlatform } from './platform';
import { closeTopModal, modalOpen } from './ui/overlay';
import { sound } from './audio/sound';

async function boot() {
  const root = document.getElementById('app')!;
  const content = await loadContent();
  setStrings(content.ui);
  const app = new App(root, content);
  setupPlatform(app);
  app.show(titleScene(app));
  document.getElementById('splash')?.remove();

  // First tap/key anywhere unlocks audio (browsers require a user gesture).
  const unlock = () => sound.unlock();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen()) {
      closeTopModal();
      return;
    }
    app.screen?.onKey?.(e);
  });
  (window as unknown as { __soft: App }).__soft = app; // handy in the browser console for support
}

boot().catch((e) => {
  console.error(e);
  const root = document.getElementById('app');
  if (root) root.textContent = 'Sorry, the game could not start. Please close it and open it again.';
});
