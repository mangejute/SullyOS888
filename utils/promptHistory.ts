import type { PromptHistoryEntry, PromptHistoryKind } from '../types';
import { DB } from './db';

const MAX_ENTRIES_PER_KIND = 30;

const makeId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/** Persist a complete prompt before its request is sent. New rounds never replace earlier ones. */
export async function recordPromptHistory(
    charId: string,
    kind: PromptHistoryKind,
    content: string,
): Promise<void> {
    if (!charId || !content.trim()) return;
    const entry: PromptHistoryEntry = { id: makeId(), charId, kind, content, createdAt: Date.now() };
    await DB.savePromptHistory(entry);

    const entries = await DB.getPromptHistory(charId, kind);
    await Promise.all(entries.slice(MAX_ENTRIES_PER_KIND).map(item => DB.deletePromptHistory(item.id)));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sully-prompt-history-updated', { detail: { charId, kind } }));
    }
}

export function getPromptHistory(charId: string, kind: PromptHistoryKind): Promise<PromptHistoryEntry[]> {
    return DB.getPromptHistory(charId, kind);
}
