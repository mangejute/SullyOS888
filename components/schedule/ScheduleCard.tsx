
import React, { useState, useRef, useEffect } from 'react';
import { DailySchedule, ScheduleSlot, CharacterProfile } from '../../types';
import { getCurrentScheduleSlotIndex, getScheduleWallClock } from '../../utils/scheduleTime';
import { CalendarBlank } from '@phosphor-icons/react';
import { getChinaCalendarDay } from '../../utils/chinaCalendar2026';
import { useOS } from '../../context/OSContext';
import { resolveScheduleCardPalette } from '../../utils/scheduleAppearance';
import { findNpcById, resolveSlotLocation } from '../../utils/characterWorld';
import ScheduleAppearanceButton, { ScheduleCustomCssStyle } from './ScheduleAppearanceButton';

interface ScheduleCardProps {
    schedule: DailySchedule | null;
    character: CharacterProfile | null;
    contentColor?: string;
    compact?: boolean; // widget mode (no editing)
    onEdit?: (index: number, slot: ScheduleSlot) => void;
    onDelete?: (index: number) => void;
    onReroll?: () => void;
    onCoverImageChange?: (dataUrl: string) => void;
    onPlayTheater?: (index: number) => void; // 点某个「已过去/正在进行」时段的播放按钮 → 小剧场
    isGenerating?: boolean;
    onOpenCalendar?: () => void;
}

const formatClock = (now: Date): string =>
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六'];

const dateKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatChineseDate = (date: Date): string =>
    `${date.getMonth() + 1}月${date.getDate()}日 周${WEEKDAYS_CN[date.getDay()]}`;

const addDays = (date: Date, amount: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};

/**
 * 每分钟走一次的「此刻」。卡片可能一直开着，不刷新的话顶部的钟会停，
 * NOW 标记也不会随着时间推进挪到下一个时段。
 */
const useTickingNow = (): Date => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(id);
    }, []);
    return now;
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({
    schedule,
    character,
    contentColor: inheritedContentColor = '#ffffff',
    compact = false,
    onEdit,
    onDelete,
    onReroll,
    onCoverImageChange,
    onPlayTheater,
    isGenerating = false,
    onOpenCalendar,
}) => {
    const { theme } = useOS();
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editActivity, setEditActivity] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editEmoji, setEditEmoji] = useState('');
    const coverInputRef = useRef<HTMLInputElement>(null);

    // 长按菜单状态：记录哪一条日程被长按触发 action sheet（修改 / 删除）
    const [actionIdx, setActionIdx] = useState<number | null>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTriggeredRef = useRef(false);
    const LONG_PRESS_MS = 500;

    // 点了「还没到的时段」的播放按钮 → 在该按钮上方冒一个一闪而过的小提示
    const [lockedHintIdx, setLockedHintIdx] = useState<number | null>(null);
    const lockedHintTimerRef = useRef<number | null>(null);
    const showLockedHint = (idx: number) => {
        if (lockedHintTimerRef.current) window.clearTimeout(lockedHintTimerRef.current);
        setLockedHintIdx(idx);
        lockedHintTimerRef.current = window.setTimeout(() => setLockedHintIdx(null), 1800);
    };

    const startLongPress = (idx: number) => {
        longPressTriggeredRef.current = false;
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            setActionIdx(idx);
        }, LONG_PRESS_MS);
    };

    const cancelLongPress = () => {
        if (longPressTimerRef.current) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const tickingNow = useTickingNow();
    const wallClock = getScheduleWallClock(character, tickingNow);
    const currentIdx = schedule ? getCurrentScheduleSlotIndex(schedule.slots, character, tickingNow) : -1;
    const calendarDay = getChinaCalendarDay(wallClock);
    const scheduleDate = schedule?.date ? new Date(`${schedule.date}T12:00:00`) : wallClock;
    const scheduleDateKey = dateKey(scheduleDate);
    const stripDays = Array.from({ length: 7 }, (_, index) => addDays(scheduleDate, index - 3));

    const startEdit = (idx: number, slot: ScheduleSlot) => {
        setEditingIdx(idx);
        setEditTime(slot.startTime);
        setEditActivity(slot.activity);
        setEditDesc(slot.description || '');
        setEditEmoji(slot.emoji || '');
    };

    const saveEdit = () => {
        if (editingIdx !== null && onEdit) {
            onEdit(editingIdx, {
                startTime: editTime,
                activity: editActivity,
                description: editDesc || undefined,
                emoji: editEmoji || undefined,
            });
        }
        setEditingIdx(null);
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onCoverImageChange) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 400;
                const scale = Math.min(1, maxW / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                onCoverImageChange(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const palette = resolveScheduleCardPalette(
        theme.scheduleCardAppearance,
        theme.hue || 260,
        inheritedContentColor,
    );
    const surfaceBackground = palette.isOriginal ? palette.background : '#ffffff';
    const surfaceText = palette.isOriginal ? palette.text : '#1f2937';
    const surfaceBase = palette.isOriginal ? palette.base : '#ffffff';
    const surfaceLine = palette.isOriginal ? palette.line : '#e5e7eb';
    const timelineColor = palette.isOriginal ? 'rgba(255,255,255,0.55)' : 'rgba(31,41,55,0.48)';
    const contentColor = surfaceText;
    const accentHsl = palette.accent;
    const accentBg = palette.accentSoft;
    const cardBg = surfaceBase;
    const scheduleVars = {
        '--schedule-bg': surfaceBackground,
        '--schedule-text': surfaceText,
        '--schedule-accent': palette.accent,
        '--schedule-accent-soft': palette.accentSoft,
        '--schedule-base': surfaceBase,
        '--schedule-line': surfaceLine,
    } as React.CSSProperties;

    return (
        <div
            className="sully-schedule-root sully-schedule-card relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
                ...scheduleVars,
                background: surfaceBackground,
                color: contentColor,
                border: `1px solid ${surfaceLine}`,
            }}
        >
            <ScheduleCustomCssStyle />
            {/* Header: a compact week strip makes the date immediately scannable. */}
            <div className="sully-schedule-header relative px-4 pt-3 pb-2">
                <div className="flex items-stretch gap-1 overflow-x-auto pb-2" aria-label="一周日期">
                    {stripDays.map(day => {
                        const activeDay = dateKey(day) === scheduleDateKey;
                        return (
                            <div
                                key={dateKey(day)}
                                className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center"
                                style={activeDay ? { background: accentHsl, color: cardBg } : { color: contentColor, opacity: 0.55 }}
                            >
                                <span className="text-[9px] font-semibold">周{WEEKDAYS_CN[day.getDay()]}</span>
                                <span className="mt-0.5 text-lg font-black leading-none tabular-nums">{day.getDate()}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-end justify-between gap-3 border-t pt-2" style={{ borderColor: palette.line }}>
                    <div className="min-w-0">
                        <p className="text-lg font-black leading-tight" style={{ color: accentHsl, fontWeight: 900 }}>
                            <span style={{ fontWeight: 900, WebkitTextStroke: '0.28px currentColor' }}>{scheduleDate.getMonth() + 1}</span>月
                            <span style={{ fontWeight: 900, WebkitTextStroke: '0.28px currentColor' }}>{scheduleDate.getDate()}</span>日 周{WEEKDAYS_CN[scheduleDate.getDay()]}
                        </p>
                        {calendarDay.kind !== 'workday' && <p className="mt-0.5 text-[10px] font-semibold opacity-50">{calendarDay.label}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {!compact && onCoverImageChange && <button onClick={() => coverInputRef.current?.click()} title="更换日程封面" aria-label="更换日程封面" className="flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors" style={{ background: accentBg, borderColor: palette.line, color: accentHsl }}>✎</button>}
                        {!compact && onOpenCalendar && <button onClick={onOpenCalendar} title="查看 2026 中国日历" aria-label="查看 2026 中国日历" className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors" style={{ background: accentBg, borderColor: palette.line, color: accentHsl }}><CalendarBlank size={14}/></button>}
                        <ScheduleAppearanceButton compact />
                        {!compact && onReroll && <button onClick={onReroll} disabled={isGenerating} title="重新生成日程" aria-label="重新生成日程" className="flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-all active:scale-95 disabled:opacity-30" style={{ background: accentBg, borderColor: palette.line, color: accentHsl }}>↻</button>}
                    </div>
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

                {/* Schedule List */}
                <div className="sully-schedule-list relative min-w-0 space-y-1 px-4 pb-5 pt-2">
                    {schedule && schedule.slots.length > 0 && (
                        <span
                            aria-hidden
                            className="absolute left-7 top-9 bottom-5 w-px"
                            style={{ background: timelineColor }}
                        />
                    )}
                    {isGenerating && !schedule ? (
                        <div className="py-12 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-3"></div>
                            <p className="text-xs opacity-40">正在生成日程...</p>
                        </div>
                    ) : schedule && schedule.slots.length > 0 ? (
                        schedule.slots.map((slot, idx) => {
                            const isCurrent = idx === currentIdx;
                            const isPast = currentIdx >= 0 && idx < currentIdx;
                            const isFuture = !isPast && !isCurrent; // 还没到的时段：按钮灰着，点了给提示
                            const isEditing = editingIdx === idx;
                            const slotLocation = character ? resolveSlotLocation(character, slot) : undefined;
                            const participantNames = character
                                ? (slot.participantNpcIds || [])
                                    .map(id => findNpcById(character, id)?.name)
                                    .filter(Boolean)
                                : [];

                            if (isEditing && !compact) {
                                return (
                                    <div key={idx} className="sully-schedule-item p-3 rounded-xl border" style={{ background: accentBg, borderColor: palette.line }}>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={e => setEditTime(e.target.value)}
                                                className="bg-white/10 rounded-lg px-2 py-1 text-xs font-mono w-24 border border-white/10 focus:outline-none"
                                            />
                                            <input
                                                value={editEmoji}
                                                onChange={e => setEditEmoji(e.target.value)}
                                                placeholder="emoji"
                                                className="bg-white/10 rounded-lg px-2 py-1 text-xs w-14 border border-white/10 focus:outline-none text-center"
                                            />
                                        </div>
                                        <input
                                            value={editActivity}
                                            onChange={e => setEditActivity(e.target.value)}
                                            placeholder="活动"
                                            className="w-full bg-white/10 rounded-lg px-2 py-1 text-sm font-bold mb-1 border border-white/10 focus:outline-none"
                                        />
                                        <input
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                            placeholder="描述 (可选)"
                                            className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs border border-white/10 focus:outline-none opacity-70"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={saveEdit} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">保存</button>
                                            <button onClick={() => setEditingIdx(null)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-60">取消</button>
                                        </div>
                                    </div>
                                );
                            }

                            const editable = !compact && !!onEdit;
                            const pressHandlers = editable ? {
                                onPointerDown: (e: React.PointerEvent) => {
                                    // 只对主指针（鼠标左键 / 触屏首指）起反应，忽略右键
                                    if (e.button !== undefined && e.button !== 0) return;
                                    startLongPress(idx);
                                },
                                onPointerUp: () => cancelLongPress(),
                                onPointerLeave: () => cancelLongPress(),
                                onPointerCancel: () => cancelLongPress(),
                                onClick: () => {
                                    // 长按已触发时不再执行 tap-to-edit，避免抬手时误进入编辑
                                    if (longPressTriggeredRef.current) {
                                        longPressTriggeredRef.current = false;
                                        return;
                                    }
                                    startEdit(idx, slot);
                                },
                                // 屏蔽原生长按右键菜单，避免与自定义长按冲突
                                onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                            } : {};
                            return (
                                <div
                                    key={idx}
                                    className={`sully-schedule-item ${isCurrent ? 'sully-schedule-item-current' : ''} relative py-2 pl-10 transition-all ${editable ? 'cursor-pointer select-none' : ''}`}
                                    {...pressHandlers}
                                >
                                    {/* Left-rail timeline: the time and card share one right-hand column. */}
                                    <span
                                        className="absolute left-[0.3125rem] top-[1.35rem] z-10 h-3.5 w-3.5 rounded-full border-2"
                                        style={{
                                            borderColor: isCurrent ? accentHsl : timelineColor,
                                            background: isCurrent ? accentHsl : surfaceBase,
                                            boxShadow: `0 0 0 2px ${surfaceBase}`,
                                        }}
                                    />
                                    <div className={`${isPast ? 'opacity-40' : ''}`}>
                                        <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
                                            <div className="flex items-center gap-2">
                                                <span className="sully-schedule-time text-[15px] font-mono font-bold tabular-nums">
                                                    {slot.startTime}
                                                </span>
                                                {isCurrent && (
                                                    <span className="animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: accentHsl, color: cardBg }}>
                                                        NOW
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                        className={`relative min-w-0 rounded-2xl border px-3 py-2.5 pr-10 transition-colors ${isCurrent ? 'sully-schedule-item-current' : ''}`}
                                        style={{
                                            background: isCurrent ? accentBg : (palette.isOriginal ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)'),
                                            borderColor: isCurrent ? palette.line : 'transparent',
                                        }}
                                    >
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            {slot.emoji && <span className="text-sm flex-shrink-0">{slot.emoji}</span>}
                                            <span className="sully-schedule-activity min-w-0 truncate text-[15px] font-bold leading-tight">{slot.activity}</span>
                                        </div>
                                        {slot.description && (
                                            <p className="sully-schedule-description mt-1 break-words text-[12px] leading-[1.5] opacity-55" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{slot.description}</p>
                                        )}
                                        {(slotLocation || slot.location || participantNames.length > 0 || slot.worldEvent) && (
                                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                                {(slotLocation || slot.location) && (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: palette.line, color: accentHsl, background: accentBg }}>
                                                        <span aria-hidden="true">⌖</span>{slotLocation?.name || slot.location}
                                                    </span>
                                                )}
                                                {participantNames.map(name => (
                                                    <span key={name} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: palette.line, color: contentColor, background: 'color-mix(in srgb, var(--schedule-text) 7%, transparent)' }}>
                                                        <span aria-hidden="true">♙</span>{name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {slot.worldEvent && (
                                            <p className="mt-2 block w-full break-words text-left text-[11px] leading-[1.45] opacity-50">
                                                家园：{slot.worldEvent}
                                            </p>
                                        )}

                                            {/* 小剧场播放按钮：全程都在，已过去/正在进行的可点（▶ 生成 / ↻ 重看）；
                                        还没到的时段灰着，点了冒个「还没到这个时间哦」的小提示。 */}
                                    {!compact && onPlayTheater && (
                                        <div className="absolute right-2 top-2 flex-shrink-0">
                                            <button
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${isFuture ? 'cursor-not-allowed' : 'active:scale-90'}`}
                                                style={{
                                                    background: isFuture ? 'color-mix(in srgb, var(--schedule-text) 6%, transparent)' : (slot.theater ? accentHsl : 'color-mix(in srgb, var(--schedule-text) 12%, transparent)'),
                                                    color: isFuture ? 'color-mix(in srgb, var(--schedule-text) 28%, transparent)' : (slot.theater ? cardBg : contentColor),
                                                }}
                                                title={isFuture ? '还没到这个时间哦' : (slot.theater ? '重看小剧场' : '窥视这一刻')}
                                                onPointerDown={(e) => { e.stopPropagation(); cancelLongPress(); }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    longPressTriggeredRef.current = false;
                                                    if (isFuture) { showLockedHint(idx); return; }
                                                    onPlayTheater(idx);
                                                }}
                                            >
                                                {slot.theater && !isFuture ? '↻' : '▶'}
                                            </button>
                                            {lockedHintIdx === idx && (
                                                <div
                                                    className="absolute right-0 bottom-full mb-1.5 z-20 whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold animate-fade-in pointer-events-none"
                                                    style={{ background: 'rgba(20,16,30,0.96)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}
                                                >
                                                    还没到这个时间哦
                                                </div>
                                            )}
                                        </div>
                                    )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-xs opacity-30">暂无日程</p>
                            {onReroll && (
                                <button onClick={onReroll} className="mt-2 text-xs font-bold opacity-50 hover:opacity-80 transition-opacity" style={{ color: accentHsl }}>
                                    生成今日日程
                                </button>
                            )}
                        </div>
                    )}

                    {/* OFFLINE footer */}
                    {schedule && schedule.slots.length > 0 && (
                        <div className="pt-2 pl-3">
                            <span className="text-[10px] font-bold tracking-widest opacity-20">OFFLINE</span>
                            <p className="text-[10px] opacity-15">就寝</p>
                        </div>
                    )}
                </div>

            {/* 长按菜单：修改 / 删除 */}
            {actionIdx !== null && schedule && schedule.slots[actionIdx] && (
                <div
                    className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setActionIdx(null)}
                >
                    <div
                        className="w-full sm:w-64 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-xs text-slate-400">日程项</p>
                            <p className="text-sm font-bold text-slate-700 truncate">
                                {schedule.slots[actionIdx].startTime} · {schedule.slots[actionIdx].activity}
                            </p>
                        </div>
                        <button
                            className="w-full py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => {
                                const i = actionIdx;
                                setActionIdx(null);
                                if (i !== null && schedule) startEdit(i, schedule.slots[i]);
                            }}
                        >
                            修改
                        </button>
                        <button
                            className="w-full py-3 text-sm font-bold text-red-500 border-t border-slate-100 hover:bg-red-50 transition-colors"
                            onClick={() => {
                                const i = actionIdx;
                                setActionIdx(null);
                                if (i !== null && onDelete) onDelete(i);
                            }}
                        >
                            删除
                        </button>
                        <button
                            className="w-full py-3 text-sm text-slate-400 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                            onClick={() => setActionIdx(null)}
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ScheduleCard;
