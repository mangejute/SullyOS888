/**
 * Unified speech-to-text (STT) — used by the Call app for voice input.
 *
 * Hybrid strategy (A+B):
 *   - Web platform  → native `webkitSpeechRecognition` / `SpeechRecognition`
 *                     (zero dependency, streams interim results).
 *   - Capacitor app → `@capacitor-community/speech-recognition` (on-device capable),
 *                     loaded via dynamic import so it never enters the web bundle.
 *
 * The user speaks Chinese to the character by default, so the default recognition
 * language is zh-CN regardless of the character's TTS output language.
 */
import { Capacitor } from '@capacitor/core';
import { transcribeSiliconFlowAudio } from './siliconFlowStt';
import type { SpeechRecognitionConfig } from '../types';

export interface SttCallbacks {
  /** Fired repeatedly with the best-so-far transcript (interim + final). */
  onPartial?: (text: string) => void;
  /** Fired once with the final transcript when recognition settles. */
  onFinal?: (text: string) => void;
  /** Fired on any recognition error (already turned into a friendly message). */
  onError?: (message: string) => void;
  /** Fired when the session ends for any reason (success, error, or stop). */
  onEnd?: () => void;
}

export interface SttSession {
  /** Stop listening. Safe to call multiple times. */
  stop: () => void;
}

export interface SttStartOptions {
  provider?: 'browser' | 'siliconflow';
  siliconflow?: SpeechRecognitionConfig;
  /** 远程识别模式下，检测到这段时间没有声音就提交录音。 */
  silenceMs?: number;
}

const isNative = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const getWebCtor = (): any =>
  (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

/** Whether voice input is usable in the current environment. */
export const isSttSupported = (): boolean => {
  if (isNative()) return true; // plugin present; actual availability resolved at start()
  return !!getWebCtor() || (typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
};

const friendlyError = (raw: string): string => {
  if (/not-allowed|denied|permission/i.test(raw)) return '麦克风权限被拒绝，去系统设置里允许一下';
  if (/no-speech/i.test(raw)) return '没听清，再说一次？';
  if (/network/i.test(raw)) return '语音识别服务连不上，检查下网络';
  if (/aborted/i.test(raw)) return '';
  return raw || '语音识别出错了';
};

// 看门狗时长：开麦后这么久还没有任何音频/语音/结果信号，就判定这个浏览器的
// 在线识别后端不可用（国内套壳浏览器常见：有 webkitSpeechRecognition 对象、
// 麦克风也亮，但永远不返回结果、也不报错）。
const STT_WATCHDOG_MS = 7000;

const startWeb = (lang: string, cb: SttCallbacks): SttSession => {
  const Ctor = getWebCtor();
  if (!Ctor) throw new Error('当前浏览器不支持语音识别');
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = true;
  // 持续聆听到用户手动停（贴合 UI 的「点麦克风结束」），别一遇停顿就自己断。
  rec.continuous = true;
  rec.maxAlternatives = 1;
  let finalText = '';
  let ended = false;
  // 是否收到过识别器「活着」的信号（音频开始 / 检测到说话 / 出结果）。
  let gotSignal = false;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  const clearWatchdog = () => { if (watchdog) { clearTimeout(watchdog); watchdog = null; } };
  const markAlive = () => { gotSignal = true; clearWatchdog(); };

  rec.onaudiostart = markAlive;
  rec.onspeechstart = markAlive;
  rec.onresult = (e: any) => {
    markAlive();
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    cb.onPartial?.((finalText + interim).trim());
  };
  rec.onerror = (e: any) => {
    const msg = friendlyError(String(e?.error || ''));
    if (msg) cb.onError?.(msg);
  };
  rec.onend = () => {
    if (ended) return;
    ended = true;
    clearWatchdog();
    const f = finalText.trim();
    if (f) cb.onFinal?.(f);
    cb.onEnd?.();
  };
  rec.start();
  // 若在看门狗时限内识别器毫无生命迹象，多半是这个浏览器没有可用的在线识别
  // 服务（套壳浏览器/缺 Google 服务的 WebView）。明确告诉用户，别让麦克风空亮。
  watchdog = setTimeout(() => {
    if (gotSignal || ended) return;
    cb.onError?.('这个浏览器识别不到语音，多半不支持在线语音识别（国内套壳浏览器常见）。换 Chrome / Edge，或者直接打字吧。');
    try { rec.stop(); } catch { /* ignore */ }
  }, STT_WATCHDOG_MS);
  return { stop: () => { clearWatchdog(); try { rec.stop(); } catch { /* ignore */ } } };
};

const startNative = async (lang: string, cb: SttCallbacks): Promise<SttSession> => {
  const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

  const perm = await SpeechRecognition.checkPermissions().catch(() => ({ speechRecognition: 'prompt' as const }));
  if (perm.speechRecognition !== 'granted') {
    const req = await SpeechRecognition.requestPermissions();
    if (req.speechRecognition !== 'granted') throw new Error('麦克风权限被拒绝');
  }

  let lastPartial = '';
  let ended = false;
  const handle = await SpeechRecognition.addListener('partialResults', (data: any) => {
    const m = data?.matches?.[0];
    if (m) { lastPartial = m; cb.onPartial?.(m); }
  });

  const finish = (finalText: string, errMsg?: string) => {
    if (ended) return;
    ended = true;
    handle.remove();
    if (errMsg) cb.onError?.(friendlyError(errMsg));
    else if (finalText) cb.onFinal?.(finalText);
    cb.onEnd?.();
  };

  // With partialResults: true, start() resolves once recognition settles.
  SpeechRecognition.start({ language: lang, partialResults: true, popup: false, maxResults: 1 })
    .then((res: any) => finish((res?.matches?.[0] || lastPartial || '').trim()))
    .catch((e: any) => finish('', e?.message || 'native-error'));

  return { stop: () => { SpeechRecognition.stop().catch(() => { /* ignore */ }); } };
};

/**
 * Start a speech-to-text session. Resolves to a handle you can `stop()`.
 * All transcripts arrive via the callbacks.
 */
export const startStt = async (lang: string, cb: SttCallbacks, options: SttStartOptions = {}): Promise<SttSession> => {
  return startSttWithOptions(lang, cb, options);
};

const startSiliconFlow = async (lang: string, cb: SttCallbacks, options: SttStartOptions): Promise<SttSession> => {
  const config = options.siliconflow;
  if (!config) throw new Error('未找到硅基流动语音识别配置');
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('当前环境不支持录音，请换用系统网页识别或 Chrome / Edge');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  const silenceMs = Math.max(800, options.silenceMs || 1800);
  let stopped = false;
  let speechStarted = false;
  let lastVoiceAt = Date.now();
  let monitor: ReturnType<typeof setInterval> | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let data: Uint8Array | null = null;
  const cleanup = () => {
    if (monitor) clearInterval(monitor);
    monitor = null;
    stream.getTracks().forEach(track => track.stop());
    if (audioContext) void audioContext.close().catch(() => undefined);
    audioContext = null;
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (recorder.state !== 'inactive') recorder.stop();
    else cleanup();
  };
  recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
  recorder.onerror = () => { cleanup(); cb.onError?.('录音失败，请检查麦克风权限'); cb.onEnd?.(); };
  recorder.onstop = async () => {
    cleanup();
    if (!chunks.length) { cb.onEnd?.(); return; }
    try {
      const text = await transcribeSiliconFlowAudio(new Blob(chunks, { type: mimeType }), { ...config, language: lang });
      if (text) cb.onFinal?.(text);
    } catch (error: any) {
      cb.onError?.(error?.message || '硅基流动语音识别失败');
    } finally {
      cb.onEnd?.();
    }
  };
  try {
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    data = new Uint8Array(analyser.fftSize);
    source.connect(analyser);
    monitor = setInterval(() => {
      if (stopped || !analyser || !data) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) { const normalized = (value - 128) / 128; sum += normalized * normalized; }
      const rms = Math.sqrt(sum / data.length);
      if (rms > 0.025) { speechStarted = true; lastVoiceAt = Date.now(); }
      else if (speechStarted && Date.now() - lastVoiceAt >= silenceMs) stop();
    }, 100);
  } catch {
    // 没有 AudioContext 时仍允许手动点击麦克风结束录音。
  }
  recorder.start(250);
  return { stop };
};

export const startSttWithOptions = async (lang: string, cb: SttCallbacks, options: SttStartOptions = {}): Promise<SttSession> => {
  if (options.provider === 'siliconflow') return startSiliconFlow(lang, cb, options);
  const language = lang || 'zh-CN';
  if (isNative()) return startNative(language, cb);
  return startWeb(language, cb);
};
