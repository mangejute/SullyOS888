import type { CharacterProfile, UserProfile, Worldbook } from '../types';
import { DB } from './db';
import { extractContent, extractJson, safeResponseJson } from './safeApi';
import { formatChinaCalendarContext } from './chinaCalendar2026';

type ApiConfig = { baseUrl: string; apiKey: string; model: string };

export function formatRoutineContext(char: CharacterProfile, date: Date | string): string {
  const calendar = formatChinaCalendarContext(date);
  const routine = char.routineProfile;
  if (!routine) return `## 日期与作息约束\n${calendar}\n角色尚未建立基础作息；按人设自然判断，但不得把法定节假日或补班日判断反。`;
  const normal = routine.workday;
  const rest = routine.restday;
  return `## 日期与作息约束（必须遵守）\n${calendar}\n角色基础规律：${routine.summary}\n- 常规工作日：${normal.wakeTime}起床，${normal.breakfastTime}早餐，${normal.workStartTime || '按人设'}开始工作，${normal.lunchTime}午餐，${normal.workEndTime || '按人设'}结束工作，${normal.dinnerTime}晚餐，${normal.sleepTime}睡觉。\n- 常规休息日/法定假日：${rest.wakeTime}起床，${rest.breakfastTime}早餐，${rest.lunchTime}午餐，${rest.dinnerTime}晚餐，${rest.sleepTime}睡觉；${rest.note || '以休息和个人生活为主'}。\n规则：法定假日默认不工作，调休补班按工作日；只有已有聊天、家园或剧情里明确的特殊事件才能合理打破作息。`;
}

function selectedRoutineWorldbooks(worldbooks: Worldbook[], selectedIds: string[]): Worldbook[] {
  const selected = new Set(selectedIds.filter(Boolean));
  return worldbooks.filter(book => selected.has(book.id));
}

function formatRoutineWorldbookSources(worldbooks: Worldbook[]): string {
  const limit = 18_000;
  let used = 0;
  const sections: string[] = [];
  for (const book of worldbooks) {
    const remaining = limit - used;
    if (remaining <= 0) break;
    const content = String(book.content || '').trim();
    if (!content) continue;
    const body = content.slice(0, Math.max(0, remaining - book.title.length - 20));
    if (!body) continue;
    sections.push(`### ${book.title}\n${body}${body.length < content.length ? '\n（该世界书其余内容因篇幅未发送）' : ''}`);
    used += book.title.length + body.length + 20;
  }
  return sections.join('\n\n') || '（用户没有选择含有效正文的世界书）';
}

/**
 * 首次日程生成可以只按核心人设建立作息；用户主动点 AI 识别时，才会按所选世界书重新分析。
 * 世界书正文仅进入这次 API 请求，角色档案只保留来源 ID 和标题，避免备份不断膨胀。
 */
export async function ensureCharacterRoutine(
  char: CharacterProfile,
  user: UserProfile,
  api: ApiConfig,
  force = false,
  worldbooks: Worldbook[] = [],
  selectedWorldbookIds: string[] = char.routineProfile?.sourceWorldbookIds || [],
): Promise<CharacterProfile> {
  if ((!force && char.routineProfile) || !api.baseUrl || !api.apiKey || !api.model) return char;
  const persona = `${char.description || ''}\n${char.systemPrompt || ''}`.slice(0, 8000);
  const selectedBooks = selectedRoutineWorldbooks(worldbooks, selectedWorldbookIds);
  const prompt = `你要为角色「${char.name}」建立长期基础作息。只能依据下列两部分资料判断，不得凭空补充未给出的职业或固定习惯。角色核心人设优先；世界书用于补足其所在世界的地点、职业制度、生活节奏、时代与社会规则。\n\n## 角色核心人设\n${persona || '（没有额外文字；请保守安排，不要杜撰职业）'}\n\n## 用户选作息参考的世界书\n${formatRoutineWorldbookSources(selectedBooks)}\n\n请分别安排常规工作日/补班日，和周末/法定假日的长期规律。按职业、性格和生活方式判断，不要强套朝九晚五；法定假日默认休息，特殊事件由后续日程单独处理。只返回严格 JSON：{"summary":"一句规律说明","workday":{"wakeTime":"07:30","breakfastTime":"08:00","lunchTime":"12:30","dinnerTime":"19:00","sleepTime":"23:30","workStartTime":"09:00","workEndTime":"18:00","note":""},"restday":{"wakeTime":"09:30","breakfastTime":"10:00","lunchTime":"13:00","dinnerTime":"19:30","sleepTime":"00:30","note":""}}。时间必须是 HH:MM。`;
  try {
    const response = await fetch(`${api.baseUrl.replace(/\/+$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.apiKey}` }, body: JSON.stringify({ model: api.model, temperature: 0.25, messages: [{ role: 'user', content: prompt }] }) });
    if (!response.ok) return char;
    const raw = extractJson(extractContent(await safeResponseJson(response)));
    if (!raw?.workday || !raw?.restday) return char;
    const cleanTime = (value: unknown, fallback: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')) ? String(value) : fallback;
    const section = (value: any, fallback: any, includeWork = false) => ({ wakeTime: cleanTime(value?.wakeTime, fallback.wakeTime), breakfastTime: cleanTime(value?.breakfastTime, fallback.breakfastTime), lunchTime: cleanTime(value?.lunchTime, fallback.lunchTime), dinnerTime: cleanTime(value?.dinnerTime, fallback.dinnerTime), sleepTime: cleanTime(value?.sleepTime, fallback.sleepTime), ...(includeWork ? { workStartTime: cleanTime(value?.workStartTime, fallback.workStartTime), workEndTime: cleanTime(value?.workEndTime, fallback.workEndTime) } : {}), note: String(value?.note || '').slice(0, 120) });
    const profile = {
      summary: String(raw.summary || '按角色人设形成的稳定生活节奏').slice(0, 180),
      workday: section(raw.workday, { wakeTime: '07:30', breakfastTime: '08:00', lunchTime: '12:30', dinnerTime: '19:00', sleepTime: '23:30', workStartTime: '09:00', workEndTime: '18:00' }, true),
      restday: section(raw.restday, { wakeTime: '09:30', breakfastTime: '10:00', lunchTime: '13:00', dinnerTime: '19:30', sleepTime: '00:30' }),
      sourceWorldbookIds: selectedBooks.map(book => book.id),
      sourceWorldbookLabels: selectedBooks.map(book => book.title).slice(0, 20),
      updatedAt: Date.now(),
    };
    const updated = { ...char, routineProfile: profile };
    await DB.saveCharacter(updated);
    Object.assign(char, updated);
    return updated;
  } catch { return char; }
}
