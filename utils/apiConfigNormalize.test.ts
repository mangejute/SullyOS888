import { describe, expect, it } from 'vitest';
import {
  loadStoredSpeechRecognitionConfig,
  normalizeApiBaseUrl,
  normalizeApiConfig,
  normalizeApiCredential,
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
});
