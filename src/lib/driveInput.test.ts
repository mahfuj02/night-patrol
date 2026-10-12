import { describe, expect, it } from 'vitest';
import { actionForKey, isInteractiveTarget } from './driveInput';
import { KEY_NUDGE } from './route';

describe('actionForKey', () => {
  it('steps with space and page keys', () => {
    expect(actionForKey(' ', false, false)).toEqual({ type: 'step', dir: 1 });
    expect(actionForKey(' ', true, false)).toEqual({ type: 'step', dir: -1 });
    expect(actionForKey('PageDown', false, false)).toEqual({ type: 'step', dir: 1 });
    expect(actionForKey('PageUp', false, false)).toEqual({ type: 'step', dir: -1 });
  });

  it('nudges with arrow keys', () => {
    expect(actionForKey('ArrowDown', false, false)).toEqual({ type: 'nudge', delta: KEY_NUDGE });
    expect(actionForKey('ArrowRight', false, false)).toEqual({ type: 'nudge', delta: KEY_NUDGE });
    expect(actionForKey('ArrowUp', false, false)).toEqual({ type: 'nudge', delta: -KEY_NUDGE });
    expect(actionForKey('ArrowLeft', false, false)).toEqual({ type: 'nudge', delta: -KEY_NUDGE });
  });

  it('steps instead of scrubbing under reduced motion', () => {
    expect(actionForKey('ArrowDown', false, true)).toEqual({ type: 'step', dir: 1 });
    expect(actionForKey('ArrowLeft', false, true)).toEqual({ type: 'step', dir: -1 });
  });

  it('ignores other keys, including Tab', () => {
    expect(actionForKey('Tab', false, false)).toBeNull();
    expect(actionForKey('Enter', false, false)).toBeNull();
    expect(actionForKey('a', false, false)).toBeNull();
  });
});

describe('isInteractiveTarget', () => {
  const make = (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    return host;
  };

  it('treats links, buttons, inputs and focusable elements as interactive', () => {
    const host = make(
      '<a href="/x"><span id="in-link"></span></a><button id="b"></button><input id="i"><div tabindex="0" id="t"></div><div role="slider" id="s"></div>',
    );
    for (const id of ['in-link', 'b', 'i', 't', 's']) {
      expect(isInteractiveTarget(host.querySelector(`#${id}`))).toBe(true);
    }
    host.remove();
  });

  it('treats the bare page as not interactive', () => {
    const host = make('<div id="plain"><p id="p"></p><div tabindex="-1" id="m"></div></div>');
    expect(isInteractiveTarget(host.querySelector('#p'))).toBe(false);
    expect(isInteractiveTarget(host.querySelector('#m'))).toBe(false);
    expect(isInteractiveTarget(document.body)).toBe(false);
    host.remove();
  });

  it('handles non-element targets', () => {
    expect(isInteractiveTarget(null)).toBe(false);
    expect(isInteractiveTarget(window)).toBe(false);
  });
});
