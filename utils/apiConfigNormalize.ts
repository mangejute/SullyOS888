import type { APIConfig, ApiPreset, SpeechRecognitionConfig } from '../types';

// 语音识别是后加进总 API 配置的字段。独立保存一份，避免旧版配置迁移或其它 API
// 保存操作写入旧结构时，把用户已经选择的识别服务悄悄退回浏览器默认值。
export const SPEECH_RECOGNITION_STORAGE_KEY = 'os_speech_recognition_config';
// MiniMax 的三项凭据单独留一份，避免旧版本或设置页的其它保存动作覆盖它们。
export const MINIMAX_CONFIG_STORAGE_KEY = 'os_minimax_config_v1';

// Clipboard contents can carry zero-width characters that String.trim() does not
// remove. They are never valid at the edges of an API URL, token, or model id.
const EDGE_INVISIBLE_CHARS = /^[\s\u200B-\u200D\u2060\uFEFF]+|[\s\u200B-\u200D\u2060\uFEFF]+$/g;

const cleanEdgeCharacters = (value: unknown): string =>
  String(value ?? '').replace(EDGE_INVISIBLE_CHARS, '');

export const normalizeApiBaseUrl = (value: unknown): string =>
  cleanEdgeCharacters(value).replace(/\/+$/, '');

export const normalizeApiCredential = (value: unknown): string =>
  cleanEdgeCharacters(value);

export const normalizeApiModel = (value: unknown): string =>
  cleanEdgeCharacters(value);

export function normalizeSpeechRecognitionConfig(value: unknown): SpeechRecognitionConfig | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const config = value as Partial<SpeechRecognitionConfig>;
  return {
    provider: config.provider === 'siliconflow' ? 'siliconflow' : 'browser',
    baseUrl: normalizeApiBaseUrl(config.baseUrl),
    apiKey: normalizeApiCredential(config.apiKey),
    model: normalizeApiModel(config.model),
    language: cleanEdgeCharacters(config.language || 'zh-CN') || 'zh-CN',
    cleanEmotionEmoji: config.cleanEmotionEmoji !== false,
  };
}

/** Read the separate durable STT record. Invalid / incomplete old data is ignored safely. */
export function loadStoredSpeechRecognitionConfig(): SpeechRecognitionConfig | undefined {
  try {
    const raw = localStorage.getItem(SPEECH_RECOGNITION_STORAGE_KEY);
    return raw ? normalizeSpeechRecognitionConfig(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

/** Keep the STT selection resilient when the surrounding API config gains new fields. */
export function saveStoredSpeechRecognitionConfig(config: SpeechRecognitionConfig | undefined): void {
  const normalized = normalizeSpeechRecognitionConfig(config);
  if (!normalized) return;
  try {
    localStorage.setItem(SPEECH_RECOGNITION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The main os_api_config and its IndexedDB mirror remain the fallback.
  }
}

export function normalizeApiConfig(config: APIConfig): APIConfig {
  const visionApi = config.visionApi;
  const speechRecognition = normalizeSpeechRecognitionConfig(config.speechRecognition);
  return {
    ...config,
    baseUrl: normalizeApiBaseUrl(config.baseUrl),
    apiKey: normalizeApiCredential(config.apiKey),
    model: normalizeApiModel(config.model),
    ...(visionApi ? {
      visionApi: {
        enabled: visionApi.enabled === true,
        baseUrl: normalizeApiBaseUrl(visionApi.baseUrl),
        apiKey: normalizeApiCredential(visionApi.apiKey),
        model: normalizeApiModel(visionApi.model),
      },
    } : {}),
    ...(speechRecognition ? { speechRecognition } : {}),
  };
}

export function normalizeApiPreset(preset: ApiPreset): ApiPreset {
  return {
    ...preset,
    name: String(preset.name ?? '').trim(),
    config: normalizeApiConfig(preset.config),
  };
}
