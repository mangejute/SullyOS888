import { describe, expect, it } from 'vitest';
import {
  loadStoredOtherApiConfig,
  loadStoredSpeechRecognitionConfig,
  normalizeApiBaseUrl,
  normalizeApiConfig,
  normalizeApiCredential,
  OTHER_API_CONFIG_STORAGE_KEY,
  saveStoredOtherApiConfig,
  saveStoredSpeechRecognitionConfig,
  SPEECH_RECOGNITION_STORAGE_KEY,
} from './apiConfigNormalize';

describe('API config normalization', () => {
  it('removes pasted whitespace and invisible edge characters from credentials', () => {
    expect(normalizeApiCredential(' \n\u200Bsk-example\u2060\r ')).toBe('sk-example');
  });

  it('normalizes the base URL without touching its path', () => {
    expect(normalizeApiBaseUrl('  https://api.example.com/v1///\u200B ')).toBe('https://api.example.com/v1');
  });

  it('keeps unrelated API settings intact', () => {
    expect(normalizeApiConfig({
      baseUrl: ' https://api.example.com/v1/ ',
      apiKey: '\uFEFFsk-test\u200B',
      model: ' gpt-test ',
      stream: true,
      temperature: 0.7,
      minimaxApiKey: 'mini-key',
      visionApi: {
        enabled: true,
        baseUrl: ' https://vision.example.com/v1/// ',
        apiKey: '\u200Bvision-key\u2060',
        model: ' vision-model ',
      },
    })).toEqual({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-test',
      stream: true,
      temperature: 0.7,
      minimaxApiKey: 'mini-key',
      visionApi: {
        enabled: true,
        baseUrl: 'https://vision.example.com/v1',
        apiKey: 'vision-key',
        model: 'vision-model',
      },
    });
  });

  it('keeps the selected speech recognition service in its durable record', () => {
    localStorage.removeItem(SPEECH_RECOGNITION_STORAGE_KEY);
    saveStoredSpeechRecognitionConfig({
      provider: 'siliconflow',
      baseUrl: ' https://api.siliconflow.cn/v1/ ',
      apiKey: ' sk-stt ',
      model: ' FunAudioLLM/SenseVoiceSmall ',
      language: 'zh-CN',
      cleanEmotionEmoji: true,
    });
    expect(loadStoredSpeechRecognitionConfig()).toEqual({
      provider: 'siliconflow',
      baseUrl: 'https://api.siliconflow.cn/v1',
      apiKey: 'sk-stt',
      model: 'FunAudioLLM/SenseVoiceSmall',
      language: 'zh-CN',
      cleanEmotionEmoji: true,
    });
  });

  it('restores saved MiniMax, Qwen, Fish, and Xiaomi settings without allowing blanks to overwrite them', () => {
    localStorage.removeItem(OTHER_API_CONFIG_STORAGE_KEY);
    saveStoredOtherApiConfig({
      baseUrl: '', apiKey: '', model: '',
      minimaxApiKey: 'mini-key', minimaxGroupId: 'group-1', minimaxRegion: 'domestic',
      fishAudioApiKey: 'fish-key', fishAudioModel: 's2.1-pro',
      qwenTtsApiKey: 'qwen-key', qwenTtsModel: 'qwen-audio-3.0-tts-flash', qwenTtsVoice: 'longanlingxi',
      xiaomiTtsApiKey: 'xiaomi-key', xiaomiTtsBaseUrl: 'https://api.xiaomimimo.com/v1', xiaomiTtsModel: 'mimo-v2.5-tts', xiaomiTtsVoice: '冰糖',
    });
    const saved = loadStoredOtherApiConfig();
    expect(saved.minimaxApiKey).toBe('mini-key');
    expect(saved.fishAudioApiKey).toBe('fish-key');
    expect(saved.qwenTtsApiKey).toBe('qwen-key');
    expect(saved.xiaomiTtsApiKey).toBe('xiaomi-key');

    localStorage.setItem(OTHER_API_CONFIG_STORAGE_KEY, JSON.stringify({ minimaxApiKey: '', qwenTtsApiKey: '  ', xiaomiTtsApiKey: 'xiaomi-key' }));
    const emptyFiltered = loadStoredOtherApiConfig();
    expect(emptyFiltered.minimaxApiKey).toBeUndefined();
    expect(emptyFiltered.qwenTtsApiKey).toBeUndefined();
    expect(emptyFiltered.xiaomiTtsApiKey).toBe('xiaomi-key');
  });
});
