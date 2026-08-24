import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ChatHeaderShell from '../components/chat/ChatHeaderShell';

const renderHeader = (compactStatusInBuffRow: boolean) => renderToStaticMarkup(
    React.createElement(ChatHeaderShell, {
        selectionMode: false,
        selectedCount: 0,
        onCancelSelection: vi.fn(),
        activeCharacter: { id: 'char-1', name: '方亦楷', avatar: '', activeBuffs: [] },
        isTyping: false,
        isSummarizing: false,
        isEmotionEvaluating: true,
        isInstantSending: true,
        isMemoryPalaceProcessing: true,
        memoryPalaceStatusText: '状态检测中',
        lastTokenUsage: 42357,
        tokenBreakdown: { prompt: 40000, completion: 2357, total: 42357, msgCount: 10, pass: 'test' },
        onClose: vi.fn(),
        onTriggerAI: vi.fn(),
        onShowCharsPanel: vi.fn(),
        showOnlineStatus: false,
        showTrigger: false,
        compactStatusInBuffRow,
    }),
);

describe('ChatHeaderShell compact retro status layout', () => {
    it('puts the token count into the mood row and removes transient header statuses', () => {
        const markup = renderHeader(true);
        const moodRowIndex = markup.indexOf('sully-chat-buffs');
        const tokenIndex = markup.indexOf('42357');

        expect(moodRowIndex).toBeGreaterThan(-1);
        expect(tokenIndex).toBeGreaterThan(moodRowIndex);
        expect(markup).not.toContain('发送中…');
        expect(markup).not.toContain('情绪分析中');
        expect(markup).not.toContain('状态检测中');
    });

    it('keeps the original transient status row outside the compact retro layout', () => {
        const markup = renderHeader(false);

        expect(markup).toContain('42357');
        expect(markup).toContain('发送中…');
        expect(markup).toContain('情绪分析中');
    });
});
