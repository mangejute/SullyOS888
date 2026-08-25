import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '../types';
import MessageItem from '../components/chat/MessageItem';

const activeTheme = {
    id: 'test-theme',
    name: 'Test',
    user: {},
    ai: {},
} as any;

const renderMessage = (
    msg: Message,
    moduleAlign: 'anchor' | 'center' = 'center',
    avatarMode: 'grouped' | 'every_message' = 'every_message',
) => renderToStaticMarkup(React.createElement(MessageItem, {
    msg,
    isFirstInGroup: true,
    isLastInGroup: true,
    activeTheme,
    charAvatar: 'https://example.com/char.png',
    charName: '角色',
    userAvatar: 'https://example.com/user.png',
    onLongPress: vi.fn(),
    onReply: vi.fn(),
    selectionMode: false,
    isSelected: false,
    onToggleSelect: vi.fn(),
    avatarMode,
    moduleAlign,
}));

const htmlCard = (): Message => ({
    id: 1,
    charId: 'char-1',
    role: 'assistant',
    type: 'html_card',
    content: '[HTML卡片]',
    timestamp: 1,
    metadata: { htmlSource: '<div>hello</div>' },
});

const musicCard = (): Message => ({
    id: 2,
    charId: 'char-1',
    role: 'assistant',
    type: 'music_card',
    content: '[音乐卡片]',
    timestamp: 2,
    metadata: {
        intent: 'join',
        song: { songId: 7, name: 'Song', artists: 'Artist', albumPic: '' },
    },
});

describe('MessageItem module layout', () => {
    const moduleModes = [
        ['center', 'grouped'],
        ['center', 'every_message'],
        ['anchor', 'grouped'],
        ['anchor', 'every_message'],
    ] as const;

    it.each(moduleModes)('HTML 卡片在 %s / %s 模式都不渲染消息外侧头像', (align, avatarMode) => {
        const markup = renderMessage(htmlCard(), align, avatarMode);
        expect(markup).not.toContain('alt="avatar"');
        expect(markup).toContain('sully-html-wrap');
        expect(markup).toContain(align === 'center' ? 'mx-auto sully-html-wrap' : 'ml-12 sully-html-wrap');
    });

    it.each(moduleModes)('一起听卡片在 %s / %s 模式跟随模块位置且没有消息外侧头像', (align, avatarMode) => {
        const markup = renderMessage(musicCard(), align, avatarMode);
        expect(markup).not.toContain('alt="avatar"');
        expect(markup).toContain(align === 'center' ? 'mx-auto sully-html-wrap' : 'ml-12 sully-html-wrap');
        // 卡片内部的“一起听”双头像仍保留；只移除消息外壳头像。
        expect(markup).toContain('https://example.com/user.png');
        expect(markup).toContain('https://example.com/char.png');
    });

    it('普通角色消息继续显示外侧头像', () => {
        const markup = renderMessage({
            id: 3,
            charId: 'char-1',
            role: 'assistant',
            type: 'text',
            content: '普通消息',
            timestamp: 3,
        });
        expect(markup).toContain('alt="avatar"');
        expect(markup).toContain('https://example.com/char.png');
    });

    it('用户普通消息的独立尾巴在气泡本体之前渲染', () => {
        const markup = renderMessage({
            id: 21,
            charId: 'char-1',
            role: 'user',
            type: 'text',
            content: '尾巴层级检查',
            timestamp: 21,
        });

        const tailIndex = markup.indexOf('sully-bubble-tail-user');
        const bubbleIndex = markup.indexOf('sully-bubble-user', tailIndex);

        // 尾巴是气泡的下层兄弟节点：先渲染尾巴，再渲染 z-index 更高的正文气泡。
        expect(tailIndex).toBeGreaterThan(-1);
        expect(bubbleIndex).toBeGreaterThan(tailIndex);
        expect(markup.slice(tailIndex, bubbleIndex)).toContain('sully-bubble-tail-inner');
        expect(markup.slice(tailIndex, bubbleIndex)).toContain('linearGradient');
    });

    it('角色普通消息直接使用用户提供的单行气泡素材，不再生成 SVG 尾巴', () => {
        const markup = renderMessage({
            id: 23,
            charId: 'char-1',
            role: 'assistant',
            type: 'text',
            content: '角色尾巴形状检查',
            timestamp: 23,
        });

        expect(markup).toContain('sully-bubble-ai sully-bubble-ai-reference-single');
        expect(markup).not.toContain('sully-bubble-tail-ai');
        expect(markup).not.toContain('sully-bubble-tail-svg-ai');
    });

    it('角色多行消息直接使用用户提供的多行气泡素材', () => {
        const markup = renderMessage({
            id: 24,
            charId: 'char-1',
            role: 'assistant',
            type: 'text',
            content: '第一行\n第二行',
            timestamp: 24,
        });

        expect(markup).toContain('sully-bubble-ai sully-bubble-ai-reference-multiline');
        expect(markup).not.toContain('sully-bubble-tail-ai');
    });

    it('引用消息保留主回复与紧凑引用预览两个独立层', () => {
        const markup = renderMessage({
            id: 31,
            charId: 'char-1',
            role: 'user',
            type: 'text',
            content: '那你先休息一下。',
            timestamp: 31,
            replyTo: { id: 30, name: '角色', content: '我今天已经忙了很久。' },
        });

        expect(markup).toContain('sully-bubble-with-reply');
        // 外层只是引用布局壳，角色/用户气泡类必须只落在正文内层，
        // 否则外层的高度和背景会把尾巴的 50% 参照物带偏。
        expect(markup).not.toMatch(/class="[^"]*sully-bubble-with-reply[^"]*sully-bubble-(?:ai|user)/);
        expect(markup).toContain('sully-bubble-text');
        expect(markup).toContain('sully-bubble-reply-main sully-bubble-user');
        // 用户的引用正文和普通用户气泡是同一类；引用摘要不会抢走定位参照物。
        expect(markup).toContain('sully-bubble-tail sully-bubble-tail-user');
        expect(markup).toContain('sully-bubble-tail-inner');
        expect(markup).toContain('sully-reply-quote');
        expect(markup).toContain('sully-reply-quote-sender');
        expect(markup).toContain('sully-reply-quote-preview');
        expect(markup).toContain('引用 角色：我今天已经忙了很久。');
        expect(markup).not.toContain('italic');
        expect(markup).not.toContain('&quot;我今天已经忙了很久。&quot;');

        const tailIndex = markup.indexOf('sully-bubble-tail sully-bubble-tail-user');
        const mainBubbleIndex = markup.indexOf('sully-bubble-reply-main sully-bubble-user', tailIndex);
        // 引用摘要在正文下方，不能成为尾巴定位或叠放的依据。
        expect(mainBubbleIndex).toBeGreaterThan(tailIndex);
    });

    it('角色引用时，正文也使用用户提供的角色气泡素材', () => {
        const markup = renderMessage({
            id: 32,
            charId: 'char-1',
            role: 'assistant',
            type: 'text',
            content: '我记得你刚刚说的。',
            timestamp: 32,
            replyTo: { id: 31, name: '我', content: '那你先休息一下。' },
        });

        expect(markup).toContain('sully-bubble-reply-main sully-bubble-ai sully-bubble-ai-reference-single');
        expect(markup).not.toContain('sully-bubble-tail-ai');
    });

    it('心象卡片提供长按复制提示与独立交互入口', () => {
        const markup = renderMessage({
            id: 4,
            charId: 'char-1',
            role: 'assistant',
            type: 'text',
            content: '回复正文',
            timestamp: 4,
            metadata: { thinkingChain: '这是可以一键复制的完整心象。' },
        });

        expect(markup).toContain('aria-label="心象：点击展开，长按复制全文"');
        expect(markup).toContain('title="长按复制心象全文"');
        expect(markup).toContain('这是可以一键复制的完整心象');
        expect(markup).toContain('user-select:text');
        expect(markup).toContain('-webkit-touch-callout:default');
    });
});
