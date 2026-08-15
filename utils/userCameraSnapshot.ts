export interface UserCameraSnapshotSize {
  width: number;
  height: number;
}

export interface CameraChatMessage {
  role: string;
  content: unknown;
  [key: string]: unknown;
}

export const fitUserCameraSnapshot = (
  sourceWidth: number,
  sourceHeight: number,
  maxEdge = 640,
): UserCameraSnapshotSize | null => {
  const width = Math.floor(Number(sourceWidth));
  const height = Math.floor(Number(sourceHeight));
  const limit = Math.max(160, Math.min(1280, Math.floor(Number(maxEdge) || 640)));
  if (width <= 0 || height <= 0) return null;
  const scale = Math.min(1, limit / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/**
 * Captures one mirrored frame, matching the user's on-screen selfie preview.
 * The data URL itself is transient. CallApp may convert the compressed frame
 * into a blobref for the local transcript, where retention is capped separately.
 */
export const captureUserCameraSnapshot = (
  video: HTMLVideoElement,
  maxEdge = 640,
  quality = 0.76,
  mirror = true,
): string | null => {
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const size = fitUserCameraSnapshot(video.videoWidth, video.videoHeight, maxEdge);
  if (!size) return null;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;
  // Mirror only the selfie camera so the submitted frame matches the preview.
  if (mirror) {
    context.translate(size.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, 0, 0, size.width, size.height);
  return canvas.toDataURL('image/jpeg', Math.max(0.55, Math.min(0.86, quality)));
};

export const attachSnapshotToLatestUserMessage = <T extends CameraChatMessage>(
  messages: readonly T[],
  snapshotDataUrls: readonly string[],
): T[] => {
  const validSnapshots = snapshotDataUrls.filter(snapshot => snapshot.startsWith('data:image/'));
  if (!validSnapshots.length) return [...messages];
  const targetIndex = [...messages].map(message => message.role).lastIndexOf('user');
  if (targetIndex < 0) return [...messages];
  return messages.map((message, index) => {
    if (index !== targetIndex) return message;
    const text = typeof message.content === 'string'
      ? message.content
      : '（本轮用户消息随附一张发送瞬间的摄像头快照）';
    return {
      ...message,
      content: [
        { type: 'text', text },
        ...validSnapshots.map(snapshotDataUrl => ({
          type: 'image_url',
          image_url: { url: snapshotDataUrl },
        })),
      ],
    } as T;
  });
};

/** Only retry without the image when the provider explicitly rejects vision input. */
export const isVisionInputUnsupportedError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /image_url|image input|vision|multimodal|multi-modal|unsupported[^\n]*image|does not support[^\n]*image|unknown variant[^\n]*image|content[^\n]*array/i.test(message);
};

export const USER_CAMERA_SNAPSHOT_SYSTEM_NOTE = `【本轮用户摄像头连续快照】
用户主动选择了“每轮快照”模式；最后一条用户消息附带的是用户说话期间按时间采样的连续画面，仅作为当前对话的即时非语言线索。自然结合多张画面与文字回应，按时间顺序理解用户的表情和动作变化；文字语义优先。不要进行身份、医学或心理诊断，也不要解释系统如何获得图片。`;
