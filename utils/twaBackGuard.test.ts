import { describe, expect, it, vi } from 'vitest';
import { installTwaBackGuard } from './twaBackGuard';

const makeHistory = (initialState: unknown = null) => {
  const history = {
    state: initialState,
    pushState: vi.fn((state: unknown) => {
      history.state = state;
    }),
  };
  return history;
};

describe('installTwaBackGuard', () => {
  it('adds one guard and restores it before delegating popstate', () => {
    const target = new EventTarget();
    const history = makeHistory({ existing: 'kept' });
    const onBack = vi.fn();

    const dispose = installTwaBackGuard(onBack, history, target, 'https://example.test/');
    expect(history.pushState).toHaveBeenCalledTimes(1);
    expect(history.state).toMatchObject({ existing: 'kept', __sullyosTwaBackGuard: true });

    history.state = { existing: 'root' };
    target.dispatchEvent(new Event('popstate'));
    expect(history.pushState).toHaveBeenCalledTimes(2);
    expect(history.state).toMatchObject({ existing: 'root', __sullyosTwaBackGuard: true });
    expect(onBack).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('does not stack guards across React effect remounts', () => {
    const target = new EventTarget();
    const history = makeHistory({ __sullyosTwaBackGuard: true });

    installTwaBackGuard(vi.fn(), history, target, 'https://example.test/');
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it('stops delegating after cleanup', () => {
    const target = new EventTarget();
    const history = makeHistory();
    const onBack = vi.fn();
    const dispose = installTwaBackGuard(onBack, history, target, 'https://example.test/');

    dispose();
    history.state = null;
    target.dispatchEvent(new Event('popstate'));
    expect(onBack).not.toHaveBeenCalled();
  });
});
