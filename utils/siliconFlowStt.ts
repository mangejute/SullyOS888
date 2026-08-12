import type { SpeechRecognitionConfig } from '../types';

export const DEFAULT_SILICONFLOW_STT_URL = 'https://api.siliconflow.cn/v1';
export const DEFAULT_SILICONFLOW_STT_MODEL = 'FunAudioLLM/SenseVoiceSmall';

// 不使用 \u{...}，兼容旧 WebView 的正则解析；只匹配句末的 emoji / SenseVoice 标签。
const EMOTION_TAIL_RE = /(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uFE0F\u200D]|<\|[^|]+\|>)+$/;

/** SenseVoice 可能把情绪表情追加在句末；只清理句末，避免误删正文中的 emoji。 */
export const cleanSenseVoiceEmotionEmoji = (text: string): string => text.replace(EMOTION_TAIL_RE, '').trim();

const parseError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    return String(body?.error?.message || body?.message || `HTTP ${response.status}`);
  } catch {
    return `HTTP ${response.status}`;
  }
};

export async function transcribeSiliconFlowAudio(
  audio: Blob,
  config: Pick<SpeechRecognitionConfig, 'baseUrl' | 'apiKey' | 'model' | 'language' | 'cleanEmotionEmoji'>,
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  if (!baseUrl || !config.apiKey.trim()) throw new Error('请先在系统设置里填写硅基流动语音识别 Key');
  if (!config.model.trim()) throw new Error('请先选择语音识别模型');
  const form = new FormData();
  form.append('file', audio, audio.type.includes('wav') ? 'speech.wav' : 'speech.webm');
  form.append('model', config.model.trim());
  if (config.language && config.language !== 'auto') form.append('language', config.language);
  form.append('response_format', 'json');
  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const payload = await response.json();
  const text = String(payload?.text || payload?.data?.text || '').trim();
  if (!text) throw new Error('语音识别没有返回文字');
  return config.cleanEmotionEmoji ? cleanSenseVoiceEmotionEmoji(text) : text;
}

export async function testSiliconFlowSttConnection(config: Pick<SpeechRecognitionConfig, 'baseUrl' | 'apiKey' | 'model'>): Promise<void> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  if (!baseUrl || !config.apiKey.trim() || !config.model.trim()) throw new Error('请填写连接、Key 和模型');
  const response = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  const payload = await response.json();
  const models = Array.isArray(payload?.data) ? payload.data.map((item: any) => String(item?.id || '')).filter(Boolean) : [];
  if (models.length && !models.includes(config.model)) {
    throw new Error(`连接成功，但模型列表中没有 ${config.model}`);
  }
}
