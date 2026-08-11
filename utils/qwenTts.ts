/**
 * 阿里云 Qwen-Audio-TTS / CosyVoice WebSocket TTS。
 *
 * GitHub Pages 的浏览器 WebSocket 不能自定义 Authorization 请求头，
 * 因此默认连接项目 Worker 的 /qwen-tts/ws 中转；中转只把握手鉴权转发到阿里云，
 * 不保存 API Key。也支持在设置里填入自建 WebSocket 中转地址。
 */
import type { APIConfig, CharacterProfile } from '../types';
import type { TtsResult } from './minimaxTts';
import { getProxyWorkerUrl } from './proxyWorker';
import { getCachedTts, hashTtsParams, saveCachedTts } from './ttsCache';

const DEFAULT_MODEL = 'qwen-audio-3.0-tts-flash';
const DEFAULT_VOICE = 'longanlingxi';
const DEFAULT_FORMAT = 'mp3' as const;
const DEFAULT_REGION = 'beijing' as const;
const WS_TIMEOUT_MS = 45_000;

export const QWEN_VOICE_ACTING_GUIDE = '语音台词请直接输出自然、口语化的正文，不要输出 [emotion]、<#...#> 或其它语音控制标记。';

const normalizeApiKey = (value: string | undefined): string => (value || '').trim();

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const cleanTextForQwen = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*[语語]音[^>]*>([\s\S]*?)<\/[语語]音>/g, '$1')
    .replace(/\[\[[\s\S]*?\]\]/g, '')
    .replace(/%%BILINGUAL%%[\s\S]*/i, '')
    .replace(/<#\s*[\d.]+\s*#>/g, '')
    .replace(/\[[^\[\]]{1,48}\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const resolveEndpoint = (config: APIConfig): string => {
  const custom = (config.qwenTtsEndpoint || '').trim();
  if (custom) {
    return custom.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  }
  const workspace = encodeURIComponent((config.qwenTtsWorkspaceId || '').trim());
  const region = config.qwenTtsRegion === 'singapore' ? 'ap-southeast-1' : 'cn-beijing';
  const worker = getProxyWorkerUrl().replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${worker}/qwen-tts/ws?workspace=${workspace}&region=${region}`;
};

const formatMime = (format: string): string => {
  if (format === 'wav') return 'audio/wav';
  if (format === 'pcm') return 'audio/pcm';
  if (format === 'opus') return 'audio/ogg; codecs=opus';
  return 'audio/mpeg';
};

const joinChunks = async (chunks: Blob[], format: string, sampleRate: number): Promise<Blob> => {
  if (format !== 'pcm') return new Blob(chunks, { type: formatMime(format) });
  const buffers = await Promise.all(chunks.map(chunk => chunk.arrayBuffer()));
  const pcm = new Uint8Array(buffers.reduce((sum, item) => sum + item.byteLength, 0));
  let offset = 0;
  buffers.forEach(buffer => { pcm.set(new Uint8Array(buffer), offset); offset += buffer.byteLength; });
  const wav = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(wav);
  const bytes = new Uint8Array(wav);
  const writeAscii = (at: number, value: string) => [...value].forEach((char, index) => view.setUint8(at + index, char.charCodeAt(0)));
  writeAscii(0, 'RIFF'); view.setUint32(4, 36 + pcm.byteLength, true); writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeAscii(36, 'data'); view.setUint32(40, pcm.byteLength, true); bytes.set(pcm, 44);
  return new Blob([wav], { type: 'audio/wav' });
};

const synthesizeQwenText = async (text: string, config: APIConfig, voiceOverride?: string): Promise<TtsResult> => {
  const apiKey = normalizeApiKey(config.qwenTtsApiKey);
  const workspace = (config.qwenTtsWorkspaceId || '').trim();
  if (!apiKey) throw new Error('缺少阿里云 Qwen TTS API Key');
  if (!workspace) throw new Error('缺少阿里云 Workspace ID');
  const spoken = cleanTextForQwen(text);
  if (!spoken) throw new Error('Qwen TTS 文本为空');
  const model = (config.qwenTtsModel || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const voice = (voiceOverride || config.qwenTtsVoice || DEFAULT_VOICE).trim() || DEFAULT_VOICE;
  const format = config.qwenTtsAudioFormat || DEFAULT_FORMAT;
  const sampleRate = 22050;
  const cacheKey = hashTtsParams({ kind: 'qwen-websocket-tts', spoken, model, voice, format, sampleRate, workspace, region: config.qwenTtsRegion || DEFAULT_REGION });
  const cached = await getCachedTts(cacheKey);
  if (cached) return { url: URL.createObjectURL(cached), blob: cached };

  const endpoint = resolveEndpoint(config);
  const url = new URL(endpoint);
  const authProtocol = `sully-qwen-auth.${toBase64Url(apiKey)}`;
  const socket = new WebSocket(url.toString(), ['sully-qwen-v1', authProtocol]);
  socket.binaryType = 'arraybuffer';
  const taskId = crypto.randomUUID();
  const audioChunks: Blob[] = [];
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveResult: (result: TtsResult) => void = () => undefined;
  let rejectResult: (error: Error) => void = () => undefined;
  const resultPromise = new Promise<TtsResult>((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
  const fail = (error: unknown) => {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    try { socket.close(); } catch { /* ignore */ }
    rejectResult(error instanceof Error ? error : new Error(String(error)));
  };
  const finish = async () => {
    if (settled) return;
    if (!audioChunks.length) return fail(new Error('Qwen TTS 未返回音频数据'));
    settled = true;
    if (timer) clearTimeout(timer);
    try { socket.close(); } catch { /* ignore */ }
    const blob = await joinChunks(audioChunks, format, sampleRate);
    if (!blob.size) return rejectResult(new Error('Qwen TTS 返回空音频'));
    saveCachedTts(cacheKey, blob).catch(() => { /* ignore */ });
    resolveResult({ url: URL.createObjectURL(blob), blob });
  };
  const send = (payload: unknown) => socket.send(JSON.stringify(payload));
  timer = setTimeout(() => fail(new Error('Qwen TTS 连接超时')), WS_TIMEOUT_MS);
  socket.onopen = () => {
    send({ header: { action: 'run-task', task_id: taskId, streaming: 'duplex' }, payload: {
      task_group: 'audio', task: 'tts', function: 'SpeechSynthesizer', model,
      parameters: { text_type: 'PlainText', voice, format, sample_rate: sampleRate, volume: 50, rate: 1.0, pitch: 1.0, enable_ssml: false },
      input: {},
    }});
  };
  socket.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      audioChunks.push(event.data instanceof Blob ? event.data : new Blob([event.data], { type: formatMime(format) }));
      return;
    }
    try {
      const message = JSON.parse(event.data);
      const eventName = message?.header?.event;
      if (eventName === 'task-started') {
        send({ header: { action: 'continue-task', task_id: taskId, streaming: 'duplex' }, payload: { input: { text: spoken } } });
        send({ header: { action: 'finish-task', task_id: taskId, streaming: 'duplex' }, payload: { input: {} } });
      } else if (eventName === 'task-failed') {
        fail(new Error(message?.header?.error_message || message?.header?.error_code || 'Qwen TTS 任务失败'));
      } else if (eventName === 'task-finished') {
        void finish();
      }
    } catch (error) {
      fail(new Error(`Qwen TTS 响应解析失败：${String(error)}`));
    }
  };
  socket.onerror = () => fail(new Error('Qwen TTS WebSocket 连接失败，请检查 Worker、Workspace ID 和 API Key'));
  socket.onclose = () => { if (!settled) fail(new Error('Qwen TTS WebSocket 已断开')); };
  return resultPromise;
};

export async function synthesizeSpeechQwenDetailed(
  text: string,
  char: CharacterProfile,
  apiConfig: APIConfig,
): Promise<TtsResult> {
  return synthesizeQwenText(text, apiConfig, char.voiceProfile?.qwenVoice);
}

export async function synthesizeSpeechQwen(text: string, char: CharacterProfile, apiConfig: APIConfig): Promise<string> {
  const { url } = await synthesizeSpeechQwenDetailed(text, char, apiConfig);
  return url;
}

export async function testQwenTtsConnection(apiConfig: APIConfig): Promise<void> {
  const result = await synthesizeQwenText('连接测试成功。', apiConfig);
  try { URL.revokeObjectURL(result.url); } catch { /* ignore */ }
}
