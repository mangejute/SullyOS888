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

export type QwenTtsModelOption = { id: string; name: string; description: string };
export type QwenTtsVoiceOption = { id: string; name: string; description: string; modelIds: string[] };

// 阿里云文档没有提供可直接从浏览器拉取的稳定「音色列表」接口，因此维护官方系统音色
// 目录；选择模型后只展示该模型可用的音色。复刻/自定义音色仍可在设置里手动填写。
export const QWEN_TTS_MODELS: QwenTtsModelOption[] = [
  { id: 'qwen-audio-3.0-tts-flash', name: 'Qwen Audio TTS Flash', description: '速度快，适合聊天和日常陪伴' },
  { id: 'qwen-audio-3.0-tts-plus', name: 'Qwen Audio TTS Plus', description: '旗舰音色，表现更细腻' },
  { id: 'cosyvoice-v3-flash', name: 'CosyVoice V3 Flash', description: '中文、方言与多语种音色丰富' },
  { id: 'cosyvoice-v3-plus', name: 'CosyVoice V3 Plus', description: '高质量社交陪伴音色' },
  { id: 'cosyvoice-v2', name: 'CosyVoice V2', description: '兼容型号' },
];

export const QWEN_TTS_VOICES: QwenTtsVoiceOption[] = [
  { id: 'longanlingxi', name: '龙安灵希', description: '可爱甜美女声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longanfengyue', name: '龙安风悦', description: '自然亲切女声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longanyuanfei', name: '龙安元妃', description: '高傲妃子音 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longanxiaoxin', name: '龙安小昕', description: '亲切活泼女声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longanhuan_v3.6', name: '龙安欢', description: '欢脱元气女声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longjielidou_v3.6', name: '龙杰力豆', description: '天真男童 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longpaopao_v3.6', name: '龙泡泡', description: '软糯女童 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longhuohuo_v3.6', name: '龙火火', description: '顽皮少年音 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longchuanshu_v3.6', name: '龙川叔', description: '川普大叔音 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'loongmary', name: 'loongmary', description: '温暖英音女声 · 英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'loongjohn', name: 'loongJohn', description: '沉稳亲切男声 · 英文', modelIds: ['qwen-audio-3.0-tts-flash'] },
  { id: 'longanlingxin', name: '龙安灵心', description: '知心温暖女声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-plus'] },
  { id: 'longanlufeng', name: '龙安鲁风', description: '明亮开朗男声 · 中文/英文', modelIds: ['qwen-audio-3.0-tts-plus'] },
  { id: 'longanyang', name: '龙安洋', description: '阳光大男孩 · 中文/英文', modelIds: ['cosyvoice-v3-flash', 'cosyvoice-v3-plus'] },
  { id: 'longanhuan_v3', name: '龙安欢（V3）', description: '欢脱元气女声 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longhuhu_v3', name: '龙呼呼', description: '天真烂漫女童 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longpaopao_v3', name: '龙泡泡（V3）', description: '飞天泡泡女童 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longjielidou_v3', name: '龙杰力豆（V3）', description: '阳光顽皮男童 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longanwen_v3', name: '龙安温', description: '优雅知性女声 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longanlang_v3', name: '龙安朗', description: '清爽利落男声 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longhua_v3', name: '龙华', description: '元气甜美女声 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longwan_v3', name: '龙婉', description: '细腻柔声女声 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longdaiyu_v3', name: '龙黛玉', description: '娇柔才女音 · 中文/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longanyue_v3', name: '龙安粤', description: '欢脱粤语男声 · 粤语/英文', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'loongriko_v3', name: 'Riko', description: '二次元日语女声 · 日语', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'loongtomoya_v3', name: 'loongtomoya', description: '日语男声 · 日语', modelIds: ['cosyvoice-v3-flash'] },
  { id: 'longanhuan', name: '龙安欢', description: '欢脱元气女声 · 中文/英文', modelIds: ['cosyvoice-v3-plus'] },
  { id: 'longyingxiao', name: '龙应笑', description: '清甜女声 · 中文/英文', modelIds: ['cosyvoice-v2'] },
  { id: 'longjiqi', name: '龙机器', description: '呆萌机器人 · 中文/英文', modelIds: ['cosyvoice-v2'] },
];

export const getQwenTtsVoices = (model: string): QwenTtsVoiceOption[] =>
  QWEN_TTS_VOICES.filter(voice => voice.modelIds.includes(model));

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
  const result = await synthesizeQwenText('你好，当前正在测试是否成功，你听到此语音，代表测试成功。', apiConfig);
  try { URL.revokeObjectURL(result.url); } catch { /* ignore */ }
}

/** 设置页试听：使用当前模型、指定音色真实合成一句，不会改动聊天记录。 */
export async function previewQwenTtsVoice(apiConfig: APIConfig, voice: string): Promise<TtsResult> {
  return synthesizeQwenText('你好，当前正在测试是否成功，你听到此语音，代表测试成功。', apiConfig, voice);
}
