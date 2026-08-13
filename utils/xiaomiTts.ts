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

const synthesizeXiaomiText = async (text: string, config: APIConfig, voiceOverride?: string, temporary = false): Promise<TtsResult> => {
  const spoken = cleanText(text);
  if (!spoken) throw new Error('小米 TTS 文本为空');
  const options = buildConfig(config, voiceOverride);
  if (!options.key) throw new Error('缺少小米 MiMo API Key');
  const cacheKey = hashTtsParams({ kind: 'xiaomi-mimo-tts', spoken, model: options.model, voice: options.voice, baseUrl: options.baseUrl });
  // 书库的整章预生成只在当前阅读器会话中保留，不写入长期语音缓存。
  if (!temporary) {
    const cached = await getCachedTts(cacheKey);
    if (cached) return { url: URL.createObjectURL(cached), blob: cached };
  }
  // 小米官方接口已正确开放浏览器 CORS。默认直连，避免公共 Worker 的旧 /xiaomi-tts
  // 路由误把 POST 当成 GET 而返回 405；自定义兼容地址仍可经用户自己的 Worker 转发。
  const isOfficial = options.baseUrl === DEFAULT_BASE_URL;
  const requestUrl = isOfficial ? `${options.baseUrl}/chat/completions` : `${getProxyWorkerUrl()}/xiaomi-tts`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${options.key}` };
  if (!isOfficial) headers['X-Xiaomi-TTS-Base-Url'] = options.baseUrl;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: options.model, messages: [{ role: 'assistant', content: spoken }], audio: { format: 'mp3', voice: options.voice }, stream: false }),
    });
  } catch (error: any) {
    const reason = error?.message || '网络请求被浏览器拦截';
    throw new Error(`无法连接小米 MiMo TTS：${reason}${isOfficial ? '。请检查网络是否能访问 api.xiaomimimo.com。' : '。自定义地址需要已更新的 Worker 并允许 X-Xiaomi-TTS-Base-Url。'}`);
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
  if (!temporary) void saveCachedTts(cacheKey, blob);
  return { url: URL.createObjectURL(blob), blob };
};

export async function synthesizeSpeechXiaomiDetailed(text: string, char: CharacterProfile, apiConfig: APIConfig): Promise<TtsResult> {
  return synthesizeXiaomiText(text, apiConfig, char.voiceProfile?.xiaomiVoice);
}

/** 书库等场景的内置小米音色朗读，不读取角色档案中的音色。 */
export async function synthesizeSpeechXiaomiWithVoiceDetailed(text: string, apiConfig: APIConfig, voice: string): Promise<TtsResult> {
  return synthesizeXiaomiText(text, apiConfig, voice);
}

/** 书库整章朗读的临时片段：关闭阅读器即释放，不占用持久缓存。 */
export async function synthesizeSpeechXiaomiTemporaryWithVoiceDetailed(text: string, apiConfig: APIConfig, voice: string): Promise<TtsResult> {
  return synthesizeXiaomiText(text, apiConfig, voice, true);
}

export async function testXiaomiTtsConnection(apiConfig: APIConfig): Promise<void> {
  const result = await synthesizeXiaomiText(TTS_TEST_TEXT, apiConfig);
  URL.revokeObjectURL(result.url);
}

export async function previewXiaomiTtsVoice(apiConfig: APIConfig, voice: string): Promise<TtsResult> {
  return synthesizeXiaomiText(TTS_TEST_TEXT, apiConfig, voice);
}
