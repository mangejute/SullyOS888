import type { Message } from '../types';

export const CALL_SNAPSHOT_RETAINED_ROUNDS = 3;

export interface ExpiredCallSnapshot {
  messageId: number;
  refs: string[];
}

/**
 * A video-call session keeps only its newest user snapshots. Older turns retain
 * a lightweight marker so the transcript can render `[图片]` without keeping
 * an ever-growing camera-image archive.
 */
export const findExpiredCallSnapshots = (
  messages: readonly Message[],
  sessionId: string,
  keep = CALL_SNAPSHOT_RETAINED_ROUNDS,
): ExpiredCallSnapshot[] => {
  const retainedCount = Math.max(0, Math.floor(keep));
  return messages
    .filter(message => (
      message.role === 'user'
      && message.metadata?.source === 'call'
      && String(message.metadata?.callSessionId || '') === sessionId
      && (
        (Array.isArray(message.metadata?.cameraSnapshotRefs) && message.metadata.cameraSnapshotRefs.some((ref: unknown) => typeof ref === 'string' && ref.length > 0))
        || (typeof message.metadata?.cameraSnapshotRef === 'string' && message.metadata.cameraSnapshotRef.length > 0)
      )
    ))
    .sort((a, b) => b.timestamp - a.timestamp || b.id - a.id)
    .slice(retainedCount)
    .map(message => ({
      messageId: message.id,
      refs: Array.from(new Set([
        ...(Array.isArray(message.metadata?.cameraSnapshotRefs) ? message.metadata.cameraSnapshotRefs : []),
        ...(typeof message.metadata?.cameraSnapshotRef === 'string' ? [message.metadata.cameraSnapshotRef] : []),
      ].filter((ref): ref is string => typeof ref === 'string' && ref.length > 0))),
    }));
};
