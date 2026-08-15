import { describe, expect, it } from 'vitest';
import { normalizeMessageContent } from './messageFormat';

describe('normalizeMessageContent music sharing', () => {
  it('keeps lyrics, comments, and response guidance for the character', () => {
    const text = normalizeMessageContent({
      id: 1,
      charId: 'char-1',
      role: 'user',
      type: 'music_card',
      content: '[音乐分享] 测试',
      timestamp: Date.now(),
      metadata: {
        shared: true,
        song: { name: '测试歌曲', artists: '测试歌手' },
        lyrics: '第一句\n第二句',
        comments: [{ nickname: '听众', likedCount: 42, content: '这首歌很有画面感' }],
      },
    }, '角色', '我');

    expect(text).toContain('《测试歌曲》— 测试歌手');
    expect(text).toContain('第一句\n第二句');
    expect(text).toContain('听众（获赞 42）：这首歌很有画面感');
    expect(text).toContain('不要编造事实');
  });
});
