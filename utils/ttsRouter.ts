/**
 * TTS 服务商路由：按 apiConfig.ttsProvider 把语音合成分发到 MiniMax、鱼声或 Qwen TTS。
 *
 * 聊天语音条（Chat）、约会（DateSession）直接用这里的 synthesizeSpeech(Detailed)，
 * 不必关心底层是哪家。CallApp 因为要做分句流式 + 缓存键对齐，单独在自己内部分支。
 */
import { CharacterProfile, APIConfig } from '../types';
import {
  synthesizeSpeechDetailed as minimaxSynthesizeDetailed,
  type TtsResult,
} from './minimaxTts';
import { synthesizeSpeechFishDetailed } from './fishAudioTts';
import { synthesizeSpeechQwenDetailed } from './qwenTts';
import { synthesizeSpeechXiaomiDetailed, synthesizeSpeechXiaomiWithVoiceDetailed } from './xiaomiTts';
import { resolveTtsProvider } from './ttsProvider';

export type { TtsResult };

type SynthOptions = { languageBoost?: string; groupId?: string; emotion?: string };

export async function synthesizeSpeechDetailed(
  text: string,
  char: CharacterProfile,
  apiConfig: APIConfig,
  options?: SynthOptions,
): Promise<TtsResult> {
  if (resolveTtsProvider(apiConfig) === 'fishaudio') {
    return synthesizeSpeechFishDetailed(text, char, apiConfig, options);
  }
  if (resolveTtsProvider(apiConfig) === 'qwen') {
    return synthesizeSpeechQwenDetailed(text, char, apiConfig);
  }
  if (resolveTtsProvider(apiConfig) === 'xiaomi') {
    return synthesizeSpeechXiaomiDetailed(text, char, apiConfig);
  }
  return minimaxSynthesizeDetailed(text, char, apiConfig, options);
}

/** 在不改动全局聊天语音设置的前提下，指定一家引擎合成一次语音。 */
export async function synthesizeSpeechWithProviderDetailed(
  text: string,
  char: CharacterProfile,
  apiConfig: APIConfig,
  provider: 'minimax' | 'fishaudio' | 'qwen' | 'xiaomi',
  options?: SynthOptions,
): Promise<TtsResult> {
  return synthesizeSpeechDetailed(text, char, { ...apiConfig, ttsProvider: provider }, options);
}

/** 指定小米内置音色合成，供书库独立朗读设置使用。 */
export async function synthesizeSpeechXiaomiReaderDetailed(
  text: string,
  apiConfig: APIConfig,
  voice: string,
): Promise<TtsResult> {
  return synthesizeSpeechXiaomiWithVoiceDetailed(text, apiConfig, voice);
}

export async function synthesizeSpeech(
  text: string,
  char: CharacterProfile,
  apiConfig: APIConfig,
  options?: SynthOptions,
): Promise<string> {
  const { url } = await synthesizeSpeechDetailed(text, char, apiConfig, options);
  return url;
}

/**
 * 当前 TTS 服务商下，这个角色是否已配好可用音色。
 * 鱼声看 fishReferenceId；Qwen 看全局或角色音色；MiniMax 看 voiceId / timberWeights。
 * 各处「要不要显示语音按钮 / 要不要触发自动 TTS」的判断统一用它，避免漏掉鱼声分支。
 */
export const characterHasVoice = (char: CharacterProfile, apiConfig: APIConfig): boolean => {
  const vp = char.voiceProfile;
  if (resolveTtsProvider(apiConfig) === 'fishaudio') {
    return !!vp?.fishReferenceId;
  }
  if (resolveTtsProvider(apiConfig) === 'qwen') {
    // Qwen 内置默认音色 longanlingxi；角色或全局音色留空也能直接合成。
    return true;
  }
  if (resolveTtsProvider(apiConfig) === 'xiaomi') {
    return true;
  }
  return !!(vp?.voiceId || (vp?.timberWeights && vp.timberWeights.length > 0));
};

/** 与 characterHasVoice 相同，但供书库等需要临时指定引擎的场景使用。 */
export const characterHasVoiceForProvider = (
  char: CharacterProfile,
  apiConfig: APIConfig,
  provider: 'minimax' | 'fishaudio' | 'qwen' | 'xiaomi',
): boolean => characterHasVoice(char, { ...apiConfig, ttsProvider: provider });
