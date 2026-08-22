import React, { useRef, useState } from 'react';
import { OSTheme } from '../../types';
import WhiteboxSoundEditor from '../chat/WhiteboxSoundEditor';
import { WhiteboxSound } from '../../utils/whiteboxSound';
import ChromeCssEditor from '../chat/ChromeCssEditor';

type Props = {
    theme: OSTheme;
    updateTheme: (updates: Partial<OSTheme>) => void;
    /** 一键还原全部聊天白框 CSS（全局 + 每个角色），兼作坏 CSS 救援。 */
    onResetAllChrome?: () => void;
};

const presets: Array<{ name: string; desc: string; config: Partial<OSTheme> }> = [
    {
        name: '默认聊天',
        desc: '柔和通用的聊天壳',
        config: {
            chatChromeStyle: 'soft',
            chatBackgroundStyle: 'plain',
            chatHeaderStyle: 'default',
            chatHeaderAlign: 'left',
            chatHeaderDensity: 'default',
            chatStatusStyle: 'subtle',
            chatAvatarShape: 'circle',
            chatAvatarSize: 'medium',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'modern',
            chatMessageSpacing: 'default',
            chatInputStyle: 'rounded',
            chatSendButtonStyle: 'circle',
            chatShowTimestamp: 'always',
        },
    },
    {
        name: 'WeChat',
        desc: '平整克制的熟悉感',
        config: {
            chatChromeStyle: 'flat',
            chatBackgroundStyle: 'paper',
            chatHeaderStyle: 'wechat',
            chatHeaderAlign: 'left',
            chatHeaderDensity: 'compact',
            chatStatusStyle: 'dot',
            chatAvatarShape: 'square',
            chatAvatarSize: 'medium',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'wechat',
            chatMessageSpacing: 'default',
            chatInputStyle: 'wechat',
            chatSendButtonStyle: 'pill',
            chatShowTimestamp: 'always',
        },
    },
    {
        name: 'Telegram',
        desc: '轻盈通透的玻璃感',
        config: {
            chatChromeStyle: 'floating',
            chatBackgroundStyle: 'mesh',
            chatHeaderStyle: 'telegram',
            chatHeaderAlign: 'center',
            chatHeaderDensity: 'default',
            chatStatusStyle: 'pill',
            chatAvatarShape: 'circle',
            chatAvatarSize: 'medium',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'flat',
            chatMessageSpacing: 'spacious',
            chatInputStyle: 'telegram',
            chatSendButtonStyle: 'circle',
            chatShowTimestamp: 'always',
        },
    },
    {
        name: 'Discord',
        desc: '频道感更强的界面',
        config: {
            chatChromeStyle: 'floating',
            chatBackgroundStyle: 'grid',
            chatHeaderStyle: 'discord',
            chatHeaderAlign: 'left',
            chatHeaderDensity: 'default',
            chatStatusStyle: 'pill',
            chatAvatarShape: 'rounded',
            chatAvatarSize: 'medium',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'shadow',
            chatMessageSpacing: 'compact',
            chatInputStyle: 'discord',
            chatSendButtonStyle: 'minimal',
            chatShowTimestamp: 'always',
        },
    },
    {
        name: 'iMessage',
        desc: '更圆润、更轻的气质',
        config: {
            chatChromeStyle: 'soft',
            chatBackgroundStyle: 'mesh',
            chatHeaderStyle: 'minimal',
            chatHeaderAlign: 'center',
            chatHeaderDensity: 'airy',
            chatStatusStyle: 'subtle',
            chatAvatarShape: 'circle',
            chatAvatarSize: 'large',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'ios',
            chatMessageSpacing: 'spacious',
            chatInputStyle: 'ios',
            chatSendButtonStyle: 'circle',
            chatShowTimestamp: 'always',
        },
    },
    {
        name: '沉浸剧场',
        desc: '无头像+贴边+松行距',
        config: {
            chatChromeStyle: 'flat',
            chatBackgroundStyle: 'plain',
            chatHeaderStyle: 'minimal',
            chatHeaderAlign: 'center',
            chatHeaderDensity: 'compact',
            chatStatusStyle: 'subtle',
            chatAvatarShape: 'circle',
            chatAvatarSize: 'medium',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'flat',
            chatMessageSpacing: 'spacious',
            chatInputStyle: 'flat',
            chatSendButtonStyle: 'minimal',
            chatShowTimestamp: 'never',
            chatAvatarVisibility: 'hide_both',
            chatSnapToEdge: true,
            chatBubbleLineHeight: 1.5,
        },
    },
    {
        name: '紧凑密聊',
        desc: '小字紧排+顶对齐头像',
        config: {
            chatChromeStyle: 'flat',
            chatBackgroundStyle: 'plain',
            chatHeaderStyle: 'default',
            chatHeaderAlign: 'left',
            chatHeaderDensity: 'compact',
            chatStatusStyle: 'dot',
            chatAvatarShape: 'rounded',
            chatAvatarSize: 'small',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'flat',
            chatMessageSpacing: 'compact',
            chatInputStyle: 'flat',
            chatSendButtonStyle: 'minimal',
            chatShowTimestamp: 'never',
            chatAvatarVisibility: 'both',
            chatAvatarAlign: 'top',
            chatBubbleFontSize: 13,
            chatBubbleLineHeight: 1.35,
        },
    },
    {
        name: '像素终端',
        desc: '伪窗口风格的聊天壳',
        config: {
            chatChromeStyle: 'pixel',
            chatBackgroundStyle: 'grid',
            chatHeaderStyle: 'pixel',
            chatHeaderAlign: 'left',
            chatHeaderDensity: 'compact',
            chatStatusStyle: 'pill',
            chatAvatarShape: 'square',
            chatAvatarSize: 'small',
            chatAvatarMode: 'grouped',
            chatBubbleStyle: 'outline',
            chatMessageSpacing: 'compact',
            chatInputStyle: 'pixel',
            chatSendButtonStyle: 'pill',
            chatShowTimestamp: 'always',
        },
    },
];

const defaults = {
    chatAvatarShape: 'circle',
    chatAvatarSize: 'medium',
    chatAvatarMode: 'grouped',
    chatAvatarPlacement: 'beside',
    chatBubbleStyle: 'modern',
    chatMessageSpacing: 'default',
    chatShowTimestamp: 'always',
    chatHeaderStyle: 'default',
    chatInputStyle: 'default',
    chatChromeStyle: 'soft',
    chatBackgroundStyle: 'plain',
    chatHeaderAlign: 'left',
    chatHeaderDensity: 'default',
    chatStatusStyle: 'subtle',
    chatSendButtonStyle: 'circle',
} as const;

const groupClass = 'rounded-3xl border border-slate-100 bg-white p-5 shadow-sm';


const choices = {
    chrome: [
        { value: 'soft', label: '柔雾', desc: '轻薄玻璃感' },
        { value: 'flat', label: '平面', desc: '更干净利落' },
        { value: 'floating', label: '悬浮', desc: '层次更明显' },
        { value: 'pixel', label: '像素', desc: '硬边伪窗口' },
    ],
    background: [
        { value: 'plain', label: '纯净' },
        { value: 'grid', label: '网格' },
        { value: 'paper', label: '纸面' },
        { value: 'mesh', label: '氛围' },
    ],
    header: [
        { value: 'default', label: '默认' },
        { value: 'minimal', label: '极简' },
        { value: 'gradient', label: '渐变' },
        { value: 'wechat', label: '微信感' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'discord', label: 'Discord' },
        { value: 'pixel', label: '像素窗' },
    ],
    bubble: [
        { value: 'modern', label: '现代' },
        { value: 'flat', label: '扁平' },
        { value: 'outline', label: '描边' },
        { value: 'shadow', label: '立体' },
        { value: 'wechat', label: '微信感' },
        { value: 'ios', label: 'iOS' },
    ],
    input: [
        { value: 'default', label: '默认' },
        { value: 'rounded', label: '圆润' },
        { value: 'flat', label: '扁平' },
        { value: 'wechat', label: '微信感' },
        { value: 'ios', label: 'iOS' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'discord', label: 'Discord' },
        { value: 'pixel', label: '像素窗' },
    ],
    align: [
        { value: 'left', label: '左对齐' },
        { value: 'center', label: '居中' },
    ],
    density: [
        { value: 'compact', label: '紧凑' },
        { value: 'default', label: '默认' },
        { value: 'airy', label: '舒展' },
    ],
    status: [
        { value: 'subtle', label: '弱提示' },
        { value: 'pill', label: '状态胶囊' },
        { value: 'dot', label: '圆点在线' },
    ],
    send: [
        { value: 'circle', label: '圆按钮' },
        { value: 'pill', label: '胶囊按钮' },
        { value: 'minimal', label: '极简图标' },
    ],
    avatarShape: [
        { value: 'circle', label: '圆形' },
        { value: 'rounded', label: '圆角' },
        { value: 'square', label: '方形' },
    ],
    avatarSize: [
        { value: 'small', label: '小' },
        { value: 'medium', label: '中' },
        { value: 'large', label: '大' },
    ],
    avatarMode: [
        { value: 'grouped', label: '连续共用', desc: '一串消息只露一次头像' },
        { value: 'every_message', label: '每条都显示', desc: '每条消息都带头像' },
    ],
    spacing: [
        { value: 'compact', label: '紧凑' },
        { value: 'default', label: '默认' },
        { value: 'spacious', label: '宽松' },
    ],
    timestamp: [
        { value: 'always', label: '始终显示' },
        { value: 'hover', label: '悬停（电脑）' },
        { value: 'never', label: '不显示' },
    ],
    emojiSize: [
        { value: 'small', label: '小', desc: '96px' },
        { value: 'medium', label: '中', desc: '128px' },
        { value: 'large', label: '大', desc: '160px · 旧版' },
    ],
} as const;

const cardButton = (active: boolean) =>
    `rounded-2xl border px-3 py-2 text-left transition-all active:scale-[0.98] ${
        active ? 'border-primary/40 bg-primary/10 text-primary shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
    }`;

const avatarClass = (shape: string, size: string) => {
    const sizeClass = size === 'small' ? 'h-7 w-7' : size === 'large' ? 'h-12 w-12' : 'h-9 w-9';
    const radiusClass = shape === 'square' ? 'rounded-sm' : shape === 'rounded' ? 'rounded-xl' : 'rounded-full';
    return `${sizeClass} ${radiusClass}`;
};

const shellClass = (style: string) => {
    if (style === 'flat') return 'border border-slate-200 shadow-none';
    if (style === 'floating') return 'border border-white/70 shadow-[0_22px_60px_rgba(148,163,184,0.28)]';
    if (style === 'pixel') return 'border-[3px] border-[#7b5a40] shadow-[6px_6px_0_rgba(123,90,64,0.24)]';
    return 'border border-white/70 shadow-[0_15px_40px_rgba(148,163,184,0.18)]';
};

const backgroundStyleForPreview = (style: string, chrome: string): React.CSSProperties => {
    const base = chrome === 'pixel' ? '#efe1cf' : '#f8fafc';
    if (style === 'grid') {
        return {
            backgroundColor: base,
            backgroundImage:
                'linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
        };
    }
    if (style === 'paper') {
        return {
            backgroundColor: chrome === 'pixel' ? '#f4e8d9' : '#f9f7f2',
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)',
            backgroundSize: '16px 16px',
        };
    }
    if (style === 'mesh') {
        return {
            backgroundColor: '#f8fafc',
            backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 85% 15%, rgba(244,114,182,0.18), transparent 24%), radial-gradient(circle at 60% 75%, rgba(45,212,191,0.18), transparent 26%)',
        };
    }
    return { backgroundColor: base };
};

const previewBubbleStyle = (bubble: string, isUser: boolean, theme: OSTheme): React.CSSProperties & Record<string, string | number> => {
    const hue = theme.hue ?? 216;
    const saturation = theme.saturation ?? 88;
    const lightness = theme.lightness ?? 57;
    const primary = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const base = {
        '--sully-bubble-bg': isUser ? primary : '#ffffff',
        '--sully-bubble-text': isUser ? '#ffffff' : '#334155',
        '--sully-bubble-radius': `${bubble === 'ios' ? 24 : bubble === 'wechat' ? 18 : 20}px`,
        padding: '10px 14px',
        maxWidth: '72%',
    } as React.CSSProperties & Record<string, string | number>;
    if (bubble === 'outline') return { ...base, '--sully-bubble-bg': 'transparent', '--sully-bubble-text': isUser ? primary : '#475569', border: `2px solid ${isUser ? primary : '#cbd5e1'}` };
    if (bubble === 'shadow') return { ...base, boxShadow: '0 10px 20px rgba(15,23,42,0.12)' };
    if (bubble === 'flat') return { ...base, boxShadow: 'none' };
    if (bubble === 'wechat') return { ...base, '--sully-bubble-bg': isUser ? '#95ec69' : '#ffffff', '--sully-bubble-text': '#0f172a', boxShadow: 'none', border: '1px solid rgba(15,23,42,0.05)' };
    if (bubble === 'ios') return { ...base, '--sully-bubble-bg': isUser ? primary : 'rgba(255,255,255,0.86)', boxShadow: '0 8px 16px rgba(148,163,184,0.12)', border: '1px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' };
    return { ...base, boxShadow: '0 6px 14px rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.12)' };
};

const ChoiceGroup: React.FC<{
    title: string;
    items: ReadonlyArray<{ value: string; label: string; desc?: string }>;
    value: string;
    onPick: (value: string) => void;
}> = ({ title, items, value, onPick }) => (
    <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <button key={item.value} onClick={() => onPick(item.value)} className={cardButton(value === item.value)}>
                    <div className="text-[11px] font-bold">{item.label}</div>
                    {item.desc && <div className="mt-0.5 text-[9px] opacity-70">{item.desc}</div>}
                </button>
            ))}
        </div>
    </div>
);

export const ChatAppearanceEditor: React.FC<Props> = ({ theme, updateTheme, onResetAllChrome }) => {
    const avatarShape = theme.chatAvatarShape || defaults.chatAvatarShape;
    const avatarSize = theme.chatAvatarSize || defaults.chatAvatarSize;
    const avatarMode = theme.chatAvatarMode || defaults.chatAvatarMode;
    const avatarPlacement = theme.chatAvatarPlacement || defaults.chatAvatarPlacement;
    const bubbleStyle = theme.chatBubbleStyle || defaults.chatBubbleStyle;
    const messageSpacing = theme.chatMessageSpacing || defaults.chatMessageSpacing;
    const showTimestamp = theme.chatShowTimestamp || defaults.chatShowTimestamp;
    const headerStyle = theme.chatHeaderStyle || defaults.chatHeaderStyle;
    const inputStyle = theme.chatInputStyle || defaults.chatInputStyle;
    const chromeStyle = theme.chatChromeStyle || defaults.chatChromeStyle;
    const backgroundStyle = theme.chatBackgroundStyle || defaults.chatBackgroundStyle;
    const headerAlign = theme.chatHeaderAlign || defaults.chatHeaderAlign;
    const headerDensity = theme.chatHeaderDensity || defaults.chatHeaderDensity;
    const statusStyle = theme.chatStatusStyle || defaults.chatStatusStyle;
    const sendButtonStyle = theme.chatSendButtonStyle || defaults.chatSendButtonStyle;
    const pendingIndicator = theme.chatPendingIndicator !== false;
    const showHeaderBuffs = theme.chatHideHeaderBuffs !== true;

    // 聊天壳设置面板悬浮化——同私聊「聊天装扮」的形态：面板浮在预览上方而不占文档流，
    // 预览不用瘦身也能和设置同屏；点圆气泡收起面板即可看全预览。
    // 聊天外观只通过下方完整 CSS 编辑器控制，避免可视化微调与 CSS 互相覆盖。

    // 预览保持与真实聊天相同的头像和气泡布局；具体视觉由完整 CSS 控制。
    const hidePreviewAiAvatar = false;
    const hidePreviewUserAvatar = false;
    const previewRowAlign = 'items-end';
    const previewFineTextStyle: React.CSSProperties = {};

    const headerClass =
        headerStyle === 'minimal'
            ? 'bg-white/90 border-b border-slate-100'
            : headerStyle === 'gradient'
              ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-white border-b border-slate-100'
              : headerStyle === 'wechat'
                ? 'bg-[#f7f7f7] border-b border-black/5'
                : headerStyle === 'telegram'
                  ? 'bg-white/80 backdrop-blur-xl border-b border-sky-100'
                  : headerStyle === 'discord'
                    ? 'bg-slate-900 border-b border-white/10'
                    : headerStyle === 'pixel'
                      ? 'bg-[#c99872] border-b-[3px] border-[#7b5a40]'
                      : 'bg-white/80 border-b border-slate-100';

    const headerTextClass = headerStyle === 'discord' ? 'text-white' : headerStyle === 'pixel' ? 'text-[#fff7ed]' : 'text-slate-700';
    const previewGap = messageSpacing === 'compact' ? 'gap-1.5' : messageSpacing === 'spacious' ? 'gap-4' : 'gap-2.5';
    const previewPad = headerDensity === 'compact' ? 'px-4 py-3' : headerDensity === 'airy' ? 'px-5 py-[18px]' : 'px-4 py-3.5';
    const previewMessages = [
        { id: 'ai-1', role: 'assistant', text: '今天这套聊天壳已经比之前像样多了。' },
        { id: 'ai-2', role: 'assistant', text: '现在还能决定头像是连续共用，还是每条都显示。' },
        { id: 'user-1', role: 'user', text: '对，我想把头像频率也做成可以 DIY 的。' },
        { id: 'user-2', role: 'user', text: '这样不同软件的味道会更明显。' },
    ] as const;

    return (
        <div className="space-y-5">
            {/* 实时预览：聊天壳设置在悬浮面板里（下方圆气泡），预览保持原尺寸、始终可见。 */}
            <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-baseline justify-between px-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">实时预览</h2>
                    <span className="text-[9px] text-slate-300">全局设置 · 改动立即反映</span>
                </div>
                <div className={`sully-chat-root overflow-hidden rounded-[28px] ${shellClass(chromeStyle)}`} style={backgroundStyleForPreview(backgroundStyle, chromeStyle)}>
                    {/* 实时套用「白框自定义」CSS：预览各零件挂了同样的 .sully-chat-* 钩子，故能即时反映。
                        注意：预览外壳 overflow-hidden 会裁掉溢出效果（如波浪下沿），真聊天里完整可见。 */}
                    {[theme.chatChromeCustomCss, theme.chatBubbleCustomCss].filter(Boolean).join('\n') && (
                        <style>{[theme.chatChromeCustomCss, theme.chatBubbleCustomCss].filter(Boolean).join('\n')}</style>
                    )}
                    <div className={`sully-chat-header relative ${headerClass} ${previewPad}`}>
                        <div className={`flex items-center gap-3 ${headerAlign === 'center' ? 'justify-center text-center' : 'justify-between text-left'}`}>
                            <div className={`flex items-center gap-3 ${headerAlign === 'center' ? 'justify-center' : ''}`}>
                                <div
                                    className={`sully-chat-avatar ${avatarClass(avatarShape, avatarSize)} shrink-0`}
                                    style={{
                                        background: headerStyle === 'discord' ? 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(34,197,94,0.9))' : 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(244,114,182,0.18))',
                                        border: headerStyle === 'pixel' ? '2px solid #8f674a' : '1px solid rgba(255,255,255,0.5)',
                                    }}
                                />
                                <div className={`sully-chat-status ${headerAlign === 'center' ? 'flex flex-col items-center' : ''}`}>
                                    <div className={`sully-chat-name text-xs font-bold ${headerTextClass}`}>聊天对象</div>
                                    {statusStyle === 'pill' && <div className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${headerStyle === 'discord' ? 'bg-emerald-500/20 text-emerald-200' : headerStyle === 'pixel' ? 'bg-[#fff7ed] text-[#8f674a]' : 'bg-emerald-50 text-emerald-500'}`}>online</div>}
                                    {statusStyle === 'dot' && <div className={`flex items-center gap-1 text-[9px] ${headerStyle === 'discord' ? 'text-slate-300' : headerStyle === 'pixel' ? 'text-[#f3ddc7]' : 'text-slate-400'}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />online</div>}
                                    {statusStyle === 'subtle' && <div className={`text-[9px] uppercase ${headerStyle === 'discord' ? 'text-slate-400' : headerStyle === 'pixel' ? 'text-[#f3ddc7]' : 'text-slate-400'}`}>online</div>}
                                </div>
                            </div>
                            {headerAlign !== 'center' && <div className={`sully-chat-token text-[9px] font-mono ${headerStyle === 'discord' ? 'text-slate-400' : headerStyle === 'pixel' ? 'text-[#f3ddc7]' : 'text-slate-400'}`}>42 tok</div>}
                        </div>
                        {/* 情绪 buff 栏：挂真聊天同款 .sully-chat-buffs 钩子（子元素必须是 button），
                            「显示情绪栏」开关和白框 CSS 的 .sully-chat-buffs button 美化都能即时预览。 */}
                        {showHeaderBuffs && (
                            <div className={`sully-chat-buffs mt-1.5 flex items-center gap-0.5 ${headerAlign === 'center' ? 'justify-center' : ''}`}>
                                {['😌 平静', '☕ 想喝咖啡'].map((buff) => (
                                    <button
                                        key={buff}
                                        type="button"
                                        tabIndex={-1}
                                        className={`pointer-events-none shrink-0 truncate rounded-[10px] border px-1 py-[3px] text-[8px] font-bold leading-none ${
                                            headerStyle === 'discord'
                                                ? 'border-white/15 bg-white/10 text-slate-200'
                                                : headerStyle === 'pixel'
                                                  ? 'border-[#8f674a] bg-[#fff7ed] text-[#8f674a]'
                                                  : 'border-amber-200 bg-amber-50 text-amber-600'
                                        }`}
                                    >
                                        {buff}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={`flex min-h-[150px] flex-col p-3 ${previewGap}`}>
                        {previewMessages.map((message, index) => {
                            const isUser = message.role === 'user';
                            const previousRole = index > 0 ? previewMessages[index - 1].role : null;
                            const nextRole = index < previewMessages.length - 1 ? previewMessages[index + 1].role : null;
                            const isFirstInGroup = previousRole !== message.role;
                            const shouldShowAvatar = avatarMode === 'every_message' || nextRole !== message.role;
                            const avatarTone = isUser ? 'bg-primary/25' : 'bg-pink-200';
                            const avatarHidden = isUser ? hidePreviewUserAvatar : hidePreviewAiAvatar;
                            const bubbleNode = (
                                <div className={isUser ? 'sully-bubble-user' : 'sully-bubble-ai'} style={{ ...previewBubbleStyle(bubbleStyle, isUser, theme), ...previewFineTextStyle }}>
                                    {message.text}
                                    {showTimestamp === 'always' && nextRole !== message.role && (
                                        <div className={`mt-1 text-right text-[8px] ${isUser ? 'opacity-70' : 'opacity-55'}`}>{isUser ? '14:33' : '14:32'}</div>
                                    )}
                                </div>
                            );
                            if (avatarPlacement === 'above_group') {
                                return (
                                    <div key={message.id} className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                                        {isFirstInGroup && !avatarHidden && <div className={`${avatarClass(avatarShape, avatarSize)} shrink-0 ${avatarTone}`} />}
                                        {bubbleNode}
                                    </div>
                                );
                            }
                            return (
                                <div key={message.id} className={`flex ${previewRowAlign} gap-2 ${isUser ? 'justify-end' : ''}`}>
                                    {!isUser && !hidePreviewAiAvatar && <div className={`${avatarClass(avatarShape, avatarSize)} shrink-0 ${avatarTone} ${shouldShowAvatar ? '' : 'opacity-0'}`} />}
                                    {bubbleNode}
                                    {isUser && !hidePreviewUserAvatar && <div className={`${avatarClass(avatarShape, avatarSize)} shrink-0 ${avatarTone} ${shouldShowAvatar ? '' : 'opacity-0'}`} />}
                                </div>
                            );
                        })}
                    </div>
                    <div className={`sully-chat-inputbar border-t px-3 py-3 ${chromeStyle === 'pixel' ? 'border-[#8f674a] bg-[#eadfce]' : headerStyle === 'discord' ? 'border-white/10 bg-slate-900/90' : 'border-slate-100 bg-white/80'}`}>
                        <div className="flex items-end gap-2">
                            <button className={`sully-chat-add-button flex h-10 w-10 shrink-0 items-center justify-center ${chromeStyle === 'pixel' ? 'rounded-[4px] border-2 border-[#8f674a] bg-[#f8f0e0] text-[#8f674a]' : headerStyle === 'discord' ? 'rounded-full bg-slate-800 text-slate-200' : 'rounded-full bg-slate-100 text-slate-500'}`}>+</button>
                            <div className={`sully-chat-input-wrap flex min-h-10 flex-1 items-center px-4 text-[11px] ${inputStyle === 'flat' ? 'rounded-none border-b border-slate-200 bg-transparent' : inputStyle === 'wechat' ? 'rounded-full border border-slate-200 bg-white' : inputStyle === 'ios' ? 'rounded-[26px] border border-white/80 bg-white/80 shadow-inner' : inputStyle === 'telegram' ? 'rounded-2xl border border-sky-100 bg-white' : inputStyle === 'discord' ? 'rounded-2xl border border-white/10 bg-slate-800 text-white' : inputStyle === 'pixel' ? 'rounded-[4px] border-2 border-[#8f674a] bg-[#f8f0e0]' : inputStyle === 'rounded' ? 'rounded-full bg-slate-100' : 'rounded-[22px] bg-slate-100'}`}>
                                输入消息...
                            </div>
                            <button className={`sully-chat-send-button shrink-0 ${sendButtonStyle === 'pill' ? (chromeStyle === 'pixel' ? 'h-10 min-w-[68px] rounded-[4px] border-2 border-[#8f674a] bg-[#c99872] px-4 text-[11px] font-bold text-[#fff7ed]' : 'h-10 min-w-[68px] rounded-full bg-primary px-4 text-[11px] font-bold text-white') : sendButtonStyle === 'minimal' ? (chromeStyle === 'pixel' ? 'flex h-10 w-10 items-center justify-center rounded-[4px] border-2 border-[#8f674a] bg-[#c99872] text-[#fff7ed]' : 'flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-primary') : (chromeStyle === 'pixel' ? 'flex h-10 w-10 items-center justify-center rounded-[4px] border-2 border-[#8f674a] bg-[#c99872] text-[#fff7ed]' : 'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg')}`}>
                                {sendButtonStyle === 'pill' ? '发送' : '➤'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className={groupClass}>
                <div className="mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">全局默认提示音</h2>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                        某角色没单独设提示音时，收到 ta 的新消息就用这里的默认音。角色自己在「＋」菜单「提示音」里设的会盖过全局。
                    </p>
                </div>
                <WhiteboxSoundEditor
                    sound={(theme.chatSound as WhiteboxSound | undefined) || null}
                    showBind={false}
                    onChangeSound={(s) => updateTheme({ chatSound: s || undefined })}
                    hint={<>🔔 <b>全局默认</b>：某角色未单独设提示音时，收到 ta 新发的最后一条消息就响这个。角色自己设的会盖过它。</>}
                />
            </section>

            <section className={groupClass}>
                <div className="mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">聊天装扮 CSS</h2>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-400">一段 CSS 同时控制聊天界面、顶栏、输入栏和气泡；保存预设后可直接整套套用。</p>
                </div>
                <ChromeCssEditor
                    value={[theme.chatChromeCustomCss, theme.chatBubbleCustomCss].filter(Boolean).join('\n')}
                    onChange={(css) => updateTheme({ chatChromeCustomCss: css, chatBubbleCustomCss: '' })}
                />
                <button
                    onClick={() => { if (window.confirm('确定还原全部聊天界面和气泡 CSS？将清空全局与角色白框 CSS。')) onResetAllChrome?.(); updateTheme({ chatChromeCustomCss: '', chatBubbleCustomCss: '' }); }}
                    className="mt-3 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-[0.99]">
                    清空自定义 CSS
                </button>
            </section>

            <div className="px-2 pb-2 text-center text-[10px] leading-relaxed text-slate-400">
                这一版先把聊天外观做成模块化换壳。后面如果你想继续往深处玩，我们还可以拆成每个角色单独一套聊天壳，甚至让不同 app 模拟不同平台 UI。
            </div>
        </div>
    );
};
