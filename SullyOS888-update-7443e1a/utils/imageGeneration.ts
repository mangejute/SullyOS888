import { APIConfig, CharacterProfile, Message } from '../types';
import { DB } from './db';

type ImageApi = NonNullable<APIConfig['imageGenerationApi']>;

const endpoint = (baseUrl: string, path: string) => `${String(baseUrl || '').replace(/\/+$/, '')}${path}`;

export function extractImageGenerationRequests(content: string): { description: string; cleanedContent: string }[] {
  const requests: { description: string; cleanedContent: string }[] = [];
  const cleanedContent = String(content || '').replace(/\[\[GENERATE_IMAGE\s*:\s*([\s\S]*?)\]\]/gi, (_match, description: string) => {
    const value = String(description || '').trim();
    if (value) requests.push({ description: value, cleanedContent: '' });
    return '';
  }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return requests.map(r => ({ ...r, cleanedContent }));
}

function responseImageUrl(payload: any): string | undefined {
  const item = payload?.data?.[0] ?? payload?.images?.[0] ?? payload?.output?.[0] ?? payload?.output ?? payload?.image;
  if (typeof item === 'string') return item;
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (payload?.url) return payload.url;
  if (payload?.b64_json) return `data:image/png;base64,${payload.b64_json}`;
  return undefined;
}

export async function generateCharacterImage(args: { api?: ImageApi; character: CharacterProfile; description: string }): Promise<string> {
  const api = args.api;
  if (!api?.baseUrl || !api.apiKey || !api.model) throw new Error('请先在系统设置中填写生图 API、秘钥和模型');
  const references = (args.character.imageGenerationReferences || []).filter(Boolean);
  const prompt = [
    api.prompt?.trim(),
    `保持角色“${args.character.name}”的外观、发型、服装特征与参考图一致。`,
    references.length ? `已配置 ${references.length} 张角色参考图，请优先保持人物一致性。` : '',
    `本次画面描述：${args.description}`,
  ].filter(Boolean).join('\n');
  const body: any = { model: api.model, prompt, n: 1, response_format: 'url' };
  // 不同 OpenAI 兼容服务对参考图字段命名不统一；常见服务会忽略未知字段，
  // 而支持它们的服务可以直接利用 data URL 保持角色一致性。
  if (references.length) {
    body.reference_images = references;
    body.images = references;
  }
  const response = await fetch(endpoint(api.baseUrl, '/images/generations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.apiKey}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `生图接口请求失败（${response.status}）`);
  const url = responseImageUrl(payload);
  if (!url) throw new Error('生图接口没有返回图片地址');
  return url;
}

export async function startImageGeneration(messageId: number, args: { api?: ImageApi; character: CharacterProfile; description: string }): Promise<void> {
  try {
    const url = await generateCharacterImage(args);
    await DB.updateMessage(messageId, url);
    await DB.updateMessageMetadata(messageId, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'success', url, error: undefined } }));
  } catch (error: any) {
    const message = error?.message || String(error);
    await DB.updateMessageMetadata(messageId, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'failed', error: message } }));
  }
  window.dispatchEvent(new CustomEvent('active-msg-progress', { detail: { charId: args.character.id } }));
}

export async function retryImageGeneration(message: Message, args: { api?: ImageApi; character: CharacterProfile }): Promise<void> {
  const generation = (message.metadata as any)?.imageGeneration;
  const description = generation?.description || generation?.prompt || '';
  if (!description) return;
  await DB.updateMessage(message.id, '');
  await DB.updateMessageMetadata(message.id, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'pending', error: undefined } }));
  window.dispatchEvent(new CustomEvent('active-msg-progress', { detail: { charId: args.character.id } }));
  void startImageGeneration(message.id, { ...args, description });
}
