import React, { useEffect, useMemo, useState } from 'react';
import { MapTrifold, UsersThree, Sparkle, Plus, Trash, X, MapPin, House, Briefcase } from '@phosphor-icons/react';
import type { CharacterProfile, Worldbook } from '../../types';
import { safeResponseJson, extractContent } from '../../utils/safeApi';

type Location = { id: string; name: string; description: string; purpose: string; distance: string; category: string; x: number; y: number; isHome?: boolean; isWork?: boolean };
type Npc = { id: string; name: string; age: string; gender: string; role: string; relation: string; description: string };
type MapData = { referenceCity: string; locations: Location[]; sourceText: string; updatedAt: number };
type NpcData = { sourceText: string; npcs: Npc[]; updatedAt: number };
type Mode = 'map' | 'npc';

const uid = () => Math.random().toString(36).slice(2, 10);
interface Props { isOpen: boolean; mode: Mode; onClose: () => void; char: CharacterProfile; worldbooks: Worldbook[]; apiConfig: any; onSave: (mode: Mode, data: MapData | NpcData) => void; }

const WorldSpaceModal: React.FC<Props> = ({ isOpen, mode, onClose, char, worldbooks, apiConfig, onSave }) => {
  const savedMap = (char as any).worldMap as MapData | undefined;
  const savedNpcs = (char as any).worldNpcs as NpcData | undefined;
  const [referenceCity, setReferenceCity] = useState(savedMap?.referenceCity || '');
  const [sourceText, setSourceText] = useState(mode === 'map' ? savedMap?.sourceText || '' : savedNpcs?.sourceText || '');
  const [bookId, setBookId] = useState('');
  const [mapData, setMapData] = useState<MapData>(savedMap || { referenceCity: '', locations: [], sourceText: '', updatedAt: 0 });
  const [npcData, setNpcData] = useState<NpcData>(savedNpcs || { sourceText: '', npcs: [], updatedAt: 0 });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const nextMap = (char as any).worldMap as MapData | undefined;
    const nextNpcs = (char as any).worldNpcs as NpcData | undefined;
    setMapData(nextMap || { referenceCity: '', locations: [], sourceText: '', updatedAt: 0 });
    setNpcData(nextNpcs || { sourceText: '', npcs: [], updatedAt: 0 });
    setReferenceCity(nextMap?.referenceCity || '');
    setSourceText(mode === 'map' ? nextMap?.sourceText || '' : nextNpcs?.sourceText || '');
    setBookId(''); setNotice('');
  }, [isOpen, mode, char]);

  const selectedBook = useMemo(() => worldbooks.find(book => book.id === bookId), [bookId, worldbooks]);
  if (!isOpen) return null;
  const currentLocations = mapData.locations;
  const currentNpcs = npcData.npcs;
  const updateLocation = (id: string, patch: Partial<Location>) => setMapData(prev => ({ ...prev, locations: prev.locations.map(item => item.id === id ? { ...item, ...patch } : item) }));
  const updateNpc = (id: string, patch: Partial<Npc>) => setNpcData(prev => ({ ...prev, npcs: prev.npcs.map(item => item.id === id ? { ...item, ...patch } : item) }));

  const analyze = async () => {
    const text = (selectedBook?.content || sourceText).trim();
    if (!text) { setNotice('请先选择世界书或粘贴设定文本'); return; }
    if (!apiConfig?.baseUrl || !apiConfig?.apiKey || !apiConfig?.model) { setNotice('请先在设置中配置可用的 API'); return; }
    setBusy(true); setNotice('AI 正在结合角色人设识别…');
    const persona = `角色：${char.name}\n性格：${(char as any).personality || (char as any).description || '未提供'}\n职业：${(char as any).occupation || (char as any).job || '未提供'}`;
    try {
      const task = mode === 'map'
        ? `参考城市：${referenceCity || '未指定'}\n${persona}\n从资料整理地点。返回严格 JSON：{"locations":[{"name":"","description":"","purpose":"","distance":"","category":"","isHome":false,"isWork":false}]}。若资料没有明确住所，根据角色人设从地点中合理推断一个居所。`
        : `${persona}\n从资料整理 NPC。返回严格 JSON：{"npcs":[{"name":"","age":"","gender":"","role":"","relation":"","description":""}]}。relation 只能使用亲密、朋友、同事、邻居、点头之交、陌生等具体关系。`;
      const response = await fetch(`${apiConfig.baseUrl.replace(/\/+$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiConfig.apiKey}` }, body: JSON.stringify({ model: apiConfig.model, temperature: 0.2, stream: false, messages: [{ role: 'system', content: '你是世界观资料整理助手，只返回严格 JSON，不要 Markdown。' }, { role: 'user', content: `${task}\n资料：${text.slice(0, 18000)}` }] }) });
      const raw = extractContent(await safeResponseJson(response));
      const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
      if (mode === 'map') {
        const locations = (parsed.locations || []).map((item: any, i: number) => ({ id: uid(), name: item.name || `地点 ${i + 1}`, description: item.description || '', purpose: item.purpose || '日常活动', distance: item.distance || '待估算', category: item.category || '地点', x: 13 + ((i * 29) % 76), y: 18 + ((i * 37) % 68), isHome: !!item.isHome, isWork: !!item.isWork }));
        setMapData({ referenceCity, locations, sourceText: text, updatedAt: Date.now() });
      } else {
        const npcs = (parsed.npcs || []).map((item: any) => ({ id: uid(), name: item.name || '未命名 NPC', age: item.age || '未知', gender: item.gender || '未知', role: item.role || '待识别', relation: item.relation || '陌生', description: item.description || '' }));
        setNpcData({ sourceText: text, npcs, updatedAt: Date.now() });
      }
      setNotice('识别完成，可以编辑后保存');
    } catch { setNotice('AI 识别失败，请检查 API 配置或稍后重试'); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (mode === 'map') { const next = { ...mapData, referenceCity, sourceText: selectedBook?.content || sourceText, updatedAt: Date.now() }; setMapData(next); onSave('map', next); }
    else { const next = { ...npcData, sourceText: selectedBook?.content || sourceText, updatedAt: Date.now() }; setNpcData(next); onSave('npc', next); }
    setNotice('已保存到当前角色');
  };
  const addLocation = () => setMapData(prev => ({ ...prev, locations: [...prev.locations, { id: uid(), name: '新地点', description: '', purpose: '日常活动', distance: '待估算', category: '地点', x: 50, y: 50 }] }));
  const addNpc = () => setNpcData(prev => ({ ...prev, npcs: [...prev.npcs, { id: uid(), name: '新 NPC', age: '未知', gender: '未知', role: '待填写', relation: '陌生', description: '' }] }));
  return <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-[#fbfcff] shadow-2xl sm:rounded-[28px]" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-slate-200/80 px-5 pb-3 pt-5"><div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">{mode === 'map' ? 'CITY MAP' : 'NPC DIRECTORY'}</div><h2 className="mt-1 text-lg font-bold text-slate-800">{mode === 'map' ? `${char.name} 的城市地图` : `${char.name} 的 NPC`}</h2><p className="mt-1 text-[11px] text-slate-400">{mode === 'map' ? '生成后会保存这张可视化地图，每次打开都直接显示。' : 'NPC 独立保存，不和地图页面混在一起。'}</p></div><button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"><X size={18}/></button></div>
      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4 no-scrollbar"><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-500">{mode === 'map' ? '参考城市' : '资料来源'}{mode === 'map' && <input value={referenceCity} onChange={e => setReferenceCity(e.target.value)} placeholder="例如：辉城" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"/>}<select value={bookId} onChange={e => { setBookId(e.target.value); const book = worldbooks.find(item => item.id === e.target.value); if (book) setSourceText(book.content); }} className={`${mode === 'map' ? 'mt-1' : 'mt-1'} w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none`}><option value="">选择世界书（可选）</option>{worldbooks.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label><div className="flex items-end"><div className="w-full rounded-xl bg-indigo-50 px-3 py-2 text-[11px] text-indigo-700">{mode === 'map' ? `${currentLocations.length} 个地点已保存` : `${currentNpcs.length} 个 NPC 已保存`}</div></div></div><textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="粘贴世界书文本或设定…" className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-indigo-400"/><div className="mt-2 flex gap-2"><button onClick={analyze} disabled={busy} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"><Sparkle className="mr-1 inline" size={16} weight="fill"/>{busy ? '识别中…' : `AI 识别${mode === 'map' ? '地点' : 'NPC'}`}</button><button onClick={save} className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700">保存</button></div>{notice && <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{notice}</div>}
      {mode === 'map' ? <><div className="mt-3 overflow-hidden rounded-2xl border border-indigo-100 bg-[#edf3f5]"><div className="relative h-[330px]" style={{ backgroundImage: 'linear-gradient(rgba(100,116,139,.13) 1px, transparent 1px),linear-gradient(90deg,rgba(100,116,139,.13) 1px,transparent 1px)', backgroundSize: '32px 32px' }}><div className="absolute inset-[11%] rotate-[-8deg] rounded-[45%] border-2 border-emerald-200/80 bg-emerald-50/50"/><div className="absolute left-[4%] right-[4%] top-[53%] h-3 rotate-[17deg] rounded-full bg-amber-100/90"/><div className="absolute bottom-[10%] left-[12%] h-20 w-36 rounded-[50%] border-2 border-sky-200/80 bg-sky-50/70"/>{currentLocations.map(location => <div key={location.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${location.x}%`, top: `${location.y}%` }}><div className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white/70 ${location.isHome ? 'bg-rose-500' : location.isWork ? 'bg-amber-500' : 'bg-indigo-600'}`}><MapPin size={17} weight="fill"/></div><div className="mt-1 whitespace-nowrap rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">{location.name}</div></div>)}{!currentLocations.length && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">识别地点后会在这里生成可视化地图</div>}</div><div className="flex items-center gap-3 border-t border-indigo-100 bg-white/70 px-3 py-2 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500"/>家</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500"/>工作</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-600"/>地点</span><button onClick={addLocation} className="ml-auto text-indigo-600"><Plus className="inline"/> 新地点</button></div></div><div className="mt-3 space-y-2">{currentLocations.map(location => <div key={location.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex gap-2"><input value={location.name} onChange={e => updateLocation(location.id, { name: e.target.value })} className="min-w-0 flex-1 text-sm font-bold text-slate-700 outline-none"/><button onClick={() => setMapData(prev => ({ ...prev, locations: prev.locations.filter(item => item.id !== location.id) }))} className="text-slate-300 hover:text-rose-500"><Trash size={15}/></button></div><div className="mt-2 grid grid-cols-2 gap-2"><input value={location.purpose} onChange={e => updateLocation(location.id, { purpose: e.target.value })} placeholder="用途" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/><input value={location.distance} onChange={e => updateLocation(location.id, { distance: e.target.value })} placeholder="距离" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/></div><textarea value={location.description} onChange={e => updateLocation(location.id, { description: e.target.value })} placeholder="地点介绍" rows={2} className="mt-2 w-full resize-none rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/><div className="mt-1 flex gap-3 text-[10px] text-slate-500"><label><input type="checkbox" checked={!!location.isHome} onChange={e => updateLocation(location.id, { isHome: e.target.checked })}/> 家</label><label><input type="checkbox" checked={!!location.isWork} onChange={e => updateLocation(location.id, { isWork: e.target.checked })}/> 工作</label></div></div>)}</div></> : <><div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-600">关系档案</span><button onClick={addNpc} className="text-xs text-indigo-600"><Plus className="inline"/> 新 NPC</button></div><div className="mt-2 space-y-2">{currentNpcs.map(npc => <div key={npc.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex gap-2"><input value={npc.name} onChange={e => updateNpc(npc.id, { name: e.target.value })} className="min-w-0 flex-1 text-sm font-bold text-slate-700 outline-none"/><button onClick={() => setNpcData(prev => ({ ...prev, npcs: prev.npcs.filter(item => item.id !== npc.id) }))} className="text-slate-300 hover:text-rose-500"><Trash size={15}/></button></div><div className="mt-2 grid grid-cols-2 gap-2"><input value={npc.age} onChange={e => updateNpc(npc.id, { age: e.target.value })} placeholder="年龄" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/><input value={npc.gender} onChange={e => updateNpc(npc.id, { gender: e.target.value })} placeholder="性别" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/><input value={npc.role} onChange={e => updateNpc(npc.id, { role: e.target.value })} placeholder="身份 / 职业" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/><input value={npc.relation} onChange={e => updateNpc(npc.id, { relation: e.target.value })} placeholder="与角色关系" className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/></div><textarea value={npc.description} onChange={e => updateNpc(npc.id, { description: e.target.value })} placeholder="人物介绍、常出现地点、相处方式" rows={3} className="mt-2 w-full resize-none rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"/></div>)}{!currentNpcs.length && <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400">识别后会在这里生成 NPC 关系档案</div>}</div></>}
      </div><div className="border-t border-slate-200 bg-white/80 px-5 py-3 text-[10px] text-slate-400">数据保存在当前角色中，不会修改原世界书。</div>
    </div>
  </div>;
};
export default WorldSpaceModal;
