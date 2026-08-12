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
import { synthesizeSpeechXiaomiDetailed } from './xiaomiTts';
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
