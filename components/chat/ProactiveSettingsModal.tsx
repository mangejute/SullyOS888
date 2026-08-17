
import React, { useState, useEffect } from 'react';
import Modal from '../os/Modal';
import { CharacterProfile } from '../../types';

interface ProactiveSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    char: CharacterProfile;
    isProactiveActive: boolean;
    onSave: (config: NonNullable<CharacterProfile['proactiveConfig']>) => void;
    onStop: () => void;
}

const INTERVAL_OPTIONS = [
    { label: '30 分钟', value: 30 },
    { label: '1 小时', value: 60 },
    { label: '2 小时', value: 120 },
    { label: '4 小时', value: 240 },
    { label: '8 小时', value: 480 },
    { label: '12 小时', value: 720 },
    { label: '24 小时', value: 1440 },
];

const LEVEL_OPTIONS = [
    { value: 'low' as const, label: '少', desc: '偶尔想起你才来' },
    { value: 'balanced' as const, label: '适中', desc: '像普通聊天频率' },
    { value: 'high' as const, label: '频繁', desc: '更容易主动找你' },
];

const ProactiveSettingsModal: React.FC<ProactiveSettingsModalProps> = ({
    isOpen, onClose, char, isProactiveActive, onSave, onStop
}) => {
    const saved = char.proactiveConfig;
    const [enabled, setEnabled] = useState(saved?.enabled ?? false);
    const [mode, setMode] = useState<'human' | 'fixed'>(saved?.mode ?? 'human');
    const [proactiveLevel, setProactiveLevel] = useState<'low' | 'balanced' | 'high'>(saved?.proactiveLevel ?? 'balanced');
    const [interval, setInterval_] = useState(saved?.intervalMinutes ?? 60);
    const [quietEnabled, setQuietEnabled] = useState(saved?.quietHours?.enabled ?? true);
    const [quietStart, setQuietStart] = useState(saved?.quietHours?.start ?? '23:00');
    const [quietEnd, setQuietEnd] = useState(saved?.quietHours?.end ?? '08:00');
    const [maxDaily, setMaxDaily] = useState(String(saved?.maxDailyMessages ?? 0));
    const [useSecondaryApi, setUseSecondaryApi] = useState(saved?.useSecondaryApi ?? false);
    const [secUrl, setSecUrl] = useState(saved?.secondaryApi?.baseUrl ?? '');
    const [secKey, setSecKey] = useState(saved?.secondaryApi?.apiKey ?? '');
    const [secModel, setSecModel] = useState(saved?.secondaryApi?.model ?? '');
    const [showApiSection, setShowApiSection] = useState(saved?.useSecondaryApi ?? false);

    // Reset form when modal opens with new char data
    useEffect(() => {
        if (isOpen) {
            const s = char.proactiveConfig;
            setEnabled(s?.enabled ?? false);
            setMode(s?.mode ?? 'human');
            setProactiveLevel(s?.proactiveLevel ?? 'balanced');
            setInterval_(s?.intervalMinutes ?? 60);
            setQuietEnabled(s?.quietHours?.enabled ?? true);
            setQuietStart(s?.quietHours?.start ?? '23:00');
            setQuietEnd(s?.quietHours?.end ?? '08:00');
            setMaxDaily(String(s?.maxDailyMessages ?? 0));
            setUseSecondaryApi(s?.useSecondaryApi ?? false);
            setSecUrl(s?.secondaryApi?.baseUrl ?? '');
            setSecKey(s?.secondaryApi?.apiKey ?? '');
            setSecModel(s?.secondaryApi?.model ?? '');
            setShowApiSection(s?.useSecondaryApi ?? false);
        }
    }, [isOpen, char.id]);

    const handleSave = () => {
        onSave({
            enabled,
            mode,
            proactiveLevel,
            intervalMinutes: interval,
            quietHours: { enabled: quietEnabled, start: quietStart, end: quietEnd },
            maxDailyMessages: Math.max(0, Number(maxDaily) || 0),
            useSecondaryApi: useSecondaryApi && !!secUrl,
            secondaryApi: useSecondaryApi && secUrl ? {
                baseUrl: secUrl,
                apiKey: secKey,
                model: secModel,
            } : undefined,
        });
        onClose();
    };

    const handleStop = () => {
        onStop();
        setEnabled(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title="主动消息" onClose={onClose} footer={
            <>
                <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-transform">
                    取消
                </button>
                {isProactiveActive ? (
                    <button onClick={handleStop} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg">
                        停止
                    </button>
                ) : null}
                <button onClick={handleSave} className="flex-1 py-3 bg-violet-500 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg">
                    {enabled ? '启动' : '保存'}
                </button>
            </>
        }>
            <div className="space-y-5">
                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed">
                    小雨手机 3.0 会沿用系统后台和通知。后台只是定期叫醒角色，{char.name} 会根据自己的人设、最近聊天和当下生活判断要不要真的来找你，不会机械报时。
                </p>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">启用主动消息</span>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${enabled ? 'bg-violet-500' : 'bg-slate-200'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Status indicator */}
                {isProactiveActive && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-xl border border-violet-100">
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                        <span className="text-xs text-violet-600 font-medium">主动消息进行中</span>
                    </div>
                )}

                {/* Interval Selection */}
                {enabled && (
                    <>
                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">主动模式</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMode('human')} className={`py-3 px-3 rounded-xl text-left text-xs font-bold transition-all ${mode === 'human' ? 'bg-violet-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                    <div>真人模式 3.0</div><div className={`mt-1 font-normal ${mode === 'human' ? 'text-violet-100' : 'text-slate-400'}`}>角色自己决定现在要不要发</div>
                                </button>
                                <button onClick={() => setMode('fixed')} className={`py-3 px-3 rounded-xl text-left text-xs font-bold transition-all ${mode === 'fixed' ? 'bg-violet-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                    <div>固定模式</div><div className={`mt-1 font-normal ${mode === 'fixed' ? 'text-violet-100' : 'text-slate-400'}`}>保持旧版每次都生成</div>
                                </button>
                            </div>
                        </div>

                        {mode === 'human' && <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">主动程度</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LEVEL_OPTIONS.map(opt => <button key={opt.value} onClick={() => setProactiveLevel(opt.value)} className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${proactiveLevel === opt.value ? 'bg-violet-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                    <div>{opt.label}</div><div className={`mt-1 text-[10px] font-normal ${proactiveLevel === opt.value ? 'text-violet-100' : 'text-slate-400'}`}>{opt.desc}</div>
                                </button>)}
                            </div>
                        </div>}

                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">后台检查频率</label>
                            <div className="grid grid-cols-3 gap-2">
                                {INTERVAL_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setInterval_(opt.value)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${interval === opt.value
                                            ? 'bg-violet-500 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">这只是后台问一次“现在想不想联系”，不是保证每隔这么久一定发消息。</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-slate-700">勿扰时段</span><button onClick={() => setQuietEnabled(!quietEnabled)} className={`w-12 h-7 rounded-full transition-colors relative ${quietEnabled ? 'bg-violet-500' : 'bg-slate-200'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${quietEnabled ? 'translate-x-5' : ''}`} /></button></div>
                            {quietEnabled && <div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">开始<input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200" /></label><label className="text-xs text-slate-500">结束<input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200" /></label></div>}
                            <p className="text-[11px] text-slate-400 mt-2">设备本地时间生效，支持跨午夜，例如 23:00 到 08:00。</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100"><label className="text-sm font-bold text-slate-700 block mb-1">每日最多主动消息</label><input type="number" min={0} max={99} value={maxDaily} onChange={e => setMaxDaily(e.target.value)} placeholder="0 = 不限制" className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200" /><p className="text-[11px] text-slate-400 mt-1">只统计真正发出的消息，填 0 不限制。</p></div>

                        {/* Secondary API Toggle */}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-slate-700">使用副 API</span>
                                <button
                                    onClick={() => { setUseSecondaryApi(!useSecondaryApi); setShowApiSection(!useSecondaryApi); }}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${useSecondaryApi ? 'bg-violet-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${useSecondaryApi ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                                使用单独的 API 发送主动消息，避免消耗主 API 额度。不开启则使用主 API。
                            </p>

                            {showApiSection && (
                                <div className="space-y-3 bg-slate-50 rounded-2xl p-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium block mb-1">API URL</label>
                                        <input
                                            type="text"
                                            value={secUrl}
                                            onChange={e => setSecUrl(e.target.value)}
                                            placeholder="https://api.example.com/v1"
                                            className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:border-violet-300 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium block mb-1">API Key</label>
                                        <input
                                            type="password"
                                            value={secKey}
                                            onChange={e => setSecKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:border-violet-300 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium block mb-1">Model</label>
                                        <input
                                            type="text"
                                            value={secModel}
                                            onChange={e => setSecModel(e.target.value)}
                                            placeholder="gpt-4o-mini"
                                            className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:border-violet-300 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(ProactiveSettingsModal);
