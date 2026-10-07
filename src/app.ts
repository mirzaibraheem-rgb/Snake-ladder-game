import type { GameContent } from './content';
import { loadPrefs, savePrefs, type Prefs } from './config';
import { setLang } from './content/strings';
import { sound } from './audio/sound';

export interface Screen {
  el: HTMLElement;
  destroy?: () => void;
  /** Android back button / Escape. Return true if handled. */
  onBack?: () => boolean;
  onKey?: (e: KeyboardEvent) => void;
  /** Re-render text after a language change. */
  refresh?: () => void;
}

export class App {
  prefs: Prefs = loadPrefs();
  private current: Screen | null = null;
  constructor(
    public root: HTMLElement,
    public content: GameContent,
  ) {
    setLang(this.prefs.language);
    sound.setSfx(this.prefs.sound);
    sound.musicOn = this.prefs.music;
  }

  show(screen: Screen) {
    this.current?.destroy?.();
    this.root.replaceChildren(screen.el);
    this.current = screen;
  }

  get screen() {
    return this.current;
  }

  updatePrefs(p: Partial<Prefs>) {
    this.prefs = { ...this.prefs, ...p, rules: { ...this.prefs.rules, ...(p.rules ?? {}) } };
    savePrefs(this.prefs);
    setLang(this.prefs.language);
    sound.setSfx(this.prefs.sound);
    sound.setMusic(this.prefs.music);
    this.current?.refresh?.();
  }
}
