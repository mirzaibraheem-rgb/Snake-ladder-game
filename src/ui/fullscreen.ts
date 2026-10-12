import { h } from './dom';
import { plain } from '../content/strings';
import { sound } from '../audio/sound';

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const doc = () => document as FsDoc;

export function fullscreenSupported(): boolean {
  const el = document.documentElement as FsEl;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen) && (document.fullscreenEnabled ?? true);
}

export function isFullscreen(): boolean {
  return !!(doc().fullscreenElement || doc().webkitFullscreenElement);
}

export async function toggleFullscreen() {
  try {
    if (isFullscreen()) await (doc().exitFullscreen?.() ?? doc().webkitExitFullscreen?.());
    else {
      const el = document.documentElement as FsEl;
      await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
    }
  } catch (e) {
    console.warn('[fullscreen] not allowed here', e);
  }
}

const ENTER = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EXIT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Round button that toggles full screen (for events and projectors). Returns null where the browser cannot do it (iPhone). */
export function fullscreenButton(cls = 'btn btn-icon fs-btn'): HTMLButtonElement | null {
  if (!fullscreenSupported()) return null;
  const btn = h('button', { type: 'button', class: cls, 'data-testid': 'fullscreen' });
  const update = () => {
    const on = isFullscreen();
    btn.innerHTML = on ? EXIT : ENTER;
    btn.setAttribute('aria-label', plain(on ? 'exitFullscreen' : 'fullscreen'));
    btn.title = plain(on ? 'exitFullscreen' : 'fullscreen');
    btn.setAttribute('aria-pressed', String(on));
  };
  btn.addEventListener('click', () => {
    sound.click();
    void toggleFullscreen();
  });
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  update();
  return btn;
}
