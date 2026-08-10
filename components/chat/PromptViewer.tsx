import React, { useEffect, useMemo, useState } from 'react';
import { CharacterProfile, PromptHistoryEntry, PromptHistoryKind } from '../../types';
import { getPromptHistory } from '../../utils/promptHistory';

interface PromptViewerProps {
    character: CharacterProfile;
    lastSystemPrompt?: string;
    imagePrompt?: string;
    onClose: () => void;
}

const PromptViewer: React.FC<PromptViewerProps> = ({ character, lastSystemPrompt, imagePrompt, onClose }) => {
    const [history, setHistory] = useState<Record<PromptHistoryKind, PromptHistoryEntry[]>>({ chat: [], schedule: [] });
    const [activeId, setActiveId] = useState('chat');
    const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [chat, schedule] = await Promise.all([
                    getPromptHistory(character.id, 'chat'),
                    getPromptHistory(character.id, 'schedule'),
                ]);
                if (!cancelled) setHistory({ chat, schedule });
            } catch (error) {
                console.warn('[PromptViewer] failed to load prompt history:', error);
            }
        };
        const onHistoryUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ charId?: string }>).detail;
            if (detail?.charId === character.id) void load();
        };
        void load();
        window.addEventListener('sully-prompt-history-updated', onHistoryUpdated);
        return () => {
            cancelled = true;
            window.removeEventListener('sully-prompt-history-updated', onHistoryUpdated);
        };
    }, [character.id]);

    const entries = useMemo(() => [
        { id: 'chat', label: '聊天', historyKind: 'chat' as const, content: lastSystemPrompt || '还没有生成过聊天提示词。发送一条消息后，这里会显示本轮实际发送给 AI 的完整系统提示词。' },
        { id: 'character', label: '角色设定', content: character.systemPrompt || '当前角色还没有填写角色设定。' },
        { id: 'worldview', label: '世界观', content: character.worldview || '当前角色还没有填写世界观。' },
        { id: 'schedule', label: '日程', historyKind: 'schedule' as const, content: '还没有生成过日程提示词。打开日程并生成当天安排后，这里会保留每一轮实际发送给 AI 的完整提示词。' },
        { id: 'story', label: '剧情 / 见面', content: '剧情与见面提示词会在进入见面、剧情演出或小剧场时，结合当前场景动态生成。' },
        { id: 'proactive', label: '主动消息', content: '主动消息提示词会在角色主动消息任务触发时，使用当前角色设定、近期对话和主动消息规则动态生成。' },
        { id: 'image', label: '角色生图', content: imagePrompt || '系统设置中还没有填写生图提示词。\n\n参考图：' + ((character.imageGenerationReferences || []).length) + '/4 张' },
        { id: 'html', label: 'HTML 模式', content: character.htmlModeEnabled ? (character.htmlModeCustomPrompt || 'HTML 模式已开启，使用内置 HTML 卡片提示词。') : 'HTML 模式当前未开启。' },
    ], [character, imagePrompt, lastSystemPrompt]);
    const active = entries.find(entry => entry.id === activeId) || entries[0];
    const activeHistory = active.historyKind ? history[active.historyKind] : [];
    const selectedHistory = activeHistory.find(item => item.id === selectedHistoryId) || activeHistory[0];
    const displayedContent = selectedHistory?.content || active.content;
    const formatTime = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(timestamp));

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(displayedContent);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = displayedContent;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6">
            <button type="button" aria-label="关闭提示词查看器" className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} />
            <div className="relative flex h-[min(92dvh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">提示词查看器</h2>
                        <p className="mt-0.5 text-[10px] text-slate-400">{character.name} · 查看各功能发送给 AI 的提示词</p>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl leading-none text-slate-500">×</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {entries.map(entry => (
                            <button key={entry.id} type="button" onClick={() => { setActiveId(entry.id); setSelectedHistoryId(undefined); }} className={`rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${active.id === entry.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {entry.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div>
                                <div className="text-xs font-bold text-slate-600">{active.label}</div>
                                {active.historyKind && <div className="mt-0.5 text-[10px] text-slate-400">已保留 {activeHistory.length} 轮实际提示词</div>}
                            </div>
                            <button type="button" onClick={copyPrompt} className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-transform">
                                {copied ? '已复制' : '复制提示词'}
                            </button>
                        </div>
                        {activeHistory.length > 0 && (
                            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                                {activeHistory.map((item, index) => (
                                    <button key={item.id} type="button" onClick={() => setSelectedHistoryId(item.id)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${selectedHistory?.id === item.id ? 'bg-primary text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
                                        {index === 0 ? '最新一轮' : formatTime(item.createdAt)}
                                    </button>
                                ))}
                            </div>
                        )}
                        <pre className="min-h-[320px] whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-600">{displayedContent}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptViewer;
