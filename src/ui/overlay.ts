import { h, dur, sleep } from './dom';
import { sound } from '../audio/sound';

let layer: HTMLElement | null = null;
function root() {
  if (!layer) {
    layer = h('div', { class: 'overlay-root' });
    document.body.append(layer);
  }
  return layer;
}

export interface ModalHandle {
  el: HTMLElement;
  close: () => void;
  closed: Promise<void>;
}

const stack: ModalHandle[] = [];
export function modalOpen() {
  return stack.length > 0;
}
/** Close the top modal (used by Escape / Android back). Returns false if none. */
export function closeTopModal(): boolean {
  const top = stack[stack.length - 1];
  if (!top || top.el.dataset.dismissable !== 'true') return stack.length > 0;
  top.close();
  return true;
}

export function openModal(content: HTMLElement, opts: { cls?: string; dismissable?: boolean; label?: string } = {}): ModalHandle {
  const backdrop = h('div', { class: `modal-backdrop ${opts.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.label ?? '' });
  backdrop.dataset.dismissable = String(!!opts.dismissable);
  const panel = h('div', { class: 'modal-panel' }, content);
  backdrop.append(panel);
  let resolve!: () => void;
  const closed = new Promise<void>((r) => (resolve = r));
  const prevFocus = document.activeElement as HTMLElement | null;
  const handle: ModalHandle = {
    el: backdrop,
    closed,
    close: () => {
      const i = stack.indexOf(handle);
      if (i >= 0) stack.splice(i, 1);
      backdrop.classList.add('leaving');
      setTimeout(() => backdrop.remove(), dur(200));
      prevFocus?.focus?.();
      resolve();
    },
  };
  if (opts.dismissable) backdrop.addEventListener('click', (e) => e.target === backdrop && handle.close());
  stack.push(handle);
  root().append(backdrop);
  requestAnimationFrame(() => {
    backdrop.classList.add('shown');
    const f = panel.querySelector<HTMLElement>('[autofocus], .btn-primary, button');
    f?.focus({ preventScroll: true });
  });
  return handle;
}

/** Short message that disappears by itself. */
export async function toast(content: HTMLElement, opts: { ms?: number; cls?: string; host?: HTMLElement; chime?: boolean } = {}) {
  const host = opts.host ?? root();
  const el = h('div', { class: `toast ${opts.cls ?? ''}`, role: 'status', 'aria-live': 'polite' }, content);
  host.append(el);
  if (opts.chime !== false) sound.toast();
  requestAnimationFrame(() => el.classList.add('shown'));
  await sleep(Math.max(dur(opts.ms ?? 2400), 900));
  el.classList.remove('shown');
  el.classList.add('leaving');
  setTimeout(() => el.remove(), 400);
}
