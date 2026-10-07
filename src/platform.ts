import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import type { App } from './app';
import { closeTopModal, modalOpen } from './ui/overlay';
import { sound } from './audio/sound';

export function isNative() {
  return Capacitor.isNativePlatform();
}

/** Android hardware back button: close a dialog, else let the screen handle it, else leave the app. */
export function setupPlatform(app: App) {
  if (isNative()) {
    void CapApp.addListener('backButton', () => {
      if (modalOpen()) {
        closeTopModal();
        return;
      }
      if (app.screen?.onBack?.()) return;
      void CapApp.exitApp();
    });
    void CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) sound.setMusic(false);
      else sound.setMusic(app.prefs.music);
    });
  }

  // Register the offline service worker for the web version only.
  const isWeb = !isNative() && !window.softDesktop && (location.protocol === 'https:' || location.hostname === 'localhost');
  if (isWeb && 'serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('[pwa] service worker not registered', e));
  }
}
