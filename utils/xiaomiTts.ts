/** 小米 MiMo TTS：官方 OpenAI 兼容接口，经项目 Worker 转发以适配静态网页与手机浏览器。 */
import type { APIConfig, CharacterProfile } from '../types';
import type { TtsResult } from './minimaxTts';
import { getCachedTts, hashTtsParams, saveCachedTts } from './ttsCache';
import { getProxyWorkerUrl } from './proxyWorker';

const DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1';
const DEFAULT_MODEL = 'mimo-v2.5-tts';
const DEFAULT_VOICE = '冰糖';
export const TTS_TEST_TEXT = '你好，当前正在测试是否成功，你听到此语音，代表测试成功。';

export type XiaomiTtsVoiceOption = { id: string; name: string; description: string };
export const XIAOMI_TTS_MODELS = [
  { id: 'mimo-v2.5-tts', name: 'MiMo V2.5 TTS', description: '内置音色，适合日常朗读' },
  { id: 'mimo-v2.5-tts-voicedesign', name: 'MiMo V2.5 音色设计', description: '用文字描述想要的声音' },
];
export const XIAOMI_TTS_VOICES: XiaomiTtsVoiceOption[] = [
  { id: '冰糖', name: '冰糖', description: '活泼可爱女声 · 中文' },
  { id: '茉莉', name: '茉莉', description: '温柔细腻女声 · 中文' },
  { id: '苏打', name: '苏打', description: '清新自然男声 · 中文' },
  { id: '白桦', name: '白桦', description: '知性优雅男声 · 中文' },
  { id: 'Mia', name: 'Mia', description: '英文女声' },
  { id: 'Chloe', name: 'Chloe', description: '英文女声' },
  { id: 'Milo', name: 'Milo', description: '英文男声' },
  { id: 'Dean', name: 'Dean', description: '英文男声' },
];

export const XIAOMI_VOICE_ACTING_GUIDE = '语音台词请直接写自然、口语化的正文。不要输出 MiniMax 的 <#...#> 停顿标记、情绪属性或方括号舞台指示，使用标点和换行控制节奏。';

const cleanText = (raw: string): string => (raw || '')
  .replace(/<[语語]音[^>]*>([\s\S]*?)<\/[语語]音>/g, '$1')
  .replace(/\[\[[\s\S]*?\]\]/g, '')
  .replace(/%%BILINGUAL%%[\s\S]*/i, '')
  .replace(/<#\s*[\d.]+\s*#>/g, '')
  .replace(/\[[^\[\]]{1,48}\]/g, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

const decodeBase64 = (raw: string): Uint8Array => {
  const binary = atob(raw.replace(/^data:[^,]+,/, '').replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const buildConfig = (config: APIConfig, voiceOverride?: string) => ({
  key: (config.xiaomiTtsApiKey || '').trim(),
  baseUrl: (config.xiaomiTtsBaseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, ''),
  model: (config.xiaomiTtsModel || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
  voice: (voiceOverride || config.xiaomiTtsVoice || DEFAULT_VOICE).trim() || DEFAULT_VOICE,
});

const synthesizeXiaomiText = async (text: string, config: APIConfig, voiceOverride?: string): Promise<TtsResult> => {
  const spoken = cleanText(text);
  if (!spoken) throw new Error('小米 TTS 文本为空');
  const options = buildConfig(config, voiceOverride);
  if (!options.key) throw new Error('缺少小米 MiMo API Key');
  const cacheKey = hashTtsParams({ kind: 'xiaomi-mimo-tts', spoken, model: options.model, voice: options.voice, baseUrl: options.baseUrl });
  const cached = await getCachedTts(cacheKey);
  if (cached) return { url: URL.createObjectURL(cached), blob: cached };
  const workerUrl = `${getProxyWorkerUrl()}/xiaomi-tts`;
  // 公共 Worker 的旧版 CORS 白名单不接受自定义地址请求头。官方默认地址无需传该头，
  // 可避免手机浏览器在预检阶段直接报 Failed to fetch。
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${options.key}` };
  if (options.baseUrl !== DEFAULT_BASE_URL) headers['X-Xiaomi-TTS-Base-Url'] = options.baseUrl;
  let response: Response;
  try {
    response = await fetch(workerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: options.model, messages: [{ role: 'assistant', content: spoken }], audio: { format: 'mp3', voice: options.voice }, stream: false }),
    });
  } catch (error: any) {
    const reason = error?.message || '网络请求被浏览器拦截';
    throw new Error(`无法连接小米 TTS 中转：${reason}。默认官方地址已无需额外请求头；若使用自定义地址，请确认你的 Worker 已更新并允许 X-Xiaomi-TTS-Base-Url。`);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`小米 MiMo TTS 调用失败（HTTP ${response.status}）${detail ? `：${detail.slice(0, 180)}` : ''}`);
  }
  const contentType = response.headers.get('content-type') || '';
  let blob: Blob;
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const encoded = data?.choices?.[0]?.message?.audio?.data || data?.data?.audio?.data || data?.audio?.data;
    if (!encoded || typeof encoded !== 'string') throw new Error('小米 MiMo TTS 没有返回音频数据');
    const bytes = decodeBase64(encoded);
    // Copy into an ordinary ArrayBuffer. The result of a typed-array slice can be
    // typed as SharedArrayBuffer too, but Blob only accepts ArrayBuffer here.
    const audioBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(audioBuffer).set(bytes);
    blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  } else {
    blob = await response.blob();
  }
  if (!blob.size) throw new Error('小米 MiMo TTS 返回了空音频');
  void saveCachedTts(cacheKey, blob);
  return { url: URL.createObjectURL(blob), blob };
};

export async function synthesizeSpeechXiaomiDetailed(text: string, char: CharacterProfile, apiConfig: APIConfig): Promise<TtsResult> {
  return synthesizeXiaomiText(text, apiConfig, char.voiceProfile?.xiaomiVoice);
}

export async function testXiaomiTtsConnection(apiConfig: APIConfig): Promise<void> {
  const result = await synthesizeXiaomiText(TTS_TEST_TEXT, apiConfig);
  URL.revokeObjectURL(result.url);
}

export async function previewXiaomiTtsVoice(apiConfig: APIConfig, voice: string): Promise<TtsResult> {
  return synthesizeXiaomiText(TTS_TEST_TEXT, apiConfig, voice);
}
