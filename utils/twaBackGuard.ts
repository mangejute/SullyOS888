const TWA_BACK_GUARD_STATE_KEY = '__sullyosTwaBackGuard';

type HistoryLike = Pick<History, 'state' | 'pushState'>;
type EventTargetLike = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

const asHistoryState = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

/**
 * Keep one same-document history entry in front of the TWA root entry.
 * Android back/swipe pops that guard; we immediately restore it and delegate
 * the action to SullyOS' existing back-handler stack. This mirrors the
 * Capacitor shell, where back closes an in-app panel/app instead of killing
 * the Activity. The caller is responsible for enabling it only in an
 * installed standalone shell.
 */
export const installTwaBackGuard = (
  onBack: () => void,
  historyApi: HistoryLike = window.history,
  eventTarget: EventTargetLike = window,
  currentUrl: string = window.location.href,
): (() => void) => {
  const ensureGuard = () => {
    const currentState = asHistoryState(historyApi.state);
    if (currentState[TWA_BACK_GUARD_STATE_KEY] === true) return;
    historyApi.pushState(
      { ...currentState, [TWA_BACK_GUARD_STATE_KEY]: true },
      '',
      currentUrl,
    );
  };

  const handlePopState = () => {
    ensureGuard();
    onBack();
  };

  ensureGuard();
  eventTarget.addEventListener('popstate', handlePopState);
  return () => eventTarget.removeEventListener('popstate', handlePopState);
};
