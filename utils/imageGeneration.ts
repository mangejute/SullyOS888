import { APIConfig, CharacterProfile, Message } from '../types';
import { DB } from './db';

type ImageApi = NonNullable<APIConfig['imageGenerationApi']>;
export type ImageAspectRatio = NonNullable<ImageApi['aspectRatio']>;

const ratioSize: Record<ImageAspectRatio, string> = {
  '1:1': '1024x1024',
  // GPT Image/OpenAI 兼容接口普遍只接受这三种固定 size；具体构图比例继续由 prompt 要求。
  '3:4': '1024x1536',
  '4:3': '1536x1024',
  '9:16': '1024x1536',
  '16:9': '1536x1024',
};

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

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = String(dataUrl || '').match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s);
  if (!match) return null;
  const mime = match[1] || 'image/jpeg';
  const body = match[2] || '';
  try {
    if (/;base64,/i.test(dataUrl)) {
      const binary = atob(body);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(body)], { type: mime });
  } catch {
    return null;
  }
}

async function readImageResponse(response: Response): Promise<{ payload: any; url?: string }> {
  const payload = await response.json().catch(() => ({}));
  return { payload, url: responseImageUrl(payload) };
}

async function cacheImageUrl(url: string): Promise<string> {
  // data URL 已经是永久的本地内容，不需要再次下载。
  if (/^data:image\//i.test(url)) return url;
  try {
    const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!response.ok) throw new Error(`图片下载失败（${response.status}）`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('接口返回的不是图片');
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || url));
      reader.onerror = () => reject(reader.error || new Error('图片缓存失败'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // 有些中转站禁止浏览器跨域读取图片。此时保留原 URL，至少在链接有效期内
    // 可以正常显示；MessageItem 会把失效链接显示为可手动重试，而不是无限转圈。
    console.warn('[image-generation] 无法把远程图片缓存到本地', error);
    return url;
  }
}

/** 供旧聊天记录在仍可打开时补存为本地图片，避免临时图片链接过期。 */
export async function cacheGeneratedImage(url: string): Promise<string> {
  return cacheImageUrl(url);
}

async function latestCharacter(character: CharacterProfile): Promise<CharacterProfile> {
  try {
    const saved = (await DB.getAllCharacters()).find(item => item.id === character.id);
    return saved || character;
  } catch {
    return character;
  }
}

/**
 * Reference images are an image-edit input, not a normal generations option.
 * OpenAI-compatible services that implement reference images generally accept
 * repeated `image` parts on /images/edits.  Some lightweight proxies do not
 * expose that route, so the caller can fall back to their JSON extensions.
 */
async function generateWithReferenceImages(args: {
  api: ImageApi;
  prompt: string;
  size: string;
  aspectRatio: ImageAspectRatio;
  references: string[];
}): Promise<{ url?: string; unsupported: boolean; error?: string }> {
  const form = new FormData();
  form.append('model', args.api.model);
  form.append('prompt', args.prompt);
  form.append('n', '1');
  form.append('size', args.size);
  form.append('aspect_ratio', args.aspectRatio);
  form.append('response_format', 'url');

  let appended = 0;
  args.references.forEach((reference, index) => {
    const blob = dataUrlToBlob(reference);
    if (!blob) return;
    // Repeated `image` fields are the standard multipart representation for
    // the array accepted by current OpenAI-compatible image edit endpoints.
    form.append('image', blob, `character-reference-${index + 1}.jpg`);
    appended += 1;
  });
  if (!appended) return { unsupported: false, error: '参考图格式无效，无法上传给生图接口' };

  try {
    const response = await fetch(endpoint(args.api.baseUrl, '/images/edits'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${args.api.apiKey}` },
      body: form,
    });
    const { payload, url } = await readImageResponse(response);
    if (response.ok && url) return { url, unsupported: false };
    if ([404, 405, 415, 501].includes(response.status)) return { unsupported: true };
    return { unsupported: false, error: payload?.error?.message || payload?.message || `参考图接口请求失败（${response.status}）` };
  } catch (error: any) {
    return { unsupported: true, error: error?.message || String(error) };
  }
}

export async function generateCharacterImage(args: { api?: ImageApi; character: CharacterProfile; description: string; aspectRatio?: ImageAspectRatio }): Promise<string> {
  const api = args.api;
  if (!api?.baseUrl || !api.apiKey || !api.model) throw new Error('请先在系统设置中填写生图 API、秘钥和模型');
  const references = (args.character.imageGenerationReferences || []).filter(Boolean);
  const aspectRatio = args.aspectRatio || api.aspectRatio || '1:1';
  const prompt = [
    api.prompt?.trim(),
    `保持角色“${args.character.name}”的外观、发型、服装特征与参考图一致。`,
    references.length ? `已配置 ${references.length} 张角色参考图，请优先保持人物一致性。` : '',
    `画面比例：${aspectRatio}。`,
    `本次画面描述：${args.description}`,
  ].filter(Boolean).join('\n');
  const size = ratioSize[aspectRatio];

  // 参考图必须作为 multipart 图片上传。把 data URL 放进普通 generations JSON
  // 并不能让模型看到图片，很多服务会静默忽略 reference_images/images 字段。
  if (references.length) {
    const editResult = await generateWithReferenceImages({ api, prompt, size, aspectRatio, references });
    if (editResult.url) return editResult.url;
    if (editResult.error && !editResult.unsupported) throw new Error(editResult.error);
  }

  const body: any = { model: api.model, prompt, n: 1, size, aspect_ratio: aspectRatio, response_format: 'url' };
  // 兼容仍只提供 generations 路由、但实现了自定义参考图字段的中转服务。
  // 这些字段不是标准 generations 参数，因此仅作为 /images/edits 不可用时的后备。
  if (references.length) {
    body.reference_images = references;
    body.input_images = references;
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

export async function startImageGeneration(messageId: number, args: { api?: ImageApi; character: CharacterProfile; description: string; aspectRatio?: ImageAspectRatio }): Promise<void> {
  try {
    // 参考图可能刚在设置页保存，React 闭包里的 character 仍是上一帧；
    // 从 IndexedDB 重读，确保本次请求拿到保存后的最新 4 张图。
    const character = await latestCharacter(args.character);
    const remoteUrl = await generateCharacterImage({ ...args, character });
    const url = await cacheImageUrl(remoteUrl);
    await DB.updateMessage(messageId, url);
    await DB.updateMessageMetadata(messageId, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'success', url, remoteUrl, cached: /^data:image\//i.test(url), error: undefined } }));
  } catch (error: any) {
    const message = error?.message || String(error);
    await DB.updateMessageMetadata(messageId, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'failed', error: message } }));
  }
  window.dispatchEvent(new CustomEvent('active-msg-progress', { detail: { charId: args.character.id } }));
}

export async function retryImageGeneration(message: Message, args: { api?: ImageApi; character: CharacterProfile }): Promise<void> {
  const generation = (message.metadata as any)?.imageGeneration;
  const description = generation?.description || generation?.prompt || '';
  const aspectRatio = generation?.aspectRatio as ImageAspectRatio | undefined;
  if (!description) return;
  await DB.updateMessage(message.id, '');
  await DB.updateMessageMetadata(message.id, prev => ({ ...(prev || {}), imageGeneration: { ...(prev?.imageGeneration || {}), status: 'pending', error: undefined } }));
  window.dispatchEvent(new CustomEvent('active-msg-progress', { detail: { charId: args.character.id } }));
  void startImageGeneration(message.id, { ...args, description, aspectRatio });
}
