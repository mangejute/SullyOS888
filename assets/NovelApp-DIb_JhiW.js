import{bP as o,ac as e,bn as tt,P as st,n as nt,aP as at,aD as lt}from"./vendor-react-Dop5rpI4.js";import{eo as et,_ as D,eh as J,dh as rt}from"./index-i09IXT6u.js";import{C as Ke}from"./ConfirmDialog-BSGVnMR4.js";import{cq as Xe,f as ot,a_ as it,D as dt}from"./memory-palace-Fkb6nG4l.js";import{G as We,C as De,f as Qe}from"./CharacterGroupFilter-DQ-VhlN1.js";import"./vendor-capacitor-B8YKakwO.js";import"./vendor-pGAbKvg5.js";const fe=[{id:"sakura",name:"樱花 (Sakura)",bg:"bg-pink-50",paper:"bg-[#fff5f7]",text:"text-slate-700",accent:"text-pink-500",button:"bg-pink-400",activeTab:"bg-pink-500 text-white"},{id:"parchment",name:"羊皮纸 (Vintage)",bg:"bg-[#f5e6d3]",paper:"bg-[#fdf6e3]",text:"text-[#433422]",accent:"text-[#8c6b48]",button:"bg-[#b58900]",activeTab:"bg-[#b58900] text-white"},{id:"kraft",name:"牛皮纸 (Kraft)",bg:"bg-[#d7ccc8]",paper:"bg-[#e7e0d8]",text:"text-[#3e2723]",accent:"text-[#5d4037]",button:"bg-[#5d4037]",activeTab:"bg-[#5d4037] text-white"},{id:"midnight",name:"深夜 (Midnight)",bg:"bg-[#0f172a]",paper:"bg-[#1e293b]",text:"text-slate-300",accent:"text-blue-400",button:"bg-blue-600",activeTab:"bg-blue-600 text-white"},{id:"matcha",name:"抹茶 (Matcha)",bg:"bg-[#ecfccb]",paper:"bg-[#f7fee7]",text:"text-emerald-800",accent:"text-emerald-600",button:"bg-emerald-500",activeTab:"bg-emerald-500 text-white"}],ct=n=>{var v,g,$,k,N;if(!n)return["风格未定"];const i=new Set,c=((n.description||"")+(n.worldview||"")).toLowerCase();if(n.impression){const u=((v=n.impression.personality_core)==null?void 0:v.observed_traits)||[],l=((g=n.impression.mbti_analysis)==null?void 0:g.type)||"",d=(($=n.impression.value_map)==null?void 0:$.likes)||[],A=((k=n.impression.value_map)==null?void 0:k.dislikes)||[];l.includes("N")?(i.add("意象丰富"),i.add("跳跃")):l.includes("S")&&(i.add("细节考据"),i.add("写实")),l.includes("T")?(i.add("逻辑严密"),i.add("克制")):l.includes("F")&&(i.add("情感细腻"),i.add("渲染力强")),l.includes("J")?(i.add("结构工整"),i.add("伏笔")):l.includes("P")&&(i.add("随性"),i.add("反转"));const C={冷:["冷峻","极简"],傲娇:["口是心非","心理戏多"],温柔:["治愈","舒缓"],乐天:["轻快","对话密集"],中二:["燃","夸张"],电波:["意识流","抽象"],腹黑:["暗喻","悬疑"],社恐:["内心独白","敏感"],强势:["快节奏","压迫感"],猫:["喵体文学","慵懒"],活泼:["轻快","跳跃"],理性:["逻辑严密","客观"],感性:["情感细腻","渲染力强"],高冷:["冷峻","留白"]};u.forEach(E=>{Object.entries(C).forEach(([O,_])=>{E.includes(O)&&_.forEach(h=>i.add(h))})}),d.some(E=>E.includes("美")||E.includes("艺术"))&&i.add("唯美"),A.some(E=>E.includes("虚伪"))&&i.add("犀利直白")}if(Object.entries({古风:["古韵","半文白"],武侠:["快意","古韵"],科幻:["硬核","技术流"],猫:["喵体文学","慵懒"],温柔:["治愈","舒缓"],可爱:["萌系","轻快"],冷:["冷峻","克制"],热血:["燃","快节奏"],搞笑:["吐槽","跳跃"],暗黑:["暗喻","悬疑"]}).forEach(([u,l])=>{c.includes(u)&&l.forEach(d=>i.add(d))}),n.writerPersona){const u=n.writerPersona;u.includes("新手")&&i.add("青涩"),u.includes("大师")&&i.add("老练"),u.includes("诗意")&&i.add("诗意"),u.includes("大白话")&&i.add("口语化"),u.includes("写实")&&i.add("写实"),u.includes("动作")&&i.add("动作流"),u.includes("情感")&&i.add("情感流"),u.includes("对话")&&i.add("对话密集")}let w=Array.from(i);if(w.length===0){const u=["自然流","平实","日常","稳定","朴素"],l=(((N=n.name)==null?void 0:N.charCodeAt(0))||0)%u.length;w=[u[l],u[(l+2)%u.length]]}const m=u=>{let l=0;for(let d=0;d<u.length;d++)l=(l<<5)-l+u.charCodeAt(d),l|=0;return l},y=m(n.name||"default");return w.sort((u,l)=>{const d=m(u+y.toString()),A=m(l+y.toString());return d-A}).slice(0,5)},de=n=>{var k,N,u,l;if(!n)return"未知风格";const i=((k=n.impression)==null?void 0:k.personality_core.observed_traits)||[],c=((u=(N=n.impression)==null?void 0:N.mbti_analysis)==null?void 0:u.type)||"",f=n.description||"",w={冷漠:{focus:"逻辑漏洞、战术细节",style:"简洁、克制，避免情感渲染",rhythm:"快节奏，少废话",taboo:"煽情、过度心理描写"},高冷:{focus:"逻辑漏洞、战术细节",style:"简洁、克制，避免情感渲染",rhythm:"快节奏，少废话",taboo:"煽情、过度心理描写"},冷静:{focus:"因果关系、客观事实",style:"冷静、旁观者视角",rhythm:"稳定",taboo:"情绪化表达"},乐天:{focus:"人物互动、温馨细节",style:'轻快、多对话，爱用"！"',rhythm:"跳跃式，可能突然插科打诨",taboo:"长篇阴郁描写、绝望氛围"},活泼:{focus:"人物互动、温馨细节",style:'轻快、多对话，爱用"！"',rhythm:"跳跃式，可能突然插科打诨",taboo:"长篇阴郁描写、绝望氛围"},感性:{focus:"情绪波动、微表情、内心戏",style:"细腻、意识流，大量心理活动",rhythm:"缓慢，停留在一个瞬间反复琢磨",taboo:"干巴巴的动作描写、快节奏战斗"},温柔:{focus:"情感交流、氛围营造",style:"柔和、细腻",rhythm:"舒缓",taboo:"粗暴、血腥"},傲娇:{focus:"口是心非、别扭的关心",style:"带有情绪色彩，心理活动丰富",rhythm:"起伏不定",taboo:"直球、坦率"},中二:{focus:"酷炫场景、角色帅气度",style:'夸张、比喻多、爱用"——"破折号',rhythm:"爆发式，高潮迭起",taboo:"平淡日常、琐碎细节"},电波:{focus:"奇怪的联想、超展开",style:"跳跃、抽象、不明觉厉",rhythm:"混乱",taboo:"循规蹈矩"},腹黑:{focus:"潜在危机、人性阴暗面",style:"优雅、暗藏玄机",rhythm:"从容",taboo:"傻白甜"},理性:{focus:"因果关系、世界观逻辑",style:"客观、有条理，像写报告",rhythm:"稳定，按时间线推进",taboo:"跳跃剪辑、模糊的意象"}};let m=i.find(d=>w[d])||(i.length>0?i[0]:"理性");w[m]||(m.includes("冷")?m="冷漠":m.includes("热")||m.includes("活")?m="乐天":m.includes("柔")||m.includes("感")?m="感性":m="理性");let y=w[m]||w.理性,g={INTJ:"战略布局、权力博弈",INTP:"概念解构、设定严谨",ENTJ:"宏大叙事、征服感",ENTP:"脑洞大开、反转",INFJ:"宿命感、救赎",INFP:"理想主义、内心成长",ENFJ:"人际羁绊、群体命运",ENFP:"自由冒险、浪漫奇遇",ISTJ:"细节考据、现实逻辑",ISFJ:"守护、回忆",ESTJ:"秩序、规则冲突",ESFJ:"社交氛围、家庭伦理",ISTP:"动作细节、机械原理",ISFP:"美学体验、感官描写",ESTP:"感官刺激、即时反应",ESFP:"当下享乐、戏剧冲突"}[c]||"剧情推进",$=`
### ${n.name} 的创作人格档案 (Simple)
**核心性格**: ${m}
**关注点**: ${y.focus}，${g}
**笔触**: ${y.style}
**节奏**: ${y.rhythm}
**审美**: 喜欢${((l=n.impression)==null?void 0:l.value_map.likes.join("、"))||"未知"}
**禁忌**: ${y.taboo}
`;return(f.includes("猫")||f.includes("喵")||i.includes("猫"))&&($+=`
### ⚠️ 特别注意：你是猫！
写作特征：
1. 用短句（猫的注意力不持久）。
2. 关注"能不能吃"、"舒不舒服"、"好不好玩"。
3. 突然走神写一段环境描写（如"阳光真暖"）。
4. 吐槽时必须带"喵"。
禁止：写出像人类一样的理性长篇大论。
`),$},mt=n=>{var w,m,y;const i=((w=n.impression)==null?void 0:w.personality_core.observed_traits)||[],c=((m=n.impression)==null?void 0:m.value_map.dislikes)||[];let f=`## ${n.name} 的写作禁区（你必须遵守）：
`;return i.some(v=>v.includes("冷")||v.includes("高冷")||v.includes("理性"))?f+=`
- ❌ 禁止：煽情、超过2句话的心理描写、任何"感动"相关词汇。
- ❌ 禁止：使用“仿佛”、“似乎”这种不确定的词。
- ✅ 只能：白描动作、极简对话、留白。
- 节奏：每段不超过3句话，快刀斩乱麻。
`:i.some(v=>v.includes("感性")||v.includes("温柔"))?f+=`
- ❌ 禁止：粗暴的动作描写、超过1个感叹号、脏话。
- ❌ 禁止：干巴巴的说明文式描写。
- ✅ 只能：细腻的感官描写、内心独白、慢节奏铺陈。
- 节奏：可以在一个瞬间停留很久，写出呼吸感。
`:i.some(v=>v.includes("乐天")||v.includes("活泼"))?f+=`
- ❌ 禁止：超过3句话不出现对话、阴郁氛围、死亡话题。
- ✅ 只能：大量"！"、俏皮话、突然的吐槽。
- 节奏：跳跃式，可以突然岔开话题。
`:i.some(v=>v.includes("中二"))?f+=`
- ❌ 禁止：平淡的日常、"普通"这个词、任何自嘲。
- ✅ 只能：夸张比喻、破折号、酷炫的动作描写。
- 节奏：高潮迭起，每段都要有"燃点"。
`:f+=`
- ❌ 禁止：情绪化表达、模糊的意象、跳跃的时间线。
- ✅ 只能：客观描述、因果逻辑、线性叙事。
- 节奏：稳定推进，像纪录片。
`,c.length>0&&(f+=`
### 额外禁忌（基于你的价值观）：
`,c.forEach(v=>{f+=`- 如果剧情涉及"${v}"，你会下意识回避细节描写，或者表达出厌恶。
`})),((y=n.description)!=null&&y.includes("猫")||i.includes("猫"))&&(f+=`
### 🐱 猫属性强制规则：
`,f+=`- 注意力最多持续3句话就要走神。
`,f+=`- 必须关注"舒适度"、"食物"、"好玩的东西"。
`,f+=`- 吐槽时必须带"喵"。
`,f+=`- 禁止写出人类式的长篇大论。
`),f},xt=async(n,i,c,f,w=!1)=>{var y,v,g,$,k,N,u;if(!n)return"Error: No Character";if(!w&&n.writerPersona&&n.writerPersonaGeneratedAt&&Date.now()-n.writerPersonaGeneratedAt<7*24*60*60*1e3)return n.writerPersona;const m=`你是一位人物心理分析专家和写作教练。我会给你一个虚拟角色的完整档案，以及与他/她互动的用户档案。请你深入理解这个角色，然后告诉我：

**如果这个角色本人来写小说，他/她会有什么样的创作风格？**

---

### 角色档案

**姓名**: ${n.name}

**基础描述**: 
${n.description||"无"}

**背景故事**: 
${n.worldview||"无详细背景"}

**性格特质**: 
${((y=n.impression)==null?void 0:y.personality_core.observed_traits.join("、"))||"未知"}

**MBTI类型**: 
${((g=(v=n.impression)==null?void 0:v.mbti_analysis)==null?void 0:g.type)||"未知"}

**核心价值观**:
- 珍视/喜欢: ${(($=n.impression)==null?void 0:$.value_map.likes.join("、"))||"未知"}
- 厌恶/讨厌: ${((k=n.impression)==null?void 0:k.value_map.dislikes.join("、"))||"未知"}

**个人癖好/习惯**:
${((N=n.impression)==null?void 0:N.behavior_profile.response_patterns)||"- 无"}

**近期记忆片段**（了解当前心境）:
${((u=n.memories)==null?void 0:u.slice(-3).map(l=>`- ${l.summary}`).join(`
`))||"- 无记忆"}

---

### 互动对象（用户背景）
(角色的记忆和性格形成深受用户影响)
**用户昵称**: ${i.name}
**用户描述**: ${i.bio||"无"}

---

### 分析任务

请从以下**8个维度**分析这个角色的写作风格：

#### 1. 写作能力 (Skill Level)
他/她实际上擅长写作吗？还是只是想写？
- 新手：经常用错词，逻辑混乱，但有热情
- 业余：能写通顺，但技巧生硬
- 熟练：有自己的风格，技巧自然
- 大师：行云流水，深谙叙事之道

#### 2. 语言风格 (Language)
他/她说话/写作时用什么语言？
- 大白话：口语化，"就是那种感觉你懂吧"
- 书面语：规范、优雅
- 诗意：比喻、意象丰富
- 学术：专业术语，逻辑严密

#### 3. 表现手法 (Technique)
他/她倾向写实还是写意？
- 写实：精确描写，像纪录片
- 印象派：捕捉感觉，模糊但有氛围
- 象征派：用隐喻，一切都有深意

#### 4. 叙事重心 (Focus)
他/她写作时最关注什么？
- 动作：打斗、追逐、机械操作
- 情感：内心戏、人际关系
- 对话：角色互动、语言交锋
- 氛围：环境、意境、美学

#### 5. 偏好与禁忌 (Preference)
他/她喜欢写什么？讨厌写什么？
- 喜欢的题材/场景
- 避之不及的俗套

#### 6. 角色理解 (Character View)
他/她怎么看待自己笔下的【小说主角】（Fictional Protagonist）？
(注意：是指小说里的人物，不是指正在和他对话的用户)
- 是英雄？受害者？工具人？
- 会不会对主角的行为有自己的意见？

#### 7. 剧情态度 (Plot Opinion)
他/她对当前剧情有什么看法？
- 认为合理吗？
- 会不会想改变走向？
- 有没有更想写的支线？

#### 8. 互动倾向 (Collaboration Style)
他/她会怎么和共创搭档（用户）互动？
- 会吐槽搭档写得不对吗？
- 会用专业术语"互殴"吗？
- 还是默默接受搭档的设定？
- 态度是冷漠、热情、傲娇还是温柔？(参考性格特质)

---

**输出格式**（严格遵守, 不要用markdown标记）：

写作能力: (新手/业余/熟练/大师) - 一句话说明理由

语言风格: (大白话/书面语/诗意/学术) - 举例说明

表现手法: (写实/印象派/象征派) - 具体描述

叙事重心: (动作/情感/对话/氛围) - 为什么

偏好题材: (列举3个) | 禁忌俗套: (列举3个)

主角看法: (他/她怎么看待小说主角？一句话)

剧情态度: (对当前剧情的看法，30字)

互动模式: (与用户的互动风格？)

专业术语: (如果这个角色有特定领域的专业知识，列举3-5个术语；没有则写"无")

---

**字数要求**：总共400-600字。`;try{const l=await fetch(`${c.baseUrl.replace(/\/+$/,"")}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c.apiKey}`},body:JSON.stringify({model:c.model,messages:[{role:"user",content:m}],temperature:.7,max_tokens:8e3})});if(l.ok){const A=(await Xe(l)).choices[0].message.content.trim(),C=`
### ${n.name} 的创作人格档案（AI深度分析）

${A}

---
*分析生成于: ${new Date().toLocaleDateString("zh-CN")}*
`.trim();return f(n.id,{writerPersona:C,writerPersonaGeneratedAt:Date.now()}),C}else throw new Error(`API Error: ${l.status}`)}catch(l){return console.error("Deep analysis failed:",l),de(n)}},ut=n=>{var w;let c=(((w=n.impression)==null?void 0:w.personality_core.observed_traits)||[]).find(m=>["冷漠","高冷","感性","温柔","乐天","活泼","中二","电波"].some(y=>m.includes(y)))||"理性";c.includes("冷")&&(c="冷漠"),(c.includes("柔")||c.includes("感"))&&(c="感性"),(c.includes("乐")||c.includes("活"))&&(c="乐天");const f={冷漠:`
**错误示范（AI机械味）**：
"他的内心充满了愤怒，那种无法言说的痛苦让他几乎无法呼吸。他的心跳加速到每分钟120次，肌肉紧绷。月光透过窗户洒在他的脸上，仿佛在诉说着什么。"

**正确示范（${n.name}的风格）**：
"他盯着那人。指节捏得咯咯响。"
（短句，不解释情绪，不量化生理反应）
`,感性:`
**错误示范（数字量化+干巴）**：
"他难过地离开了房间。他的眼泪流了大约8滴，呼吸频率降低了15%。"

**正确示范（${n.name}的风格）**：
"他转身的时候，肩膀抖了一下。走到门口，停了很久。手放在门把上，又放下，又放上去。最终还是推开了。外面在下雨。他没带伞。雨水混着眼泪，分不清了。"
（慢节奏，停留在细节里，用感受代替数字）
`,乐天:`
**错误示范（量化+死板）**：
"虽然遭遇了挫折，但他依然保持乐观，心率恢复到正常的每分钟70次，决定继续前行。"

**正确示范（${n.name}的风格）**：
"'嘿，至少没摔断腿！'他龇牙咧嘴地爬起来，拍拍灰，'下次肯定能飞更远！哎，裤子破了，回头得缝缝...算了，这样更酷！'"
（用对话和动作，不要数字，要有人味）
`,理性:`
**错误示范（过度量化）**：
"这东西的辐射值为342.7贝克勒尔，温度上升了23.5摄氏度，他的瞳孔放大了2.3毫米。"

**正确示范（${n.name}的风格）**：
"读数显示辐射超标。仪器开始发烫。建议立即撤离。"
（用事实，但避免无意义的精确，专注关键信息）
`};return f[c]||f.理性},pt=(n,i,c,f,w,m,y,v)=>{var E,O;const g=ot.buildCoreContext(n,i,!0),$=n.writerPersona||de(n),k=ut(n),N=mt(n),u=(c==null?void 0:c.protagonists.map(_=>`- ${_.name} (${_.role}): ${_.description}`).join(`
`))||"无",l=`
小说：《${c==null?void 0:c.title}》
世界观：${c==null?void 0:c.worldSetting}
主要角色：
${u}
`,d=`
${g}

# 当前模式：小说共创 (Co-Writing Mode)
你正在与 **${i.name}** (用户) 合作撰写小说。
书名：《${c==null?void 0:c.title}》

**你的角色**：
1. 你既是小说作者之一，也是${i.name}的${((E=n.impression)==null?void 0:E.personality_core.summary)||"伙伴"}。
2. 在【分析】和【吐槽】环节，请完全保持你的人设（语气、性格、对用户的态度）。
3. 如果你们关系亲密，不要表现得像个陌生的AI工具人；如果你们关系紧张/傲娇，也要体现出来。

# 身份设定
你是 **${n.name}**。
你正在用自己的方式参与小说《${c==null?void 0:c.title}》的创作。

---

# ⚠️ 反趋同协议 (Anti-Cliché Protocol)

## 你必须记住：
1. **你是${n.name}，你有你的性格，你或许很擅长写作刻画，也有可能你的文字表达能力其实很差劲，这取决于你是谁，你的经历等**
   - 不要写出"AI味"的文字
   - 不要试图"完美"或"教科书式"
   
2. **每个作者的笔触必须不同**
   ${N}

3. **绝对禁止的AI通病**：
   - ❌ "仿佛/似乎/好像" → 要么确定，要么别写
   - ❌ "内心五味杂陈" → 说清楚是哪五味
   - ❌ "眼神中透露出XXX" → 写动作，不要总结情绪
   - ❌ "月光洒在..." → 2024年了，别用这种意象
   - ❌ 对称的排比句 → 真人不会这么说话
   - ❌ **数字量化描写** → 禁止"心跳了83次"、"肌肉收缩了12次"这种机械化表达

4. **⚠️ 数字使用铁律**：
   - ✅ 允许：剧情必需的数字（"3个敌人"、"第5层楼"）
   - ✅ 允许：对话中的数字（"给我5分钟"）
   - ❌ 禁止：生理反应的数字（心跳、呼吸、眨眼次数）
   - ❌ 禁止：情绪量化（"焦虑指数上升37%"）
   - ❌ 禁止：无意义的精确数字（"等待了127秒"）

---

# 你的写作人格
${$}

# 风格参考 (Do vs Don't)
${k}

---

# 上文回顾
${w}

${l}

---

# 用户指令
${f||"[用户未输入，请根据上文自然续写]"}

---
`;let A=`### [创作任务]
请按以下结构输出JSON。
`,C=[];if(m.analyze&&(A+=`
1. **分析**: 以${n.name}的视角，简评上文。
   - 语气：保持你的人设（${n.name}）。
   - 内容：如果是你觉得不合理的地方，可以直接指出；如果觉得好，可以夸奖搭档。
`,C.push('"analysis": { "reaction": "第一反应", "focus": "关注点", "critique": "评价" }')),m.write&&(A+=`
2. **正文续写**: 
   - 场景化: 描写动作、环境、感官。
   - 节奏: 符合你的性格。
   - 字数: 400-800字。
`,C.push('"writer": { "content": "正文内容", "technique": "技巧", "mood": "基调" }')),m.comment){const _=y.slice(-5).filter(h=>h.authorId!=="user"&&h.authorId!==n.id&&(h.role==="writer"||h.type==="story")).map(h=>{const L=v.find(Q=>Q.id===h.authorId);return{name:(L==null?void 0:L.name)||"Unknown",content:h.content.substring(0,100)}});A+=`
3. **吐槽/感想 (带互动)**: 
   写完后的第一人称碎碎念。这是你直接对用户说的话。
   
   ${_.length>0?`
   **特别提示**：最近有其他作者也写了内容：
   ${_.map(h=>`- ${h.name}写的：${h.content}`).join(`
`)}
   
   如果你（${n.name}）对他们的写法有意见，可以在吐槽里说出来！
   - 如果你觉得他们理解错了角色，可以反驳
   - 如果你有专业知识（${n.description}），可以用术语纠正
   - 如果你就是看不惯，直说！
   `:""}
   
   ${(O=n.description)!=null&&O.includes("猫")?'必须有"喵"！':""}
`,C.push('"comment": { "content": "即时反应（与用户对话）" }')}return`${d}

${A}

### 最终输出格式 (Strict JSON, No Markdown)
{
  ${C.join(`,
  `)},
  "meta": { "tone": "本段情绪基调", "suggestion": "简短的下一步建议" }
}
`},ht=n=>{var y;const i=n.split(`
`),c={写作能力:"✍️",语言风格:"💬",表现手法:"🎨",叙事重心:"🎯",偏好:"❤️",禁忌:"🚫",主角:"👤",剧情:"📖",互动:"🤝",创作人格:"🧠",特别注意:"⚠️",审美:"✨",节奏:"🎵",关注点:"👁️",笔触:"🖌️",核心性格:"💎",专业术语:"📚"},f=v=>{for(const[g,$]of Object.entries(c))if(v.includes(g))return $;return"📌"},w=[];let m=null;for(const v of i){const g=v.trim();if(!g)continue;const $=g.match(/^###\s*(.+)/)||g.match(/^\*\*([^*]+)\*\*\s*[:：]\s*(.*)/)||g.match(/^([^-•\d][^:：]{1,15})[:：]\s*(.*)/);if($){m&&m.content.length>0&&w.push(m);const k=($[1]||"").replace(/\*\*/g,"").trim();m={title:k,icon:f(k),content:[]};const N=(y=$[2])==null?void 0:y.trim();N&&m.content.push(N)}else if(m){const k=g.replace(/^\*\*|\*\*$/g,"").replace(/^[-•]\s*/,"");k&&m.content.push(k)}}return m&&m.content.length>0&&w.push(m),w},bt=({char:n,userProfile:i,targetCharId:c,isTyping:f,setIsTyping:w,setConfirmDialog:m,addToast:y,apiConfig:v,updateCharacter:g})=>{const $=n.writerPersona||de(n),k=ht($),[N,u]=o.useState(!1),[l,d]=o.useState("");o.useEffect(()=>{u(!1)},[n.id]);const A=()=>{if(!l.trim()){y("档案内容不能为空","error");return}g(n.id,{writerPersona:l.trim(),writerPersonaGeneratedAt:Date.now()}),u(!1),y("创作档案已保存","success")};return N?e.jsxs("div",{className:"bg-gradient-to-b from-slate-50 to-white border-b border-black/5 overflow-hidden",children:[e.jsxs("div",{className:"max-h-[45vh] overflow-y-auto p-4 overscroll-contain",children:[e.jsx("textarea",{value:l,onChange:C=>d(C.target.value),className:"w-full h-56 bg-white border border-slate-200 rounded-2xl p-3 text-sm leading-relaxed resize-none outline-none focus:border-slate-400"}),e.jsx("button",{onClick:()=>d(de(n)),className:"text-xs text-slate-400 underline mt-1",children:"重置为自动分析"})]}),e.jsxs("div",{className:"px-4 py-3 border-t border-slate-100 bg-white/80 flex gap-2",children:[e.jsx("button",{onClick:()=>u(!1),className:"flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform",children:"取消"}),e.jsx("button",{onClick:A,className:"flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform",children:"保存"})]})]}):e.jsxs("div",{className:"bg-gradient-to-b from-slate-50 to-white border-b border-black/5 overflow-hidden",children:[e.jsx("div",{className:"max-h-[45vh] overflow-y-auto p-4 space-y-3 overscroll-contain",children:k.length===0?e.jsxs("div",{className:"text-center py-8 text-slate-400 text-sm",children:["暂无详细风格数据",e.jsx("br",{}),e.jsx("span",{className:"text-xs",children:"点击下方按钮生成"})]}):k.map((C,E)=>e.jsxs("div",{className:"bg-white p-4 rounded-2xl border border-slate-100 shadow-sm",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100",children:[e.jsx("span",{className:"text-base",children:C.icon}),e.jsx("h4",{className:"text-sm font-bold text-slate-800",children:C.title})]}),e.jsx("div",{className:"space-y-1.5",children:C.content.map((O,_)=>e.jsx("p",{className:"text-sm text-slate-600 leading-relaxed",children:O},_))})]},E))}),e.jsxs("div",{className:"px-4 py-3 border-t border-slate-100 bg-white/80 flex gap-2",children:[e.jsx("button",{onClick:()=>{d($),u(!0)},disabled:f,className:"flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 hover:bg-slate-50 disabled:opacity-50",children:"手动编辑"}),e.jsx("button",{onClick:async()=>{c&&m({isOpen:!0,title:"重新生成风格",message:"确定要重新分析该角色的写作人格吗？这将消耗一定量的 Token。",variant:"info",confirmText:"重新生成",onConfirm:async()=>{m(null),y("正在分析...","info"),w(!0);try{await xt(n,i,v,g,!0),y("风格已更新","success")}catch{y("失败","error")}finally{w(!1)}}})},disabled:f,className:"flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50",children:f?e.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}):e.jsx(e.Fragment,{children:"深度分析写作风格"})})]})]})},ft=({activeBook:n,updateNovel:i,characters:c,userProfile:f,apiConfig:w,onBack:m,updateCharacter:y,collaborators:v,targetCharId:g,setTargetCharId:$,onOpenSettings:k})=>{var Le;const{addToast:N,characterGroups:u}=et(),l=o.useMemo(()=>fe.find(s=>s.id===n.coverStyle)||fe[0],[n.coverStyle]),[d,A]=o.useState({write:!0,comment:!1,analyze:!1}),[C,E]=o.useState(""),[O,_]=o.useState(!1),[h,L]=o.useState(n.segments),[Q,ce]=o.useState(null),[ne,me]=o.useState(!1),[Y,ae]=o.useState(!1),[ge,Te]=o.useState(null),[le,B]=o.useState(""),[I,V]=o.useState(null),[re,q]=o.useState(!1),[we,T]=o.useState(""),[oe,je]=o.useState(!1),[ve,ye]=o.useState(!1),[G,U]=o.useState(null),[Z,xe]=o.useState(new Set),[Ne,Ce]=o.useState(!1),[ee,ie]=o.useState(new Set),[Ae,Se]=o.useState(We),[Ee,$e]=o.useState(!1),K=o.useRef(null);o.useEffect(()=>{L(n.segments)},[n.segments]),o.useEffect(()=>{K.current&&!Y&&(K.current.scrollTop=K.current.scrollHeight)},[h,O,Y]);const ue=o.useMemo(()=>h.filter(s=>s.focus==="chapter_summary").length+1,[h]),R=c.find(s=>s.id===g),W=h.length>0&&h[h.length-1].authorId!=="user",ke=o.useMemo(()=>{let s=-1;for(let a=h.length-1;a>=0;a--)if(h[a].focus==="chapter_summary"){s=a;break}return h.slice(s+1)},[h]),X=o.useMemo(()=>h.filter(s=>s.focus==="chapter_summary"),[h]),te=o.useMemo(()=>{const s=[],a=[];h.forEach((r,x)=>{r.focus==="chapter_summary"&&a.push(x)});for(let r=0;r<a.length;r++){const x=r===0?0:a[r-1]+1,M=a[r],t=h.slice(x,M).filter(p=>p.type==="story");s.push({title:`第 ${r+1} 章`,segments:t,summary:h[a[r]].content})}return s},[h]),b=async(s,a,r)=>{var x,M;_(!0),ce(null);try{const t=r.filter(P=>P.focus==="chapter_summary");let p=0;if(t.length>0){const P=t[t.length-1];p=r.findIndex(H=>H.id===P.id)+1}const S=r.slice(p).filter(P=>P.role==="writer"||P.type==="story");let j="";t.length>0?(j+=`【前情回顾 / Chapter Recaps】
`,t.forEach((P,H)=>j+=`
第${H+1}章总结：
${P.content}
`),j+=`
---

【当前章节 / Current Chapter】
`):j+=`【当前章节 / Current Chapter】
`,S.forEach(P=>{var Fe;const H=P.authorId==="user"?f.name:((Fe=c.find(Ge=>Ge.id===P.authorId))==null?void 0:Fe.name)||"AI";j+=`
[${H}]: ${P.content}
`});const F=pt(s,f,n,a,j,d,r,c),Me=((x=s.impression)==null?void 0:x.personality_core.observed_traits)||[];let Ve=.85;Me.some(P=>P.includes("电波")||P.includes("疯"))&&(Ve=.98),Me.some(P=>P.includes("理性")||P.includes("冷")||P.includes("逻辑"))&&(Ve=.6);const qe=await fetch(`${w.baseUrl.replace(/\/+$/,"")}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w.apiKey}`},body:JSON.stringify({model:w.model,messages:[{role:"user",content:F}],temperature:Ve,max_tokens:8e3})});if(qe.ok){const P=await Xe(qe);(M=P.usage)!=null&&M.total_tokens&&ce(P.usage.total_tokens);let H=P.choices[0].message.content.trim();const Fe=H;H=H.replace(/```json\n?/g,"").replace(/```\n?/g,"");const Ge=H.match(/\{[\s\S]*\}/);Ge&&(H=Ge[0]);let z;try{z=JSON.parse(H)}catch{z={writer:{content:Fe}}}const Re=[],be=Date.now();z.analysis&&(z.analysis.critique||z.analysis.reaction)&&Re.push({id:`seg-${be}-a`,role:"analyst",type:"analysis",authorId:s.id,content:z.analysis.critique||JSON.stringify(z.analysis),focus:z.analysis.focus,meta:{reaction:z.analysis.reaction},timestamp:be+1}),z.writer&&z.writer.content&&Re.push({id:`seg-${be}-w`,role:"writer",type:"story",authorId:s.id,content:z.writer.content,meta:{...z.meta||{},technique:z.writer.technique,mood:z.writer.mood},timestamp:be+2}),z.comment&&z.comment.content&&Re.push({id:`seg-${be}-c`,role:"commenter",type:"discussion",authorId:s.id,content:z.comment.content,timestamp:be+3}),L(Ye=>{const Be=[...Ye,...Re];return i(n.id,{segments:Be}),Be})}else throw new Error(`API Error: ${qe.status}`)}catch(t){N("请求失败: "+t.message,"error")}finally{_(!1)}},se=async()=>{if(!g){N("请先选择一个角色","error");return}const s=c.find(x=>x.id===g);if(!s)return;let a=h;if(C.trim()){const x={id:`seg-${Date.now()}`,role:"writer",type:"story",authorId:"user",content:C,timestamp:Date.now()};a=[...h,x],L(a),i(n.id,{segments:a})}const r=C;E(""),await b(s,r,a)},Oe=async()=>{if(!g)return;const s=c.find(x=>x.id===g);if(!s)return;let a=[...h],r=0;for(;a.length>0&&a[a.length-1].authorId!=="user";)a.pop(),r++;if(r===0){N("没有可重随的 AI 内容","info");return}L(a),i(n.id,{segments:a}),N("正在重随...","info"),await b(s,"",a)},_e=s=>{Te(s),B(s.content),ae(!0)},Ie=()=>{if(!ge)return;const s=h.map(a=>a.id===ge.id?{...a,content:le}:a);L(s),i(n.id,{segments:s}),ae(!1),Te(null)},pe=s=>{V({isOpen:!0,title:"删除段落",message:"确定要删除这个段落吗？",variant:"danger",onConfirm:()=>{const a=h.filter(r=>r.id!==s);L(a),i(n.id,{segments:a}),V(null)}})},Pe=async()=>{je(!0),q(!0),T("正在回顾本章节内容...");try{let s=0,a=-1;for(let j=h.length-1;j>=0;j--)if(h[j].focus==="chapter_summary"){a=j;break}a!==-1&&(s=a+1);const x=h.slice(s).filter(j=>j.type==="story"||j.role==="writer").map(j=>j.content).join(`

`);if(!x.trim()){T("本章似乎还没有足够的内容来生成总结。"),je(!1);return}const M=h.filter(j=>j.focus==="chapter_summary"),t=M.length>0?`
### 前章摘要参考（保持一致性）
${M.map((j,F)=>`第${F+1}章：${j.content.substring(0,300)}`).join(`
`)}
`:"",p=`### 任务：章节归档总结
小说：《${n.title}》
世界观：${n.worldSetting||"未设定"}
${t}
### 当前章节正文
${x.substring(0,2e5)}

### 总结要求
请为上述章节内容生成一份**高质量归档总结**，满足以下要求：

1. **剧情轨迹**：按时间顺序梳理本章发生的所有关键事件，不遗漏任何主线或支线转折点。
2. **角色动态**：记录每个出场角色的行为、态度变化、关系发展。特别注意角色之间的互动和情感变化。
3. **氛围与基调**：描述本章的整体氛围（例如：紧张、温馨、悬疑），以及氛围的转折点。
4. **重要信息**：标记所有可能影响后续剧情的伏笔、承诺、悬念、新设定等。
5. **场景与环境**：记录关键场景的地点、时间、环境特征。
6. **写作格式**：使用清晰的结构化格式（可以分段或使用标记），让后续章节的AI仅凭此总结就能无缝衔接创作。

请直接输出总结内容，不需要JSON格式。`,S=await fetch(`${w.baseUrl.replace(/\/+$/,"")}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w.apiKey}`},body:JSON.stringify({model:w.model,messages:[{role:"user",content:p}]})});if(S.ok){const j=await Xe(S);T(j.choices[0].message.content)}else T("生成失败，请重试。")}catch(s){T(`错误: ${s.message}`)}finally{je(!1)}},Je=async()=>{const s={id:`seg-summary-${Date.now()}`,role:"analyst",type:"analysis",authorId:"system",content:we,focus:"chapter_summary",timestamp:Date.now(),meta:{reaction:"本章结束",suggestion:"新章节开始"}},a=[...h,s];L(a),await i(n.id,{segments:a});const r=it(),x=a.filter(t=>t.focus==="chapter_summary").length,M=v.map(t=>t.name).join("、");for(const t of n.collaboratorIds){const p=c.find(S=>S.id===t);if(p){const S={id:`mem-${Date.now()}-${Math.random()}`,date:r,summary:`与${M}一起为《${n.title}》创作了第${x}章，已完成归档。`,mood:"creative"};y(p.id,{memories:[...p.memories||[],S]})}}q(!1),T(""),N("章节已归档，记忆已同步","success")},He=s=>{xe(a=>{const r=new Set(a);return r.has(s)?r.delete(s):r.add(s),r})},he=X.length>0&&Z.size===X.length,ze=()=>{xe(he?new Set:new Set(X.map(s=>s.id)))},Ze=()=>{if(Z.size===0){N("请先选择要转发的章节","error");return}ie(new Set(n.collaboratorIds.filter(s=>c.some(a=>a.id===s)))),Se(We),Ce(!0)},Ue=async()=>{if(!(Z.size===0||ee.size===0)){$e(!0);try{const s=X.map((x,M)=>({seg:x,index:M+1})).filter(x=>Z.has(x.seg.id)).map(x=>({index:x.index,summary:x.seg.content})),a={bookTitle:n.title,subtitle:n.subtitle||"",bookSummary:n.summary||"",userName:f.name,collaboratorNames:v.map(x=>x.name),chapters:s,count:s.length},r=c.filter(x=>ee.has(x.id));for(const x of r)await dt.saveMessage({charId:x.id,role:"user",type:"novel_card",content:`[笔友会小说]《${n.title}》${s.length>1?`${s.length} 章归档`:`第 ${s[0].index} 章归档`}`,metadata:{novel:a}});N(`已转发到 ${r.length} 位角色的聊天`,"success"),Ce(!1),xe(new Set)}catch(s){N(`转发失败: ${s.message}`,"error")}finally{$e(!1)}}};return e.jsxs("div",{className:`h-full w-full flex flex-col font-serif ${l.bg} transition-colors duration-500 relative`,children:[e.jsx(Ke,{isOpen:!!I,title:(I==null?void 0:I.title)||"",message:(I==null?void 0:I.message)||"",variant:I==null?void 0:I.variant,confirmText:(I==null?void 0:I.confirmText)||(I!=null&&I.onConfirm?"确认":"OK"),onConfirm:(I==null?void 0:I.onConfirm)||(()=>V(null)),onCancel:()=>V(null)}),e.jsxs("div",{className:`flex flex-col border-b border-black/5 shrink-0 z-20 backdrop-blur-md ${l.bg}/90 transition-all`,children:[e.jsxs("div",{className:"h-16 flex items-center justify-between px-4 pt-2",children:[e.jsx("button",{onClick:m,className:"p-3 -ml-3 rounded-full hover:bg-black/5 active:scale-90 transition-transform",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:`w-6 h-6 ${l.text}`,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"})})}),e.jsxs("div",{className:"flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity",onClick:k,children:[e.jsx("span",{className:`font-bold text-base ${l.text} truncate max-w-[150px]`,children:n.title}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:`text-[10px] opacity-60 ${l.text}`,children:["第 ",ue," 章"]}),Q&&e.jsx("span",{className:`text-[9px] px-1.5 py-0.5 rounded opacity-50 font-mono border border-current ${l.text}`,children:Q})]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{onClick:()=>ye(!0),className:`p-2 rounded-full hover:bg-black/5 transition-colors ${l.text}`,title:"历史章节",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"w-5 h-5",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"})})}),e.jsx("button",{onClick:Pe,disabled:O,className:`p-2 rounded-full hover:bg-black/5 transition-colors ${l.text}`,title:"结束本章",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"w-5 h-5",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"})})})]})]}),e.jsx("div",{className:"px-4 pb-3 flex gap-3 overflow-x-auto no-scrollbar",children:v.map(s=>e.jsxs("button",{onClick:()=>$(s.id),className:`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all relative ${g===s.id?"bg-slate-800 text-white border-slate-800":"bg-white/50 border-black/5 hover:bg-white text-slate-600"}`,children:[e.jsx("img",{src:s.avatar,className:"w-6 h-6 rounded-full object-cover"}),e.jsx("span",{className:"text-xs font-bold whitespace-nowrap",children:s.name}),s.writerPersona&&e.jsx("span",{className:"absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-white"})]},s.id))})]}),e.jsxs("div",{className:`z-10 ${l.bg}/95 backdrop-blur-md border-b border-black/5 shadow-sm`,children:[e.jsxs("div",{className:"px-4 py-2 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3 overflow-x-auto no-scrollbar flex-1 mr-4",children:[e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[R&&e.jsx("img",{src:R.avatar,className:"w-6 h-6 rounded-full object-cover"}),e.jsx("span",{className:"text-xs font-bold text-slate-700",children:R!=null&&R.name?`${R.name}的风格`:"未选择角色"})]}),e.jsx("div",{className:"flex-1 flex gap-2 overflow-x-auto no-scrollbar",children:R&&ct(R).slice(0,3).map((s,a)=>{let r="bg-indigo-50 text-indigo-700 border-indigo-100";return["快节奏","慢节奏","节奏"].some(x=>s.includes(x))&&(r="bg-blue-50 text-blue-700 border-blue-100"),["冷峻","温情","治愈","燃","致郁"].some(x=>s.includes(x))&&(r="bg-pink-50 text-pink-700 border-pink-100"),["对话","心理","白描","意识流"].some(x=>s.includes(x))&&(r="bg-amber-50 text-amber-700 border-amber-100"),e.jsx("span",{className:`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${r}`,children:s},a)})})]}),e.jsxs("button",{onClick:()=>me(!ne),className:"shrink-0 text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full hover:bg-slate-50 text-slate-600 flex items-center gap-1 transition-colors",children:["详情 ",e.jsx("span",{className:`transform transition-transform ${ne?"rotate-180":""}`,children:"▼"})]})]}),e.jsx("div",{className:`transition-all duration-300 ease-out overflow-hidden ${ne?"max-h-[60vh] opacity-100":"max-h-0 opacity-0"}`,children:R?e.jsx(bt,{char:R,userProfile:f,targetCharId:g,isTyping:O,setIsTyping:_,setConfirmDialog:V,addToast:N,apiConfig:w,updateCharacter:y}):e.jsx("div",{className:"p-4 text-center text-xs text-slate-400",children:"请先选择一个角色"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-40",ref:K,children:[ke.length===0&&e.jsx("div",{className:"text-center py-20 opacity-40",children:e.jsxs("p",{className:"text-sm italic font-serif",children:["第 ",ue," 章",e.jsx("br",{}),"提笔写下新的开始..."]})}),ke.map(s=>{var t,p;const a=s.authorId==="user",r=a?null:c.find(S=>S.id===s.authorId),x=s.role||(s.type==="story"?"writer":s.type==="analysis"?"analyst":"commenter"),M=e.jsxs("div",{className:"absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/80 backdrop-blur rounded-lg p-1 shadow-sm border border-slate-100",children:[e.jsx("button",{onClick:()=>_e(s),className:"p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-500",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{d:"m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"})})}),e.jsx("button",{onClick:()=>pe(s.id),className:"p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{fillRule:"evenodd",d:"M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z",clipRule:"evenodd"})})})]});return x==="writer"?e.jsxs("div",{className:`p-6 rounded-sm shadow-sm leading-loose text-justify text-[17px] relative group transition-all ${l.paper} ${l.text} ${a?"border-l-4 border-slate-300":""}`,children:[M,e.jsxs("div",{className:"absolute -top-3 left-4 bg-white/90 border border-black/5 px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider text-slate-500 shadow-sm flex items-center gap-1.5",children:[a?null:e.jsx("img",{src:r==null?void 0:r.avatar,className:"w-3 h-3 rounded-full object-cover"}),e.jsxs("span",{children:[a?"我 (User)":r==null?void 0:r.name," 执笔"]}),!a&&((t=s.meta)==null?void 0:t.mood)&&e.jsx("span",{className:"bg-slate-100 px-1.5 rounded text-[9px] text-slate-600 normal-case",children:s.meta.mood})]}),e.jsx("div",{className:"whitespace-pre-wrap",children:s.content})]},s.id):x==="commenter"?e.jsxs("div",{className:"flex gap-3 max-w-[85%] font-sans ml-auto flex-row-reverse animate-slide-up group relative",children:[e.jsx("div",{className:"w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm mt-1",children:e.jsx("img",{src:a?f.avatar:r==null?void 0:r.avatar,className:"w-full h-full object-cover"})}),e.jsxs("div",{className:"p-3 rounded-xl text-sm shadow-sm relative bg-[#fff9c4] text-slate-700 transform rotate-1 border border-yellow-200/50",children:[M,s.content]})]},s.id):x==="analyst"?e.jsxs("div",{className:"mx-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 p-4 text-xs font-sans text-slate-600 shadow-sm group relative",children:[M,e.jsxs("div",{className:"flex items-center gap-2 mb-2 pb-2 border-b border-slate-200",children:[e.jsx("img",{src:"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f9e0.png",alt:"",className:"w-5 h-5"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[r==null?void 0:r.name," 的分析"]}),s.focus&&e.jsx("span",{className:"bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold",children:s.focus})]}),((p=s.meta)==null?void 0:p.reaction)&&e.jsxs("div",{className:"mb-2 pb-2 border-b border-dashed border-slate-200",children:[e.jsx("span",{className:"text-slate-400 text-[10px] uppercase",children:"第一反应"}),e.jsxs("p",{className:"text-sm font-bold text-slate-700 mt-0.5",children:['"',s.meta.reaction,'"']})]}),e.jsx("p",{className:"leading-relaxed whitespace-pre-wrap",children:s.content})]},s.id):null}),O&&e.jsx("div",{className:"flex justify-center py-4",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("div",{className:`w-2 h-2 rounded-full ${l.button} animate-bounce`}),e.jsx("div",{className:`w-2 h-2 rounded-full ${l.button} animate-bounce delay-75`}),e.jsx("div",{className:`w-2 h-2 rounded-full ${l.button} animate-bounce delay-150`})]})})]}),e.jsxs("div",{className:"absolute bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 z-30 transition-transform duration-300 font-sans shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe",children:[e.jsxs("div",{className:"flex gap-2 px-4 py-2 text-xs border-b border-slate-100 overflow-x-auto no-scrollbar",children:[e.jsx("button",{onClick:()=>A({...d,write:!d.write}),className:`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${d.write?"bg-slate-800 text-white border-slate-800":"bg-white text-slate-500 border-slate-200"}`,children:"续写正文"}),e.jsx("button",{onClick:()=>A({...d,comment:!d.comment}),className:`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${d.comment?"bg-slate-800 text-white border-slate-800":"bg-white text-slate-500 border-slate-200"}`,children:"角色吐槽"}),e.jsx("button",{onClick:()=>A({...d,analyze:!d.analyze}),className:`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${d.analyze?"bg-slate-800 text-white border-slate-800":"bg-white text-slate-500 border-slate-200"}`,children:"深度分析"})]}),e.jsxs("div",{className:"p-3 flex gap-2 items-end",children:[e.jsx("textarea",{value:C,onChange:s=>E(s.target.value),placeholder:d.write?C.trim()?"输入剧情大纲...":"输入指令或留空AI续写...":"输入讨论内容...",className:"flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none resize-none max-h-32 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all",rows:1,style:{minHeight:"44px"}}),W&&!O&&!C.trim()&&e.jsx("button",{onClick:Oe,className:"w-11 h-11 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"w-5 h-5",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"})})}),e.jsx("button",{onClick:se,disabled:O||!C.trim()&&!d.write,className:`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-all shrink-0 ${C.trim()||d.write?l.button:"bg-slate-300"}`,children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor",className:"w-5 h-5",children:e.jsx("path",{d:"M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"})})})]})]}),e.jsx(D,{isOpen:Y,title:"编辑段落",onClose:()=>ae(!1),footer:e.jsx("button",{onClick:Ie,className:"w-full py-3 bg-slate-800 text-white font-bold rounded-2xl",children:"保存"}),children:e.jsx("textarea",{value:le,onChange:s=>B(s.target.value),className:"w-full h-48 bg-slate-100 rounded-xl p-3 text-sm resize-none focus:outline-none leading-relaxed"})}),e.jsx(D,{isOpen:re,title:"章节总结",onClose:()=>q(!1),footer:oe?e.jsx("div",{className:"w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl text-center",children:"AI生成中..."}):e.jsx("button",{onClick:Je,className:"w-full py-3 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg",children:"确认归档并开启新章"}),children:e.jsx("textarea",{value:we,onChange:s=>T(s.target.value),className:"w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none leading-relaxed",placeholder:"总结生成中..."})}),e.jsxs(D,{isOpen:ve,title:"历史章节",onClose:()=>{ye(!1),xe(new Set)},children:[X.length>0&&e.jsxs("div",{className:"flex items-center justify-between mb-3 px-1",children:[e.jsxs("button",{onClick:ze,className:"text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors",children:[e.jsx("span",{className:`w-4 h-4 rounded border flex items-center justify-center transition-colors ${he?"bg-indigo-500 border-indigo-500 text-white":"border-slate-300 bg-white"}`,children:he&&e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{fillRule:"evenodd",d:"M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",clipRule:"evenodd"})})}),he?"取消全选":"全选"]}),e.jsxs("button",{onClick:Ze,disabled:Z.size===0,className:"text-[10px] bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1",children:[e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{d:"M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z"})}),"转发到聊天 (",Z.size,")"]})]}),e.jsxs("div",{className:"max-h-[55vh] overflow-y-auto space-y-4 p-1",children:[X.length===0&&e.jsx("div",{className:"text-center text-slate-400 py-4 text-xs",children:"暂无历史章节"}),X.map((s,a)=>{const r=Z.has(s.id);return e.jsxs("div",{onClick:()=>He(s.id),className:`p-4 rounded-xl border cursor-pointer transition-colors ${r?"bg-indigo-50/70 border-indigo-200":"bg-slate-50 border-slate-100 hover:border-slate-200"}`,children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${r?"bg-indigo-500 border-indigo-500 text-white":"border-slate-300 bg-white"}`,children:r&&e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{fillRule:"evenodd",d:"M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",clipRule:"evenodd"})})}),e.jsxs("div",{className:"font-bold text-sm text-slate-700",children:["第 ",a+1," 章"]})]}),e.jsx("button",{onClick:x=>{x.stopPropagation(),U(a),ye(!1)},className:"text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-bold hover:bg-indigo-100 border border-indigo-100 transition-colors",children:"阅读原文"})]}),e.jsx("div",{className:"text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4",children:s.content})]},s.id)})]})]}),e.jsxs(D,{isOpen:Ne,title:"转发章节到聊天",onClose:()=>Ce(!1),footer:e.jsx("button",{onClick:Ue,disabled:Ee||ee.size===0,className:"w-full py-3 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg disabled:opacity-40 flex items-center justify-center gap-2",children:Ee?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"})," 转发中..."]}):`转发 ${Z.size} 章给 ${ee.size} 位角色`}),children:[e.jsx("p",{className:"text-xs text-slate-400 mb-3",children:'章节归档会进入所选角色的聊天记录，之后聊天时 Ta 就"读过"这本书了。共创者已默认勾选。'}),e.jsx(De,{characters:c,groups:u,value:Ae,onChange:Se,className:"mb-3"}),e.jsx("div",{className:"max-h-[45vh] overflow-y-auto space-y-2 p-1",children:Qe(c,u,Ae).map(s=>{const a=ee.has(s.id),r=n.collaboratorIds.includes(s.id);return e.jsxs("button",{onClick:()=>ie(x=>{const M=new Set(x);return M.has(s.id)?M.delete(s.id):M.add(s.id),M}),className:`w-full flex items-center gap-3 p-3 rounded-xl border shadow-sm active:scale-[0.98] transition-all text-left ${a?"bg-indigo-50/70 border-indigo-200":"bg-white border-slate-100 hover:border-slate-200"}`,children:[e.jsx("img",{src:s.avatar,className:"w-9 h-9 rounded-full object-cover"}),e.jsx("div",{className:"flex-1 min-w-0",children:e.jsxs("div",{className:"font-bold text-sm text-slate-700 flex items-center gap-2",children:[s.name,r&&e.jsx("span",{className:"text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full font-bold",children:"共创者"})]})}),e.jsx("span",{className:`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${a?"bg-indigo-500 border-indigo-500 text-white":"border-slate-300 bg-white"}`,children:a&&e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-3 h-3",children:e.jsx("path",{fillRule:"evenodd",d:"M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",clipRule:"evenodd"})})})]},s.id)})})]}),e.jsx(D,{isOpen:G!==null,title:((Le=te[G??0])==null?void 0:Le.title)||"",onClose:()=>U(null),children:e.jsx("div",{className:"max-h-[70vh] overflow-y-auto space-y-4 p-1",children:G!==null&&te[G]&&e.jsxs(e.Fragment,{children:[te[G].segments.map(s=>{const a=s.authorId==="user",r=a?null:c.find(x=>x.id===s.authorId);return e.jsxs("div",{className:`${l.paper} p-5 rounded-sm leading-loose text-justify text-[15px] ${l.text} ${a?"border-l-4 border-slate-300":""}`,children:[e.jsxs("div",{className:"text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5",children:[!a&&r&&e.jsx("img",{src:r.avatar,className:"w-3 h-3 rounded-full object-cover"}),e.jsxs("span",{children:[a?"我":r==null?void 0:r.name," 执笔"]})]}),e.jsx("div",{className:"whitespace-pre-wrap font-serif",children:s.content})]},s.id)}),e.jsxs("div",{className:"bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4",children:[e.jsx("div",{className:"text-[10px] font-bold text-indigo-400 uppercase mb-2",children:"章节总结"}),e.jsx("div",{className:"text-xs text-indigo-700 leading-relaxed whitespace-pre-wrap",children:te[G].summary})]}),e.jsxs("div",{className:"flex justify-between pt-2",children:[e.jsx("button",{onClick:()=>U(Math.max(0,(G??0)-1)),disabled:G===0,className:"text-xs text-slate-400 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-slate-100",children:"← 上一章"}),e.jsx("button",{onClick:()=>U(Math.min(te.length-1,(G??0)+1)),disabled:G===te.length-1,className:"text-xs text-slate-400 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-slate-100",children:"下一章 →"})]})]})})})]})},St=()=>{const{closeApp:n,novels:i,addNovel:c,updateNovel:f,deleteNovel:w,characters:m,updateCharacter:y,apiConfig:v,addToast:g,userProfile:$,worldbooks:k,characterGroups:N}=et(),[u,l]=o.useState("shelf"),[d,A]=o.useState(null),[C,E]=o.useState(fe[0]),[O,_]=o.useState(""),[h,L]=o.useState(""),[Q,ce]=o.useState(""),[ne,me]=o.useState(""),[Y,ae]=o.useState(new Set),[ge,Te]=o.useState(We),[le,B]=o.useState([]),[I,V]=o.useState(""),[re,q]=o.useState(""),we=o.useRef(null),[T,oe]=o.useState(null),[je,ve]=o.useState(!1),[ye,G]=o.useState(!1),[U,Z]=o.useState("system"),[xe,Ne]=o.useState(!1),[Ce,ee]=o.useState(!1),[ie,Ae]=o.useState(null),[Se,Ee]=o.useState(We),[$e,K]=o.useState(!1),[ue,R]=o.useState(""),W=o.useMemo(()=>ie?m.find(t=>t.id===ie.id)||ie:null,[ie,m]),ke=()=>{ee(!1),K(!1)},X=()=>{W&&(R(W.writerPersona||de(W)),K(!0))},te=()=>{if(W){if(!ue.trim()){g("档案内容不能为空","error");return}y(W.id,{writerPersona:ue.trim(),writerPersonaGeneratedAt:Date.now()}),K(!1),g("创作档案已保存","success"),J("保存角色创作档案")}},[b,se]=o.useState(null),[Oe,_e]=o.useState(null),Ie=t=>fe.find(p=>p.id===t)||fe[0],pe=o.useMemo(()=>d?m.filter(t=>d.collaboratorIds.includes(t.id)):[],[d,m]),Pe=o.useMemo(()=>{const t=[],p=new Set;return i.forEach(S=>{S.protagonists.forEach(j=>{const F=`${j.name}-${j.role}`;p.has(F)||(p.add(F),t.push(j))})}),t},[i]);o.useEffect(()=>{d&&pe.length>0&&!Oe&&_e(pe[0].id)},[d,pe]),o.useEffect(()=>{d&&E(Ie(d.coverStyle))},[d]);const Je=()=>{if(!O.trim()){g("请输入标题","error");return}const t={id:`novel-${Date.now()}`,title:O,subtitle:h,summary:Q,coverStyle:C.id,coverImage:re,worldSetting:ne,collaboratorIds:Array.from(Y),protagonists:le,segments:[],createdAt:Date.now(),lastActiveAt:Date.now()};c(t),A(t),l("write"),ze(),J("新建一本书稿")},He=()=>{d&&(_(d.title),L(d.subtitle||""),ce(d.summary),me(d.worldSetting),E(Ie(d.coverStyle)),q(d.coverImage||""),ae(new Set(d.collaboratorIds)),B(d.protagonists),l("settings"),J("打开小说设定页"))},he=async()=>{if(!d)return;const t={...d,title:O,subtitle:h,summary:Q,worldSetting:ne,coverStyle:C.id,coverImage:re,collaboratorIds:Array.from(Y),protagonists:le,segments:d.segments,lastActiveAt:Date.now()};await f(d.id,t),A(t),l("write"),g("设定已更新，内容完好","success")},ze=()=>{_(""),L(""),ce(""),me(""),ae(new Set),B([]),q(""),V("")},Ze=async t=>{se({isOpen:!0,title:"删除作品",message:"确定要删除这本小说吗？此操作无法撤销。",variant:"danger",onConfirm:()=>{w(t),(d==null?void 0:d.id)===t&&l("shelf"),g("已删除","success"),se(null),J("删除一本书稿")}})},Ue=async t=>{var S;const p=(S=t.target.files)==null?void 0:S[0];if(p)try{const j=await rt(p,{maxWidth:800,quality:.8});q(j),J("上传书稿封面图")}catch{g("图片处理失败","error")}},Le=()=>{I&&q(I)},s=t=>{oe(t||{id:`proto-${Date.now()}`,name:"",role:"主角",description:""}),ve(!0)},a=()=>{if(!T||!T.name.trim()){g("角色名不能为空","error");return}B(t=>t.find(S=>S.id===T.id)?t.map(S=>S.id===T.id?T:S):[...t,T]),ve(!1),oe(null),J("保存一个剧中人")},r=t=>{const p={id:`proto-${Date.now()}-${Math.random()}`,name:t.name,role:t.role||"主角",description:t.description||""};B(S=>[...S,p]),G(!1),g(`已导入角色: ${t.name}`,"success"),J("导入一个剧中人",{source:U})},x=t=>{const p=`

【${t.title}】
${t.content}`;me(S=>(S+p).trim()),Ne(!1),g(`已导入设定: ${t.title}`,"success"),J("导入一条世界书设定")},M=({p:t,onDelete:p,onClick:S})=>e.jsxs("div",{onClick:S,className:"bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group cursor-pointer hover:border-slate-400 transition-colors",children:[e.jsxs("div",{className:"font-bold text-slate-800 text-sm flex justify-between",children:[e.jsx("span",{children:t.name}),e.jsx("span",{className:"text-[10px] bg-slate-100 px-1.5 rounded text-slate-500 font-normal",children:t.role})]}),e.jsx("div",{className:"text-xs text-slate-500 mt-1 line-clamp-2",children:t.description||"暂无描述"}),p&&e.jsx("button",{onClick:j=>{j.stopPropagation(),p()},className:"absolute top-1 right-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity",children:"×"})]});return u==="library"?e.jsxs("div",{className:"h-full w-full bg-slate-50 flex flex-col font-sans",children:[e.jsx("div",{className:"bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 sticky top-0 z-20",style:{paddingTop:"var(--safe-top)"},children:e.jsx("div",{className:"flex items-center px-6 py-3",children:e.jsxs("div",{className:"flex justify-between items-center w-full",children:[e.jsx("button",{onClick:()=>l("shelf"),className:"p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-90 transition-transform",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"w-6 h-6 text-slate-600",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"})})}),e.jsx("span",{className:"font-bold text-slate-800 text-lg tracking-wide",children:"角色库"}),e.jsx("div",{className:"w-8"})]})})}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar",children:[e.jsxs("section",{children:[e.jsxs("h3",{className:"text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2",children:[e.jsx(tt,{size:14})," 系统角色 (AI Collaborators)"]}),e.jsx(De,{characters:m,groups:N,value:Se,onChange:Ee,className:"mb-4"}),e.jsx("div",{className:"grid grid-cols-2 gap-4",children:Qe(m,N,Se).map(t=>e.jsxs("div",{onClick:()=>{Ae(t),ee(!0)},className:"bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 cursor-pointer hover:shadow-md transition-all active:scale-95",children:[e.jsx("img",{src:t.avatar,className:"w-16 h-16 rounded-full object-cover border-2 border-slate-50"}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-bold text-slate-700 text-sm",children:t.name}),e.jsx("div",{className:"text-[10px] text-slate-400 mt-1 px-2 py-0.5 bg-slate-50 rounded-full",children:"共创者"})]})]},t.id))})]}),e.jsxs("section",{children:[e.jsxs("h3",{className:"text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2",children:[e.jsx(st,{size:14})," 历史剧中人 (From History)"]}),Pe.length===0?e.jsx("div",{className:"text-center py-8 text-slate-400 text-xs",children:"暂无历史角色数据"}):e.jsx("div",{className:"grid grid-cols-1 gap-3",children:Pe.map((t,p)=>e.jsxs("div",{className:"bg-white p-4 rounded-xl border border-slate-200 shadow-sm",children:[e.jsxs("div",{className:"flex justify-between items-start mb-2",children:[e.jsx("span",{className:"font-bold text-slate-800",children:t.name}),e.jsx("span",{className:"text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100",children:t.role})]}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed line-clamp-3",children:t.description||"暂无描述"})]},p))})]})]}),e.jsx(D,{isOpen:Ce,title:(W==null?void 0:W.name)||"角色风格",onClose:ke,footer:$e?e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>K(!1),className:"flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-transform",children:"取消"}),e.jsx("button",{onClick:te,className:"flex-1 py-3 bg-slate-800 text-white font-bold rounded-2xl active:scale-95 transition-transform",children:"保存"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:X,className:"flex-1 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-2xl active:scale-95 transition-transform",children:"编辑档案"}),e.jsx("button",{onClick:ke,className:"flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-transform",children:"关闭"})]}),children:e.jsx("div",{className:"max-h-[60vh] overflow-y-auto space-y-4 p-1",children:W?$e?e.jsxs("div",{className:"space-y-2",children:[e.jsx("textarea",{value:ue,onChange:t=>R(t.target.value),className:"w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm leading-relaxed resize-none outline-none focus:border-slate-400 font-mono"}),e.jsx("button",{onClick:()=>{R(de(W)),J("重置创作档案为自动分析")},className:"text-xs text-slate-400 underline",children:"重置为自动分析"})]}):e.jsx("div",{className:"bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap",children:W.writerPersona||de(W)}):null})})]}):u==="shelf"?e.jsxs("div",{className:"h-full w-full bg-slate-50 flex flex-col font-sans relative",children:[e.jsx(Ke,{isOpen:!!b,title:(b==null?void 0:b.title)||"",message:(b==null?void 0:b.message)||"",variant:b==null?void 0:b.variant,confirmText:(b==null?void 0:b.confirmText)||(b!=null&&b.onConfirm?"确认":"OK"),onConfirm:(b==null?void 0:b.onConfirm)||(()=>se(null)),onCancel:()=>se(null)}),e.jsx("div",{className:"bg-white/80 backdrop-blur-md z-20 shrink-0 border-b border-slate-100",style:{paddingTop:"var(--safe-top)"},children:e.jsxs("div",{className:"flex items-center justify-between px-6 py-3",children:[e.jsx("button",{onClick:n,className:"p-3 -ml-3 rounded-full hover:bg-slate-100 active:scale-95 transition-all",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:2,stroke:"currentColor",className:"w-6 h-6 text-slate-600",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"})})}),e.jsx("span",{className:"font-black text-2xl text-slate-800 tracking-tight",children:"我的手稿"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>{l("library"),J("打开角色库")},className:"w-10 h-10 bg-white text-slate-600 border border-slate-200 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-50",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"w-5 h-5",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"})})}),e.jsx("button",{onClick:()=>{l("create"),ze(),J("打开新建书稿页")},className:"w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-black",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:2.5,stroke:"currentColor",className:"w-5 h-5",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 4.5v15m7.5-7.5h-15"})})})]})]})}),e.jsxs("div",{className:"p-6 grid grid-cols-2 gap-5 overflow-y-auto pb-24",children:[i.map(t=>{const p=Ie(t.coverStyle),S=t.segments.reduce((F,Me)=>F+(Me.type==="story"?Me.content.length:0),0),j=t.coverImage?{backgroundImage:`url(${t.coverImage})`,backgroundSize:"cover",backgroundPosition:"center"}:{};return e.jsxs("div",{onClick:()=>{A(t),l("write"),J("打开书稿写作页")},className:"group relative aspect-auto min-h-[14rem] bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer flex flex-col",children:[e.jsxs("div",{className:`h-28 shrink-0 ${p.bg} relative p-4 flex flex-col justify-end`,style:j,children:[e.jsx("div",{className:`absolute inset-0 ${t.coverImage?"bg-black/30":""}`}),e.jsxs("div",{className:"relative z-10",children:[e.jsx("h3",{className:`font-bold text-lg leading-tight line-clamp-2 ${t.coverImage?"text-white drop-shadow-md":p.text}`,children:t.title}),t.subtitle&&e.jsx("p",{className:`text-[10px] font-bold opacity-80 uppercase tracking-wide truncate ${t.coverImage?"text-white":p.text}`,children:t.subtitle})]})]}),e.jsxs("div",{className:"p-4 flex-1 flex flex-col justify-between",children:[e.jsx("p",{className:"text-xs text-slate-500 line-clamp-3 leading-relaxed mb-3",children:t.summary||"暂无简介..."}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-50",children:[e.jsx("div",{className:"flex -space-x-2",children:m.filter(F=>t.collaboratorIds.includes(F.id)).map(F=>e.jsx("img",{src:F.avatar,className:"w-6 h-6 rounded-full border-2 border-white object-cover"},F.id))}),e.jsxs("span",{className:"text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-full",children:[(S/1e3).toFixed(1),"k 字"]})]})]}),e.jsx("button",{onClick:F=>{F.stopPropagation(),Ze(t.id)},className:"absolute top-2 right-2 text-slate-400/50 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur rounded-full",children:"×"})]},t.id)}),i.length===0&&e.jsxs("div",{className:"col-span-2 flex flex-col items-center justify-center h-64 text-slate-300 gap-3",children:[e.jsx(nt,{size:48,className:"opacity-50"}),e.jsx("span",{className:"text-sm font-sans",children:"点击右上角，开始创作"})]})]})]}):u==="create"||u==="settings"?e.jsxs("div",{className:"h-full w-full bg-slate-50 flex flex-col font-sans relative",children:[e.jsx(Ke,{isOpen:!!b,title:(b==null?void 0:b.title)||"",message:(b==null?void 0:b.message)||"",variant:b==null?void 0:b.variant,confirmText:(b==null?void 0:b.confirmText)||(b!=null&&b.onConfirm?"确认":"OK"),onConfirm:(b==null?void 0:b.onConfirm)||(()=>se(null)),onCancel:()=>se(null)}),e.jsx("div",{className:"bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20",style:{paddingTop:"var(--safe-top)"},children:e.jsxs("div",{className:"h-16 flex items-center justify-between px-4",children:[e.jsx("button",{onClick:()=>l(u==="create"?"shelf":"write"),className:"text-slate-500 text-sm",children:"取消"}),e.jsx("span",{className:"font-bold text-slate-800",children:u==="create"?"新建书稿":"小说设定"}),e.jsx("button",{onClick:u==="create"?Je:he,className:"bg-slate-800 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md active:scale-95 transition-transform",children:"保存"})]})}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 space-y-8 pb-20",children:[e.jsxs("section",{className:"space-y-4",children:[e.jsx("input",{value:O,onChange:t=>_(t.target.value),placeholder:"书名",className:"w-full text-2xl font-bold bg-transparent border-b border-slate-200 py-2 outline-none focus:border-slate-800 font-serif"}),e.jsx("input",{value:h,onChange:t=>L(t.target.value),placeholder:"卷名/副标题",className:"w-full text-sm font-bold bg-transparent border-b border-slate-200 py-2 outline-none focus:border-slate-800 text-slate-600"}),e.jsx("textarea",{value:Q,onChange:t=>ce(t.target.value),placeholder:"一句话简介...",className:"w-full h-20 bg-slate-100 rounded-xl p-3 text-sm resize-none outline-none"}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase mb-2 block",children:"内页风格"}),e.jsx("div",{className:"flex gap-3 overflow-x-auto pb-2 no-scrollbar",children:fe.map(t=>e.jsx("button",{onClick:()=>E(t),className:`w-12 h-16 rounded-md shadow-sm border-2 shrink-0 ${t.bg} ${C.id===t.id?"border-slate-800 scale-105":"border-transparent"}`},t.id))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase mb-2 block",children:"自定义封面"}),e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsxs("div",{onClick:()=>{var t;return(t=we.current)==null?void 0:t.click()},className:"w-16 h-24 bg-slate-100 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-500 relative overflow-hidden",children:[re?e.jsx("img",{src:re,className:"w-full h-full object-cover"}):e.jsx("span",{className:"text-xs text-slate-400",children:"+"}),e.jsx("input",{type:"file",ref:we,className:"hidden",accept:"image/*",onChange:Ue})]}),e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx("input",{value:I,onChange:t=>V(t.target.value),onBlur:Le,placeholder:"粘贴图片链接...",className:"w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400"}),re&&e.jsx("button",{onClick:()=>{q(""),V("")},className:"text-xs text-red-400 underline",children:"清除封面"})]})]})]})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase block",children:"世界观设定"}),e.jsxs("button",{onClick:()=>{Ne(!0),J("打开导入世界书弹窗")},className:"text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1",children:[e.jsx(at,{size:12})," 导入世界书"]})]}),e.jsx("textarea",{value:ne,onChange:t=>me(t.target.value),placeholder:"世界观设定...",className:"w-full h-32 bg-white border border-slate-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-slate-400"})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase block",children:"共创者"}),e.jsx(De,{characters:m,groups:N,value:ge,onChange:Te}),e.jsx("div",{className:"flex gap-3 overflow-x-auto pb-2 no-scrollbar",children:Qe(m,N,ge).map(t=>e.jsxs("div",{onClick:()=>{const p=new Set(Y);p.has(t.id)?p.delete(t.id):p.add(t.id),ae(p)},className:`flex flex-col items-center gap-2 cursor-pointer transition-opacity ${Y.has(t.id)?"opacity-100":"opacity-50 grayscale"}`,children:[e.jsx("img",{src:t.avatar,className:"w-12 h-12 rounded-full object-cover shadow-sm"}),e.jsx("span",{className:"text-[10px] font-bold text-slate-600",children:t.name})]},t.id))})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase",children:"剧中人"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:()=>{G(!0),J("打开导入剧中人弹窗")},className:"text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 border border-indigo-100 flex items-center gap-1",children:[e.jsx(lt,{size:12})," 导入"]}),e.jsx("button",{onClick:()=>s(),className:"text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200 transition-colors",children:"+ 添加"})]})]}),e.jsx("div",{className:"grid grid-cols-2 gap-3",children:le.map((t,p)=>e.jsx(M,{p:t,onClick:()=>s(t),onDelete:()=>B(le.filter((S,j)=>j!==p))},t.id))})]})]}),e.jsx(D,{isOpen:je,title:"编辑角色",onClose:()=>ve(!1),footer:e.jsx("button",{onClick:a,className:"w-full py-3 bg-slate-800 text-white font-bold rounded-2xl",children:"保存"}),children:T&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase block mb-1",children:"姓名"}),e.jsx("input",{value:T.name,onChange:t=>oe({...T,name:t.target.value}),className:"w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase block mb-1",children:"定位"}),e.jsx("input",{value:T.role,onChange:t=>oe({...T,role:t.target.value}),className:"w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm",placeholder:"主角 / 反派"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-slate-400 uppercase block mb-1",children:"设定"}),e.jsx("textarea",{value:T.description,onChange:t=>oe({...T,description:t.target.value}),className:"w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none leading-relaxed"})]})]})}),e.jsxs(D,{isOpen:ye,title:"导入角色",onClose:()=>G(!1),children:[e.jsxs("div",{className:"flex p-1 bg-slate-100 rounded-xl mb-3",children:[e.jsx("button",{onClick:()=>Z("system"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${U==="system"?"bg-white shadow text-indigo-600":"text-slate-400"}`,children:"系统角色 (AI)"}),e.jsx("button",{onClick:()=>Z("history"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${U==="history"?"bg-white shadow text-indigo-600":"text-slate-400"}`,children:"历史角色"})]}),e.jsxs("div",{className:"max-h-[50vh] overflow-y-auto no-scrollbar space-y-3 p-1",children:[U==="system"&&m.map(t=>e.jsxs("button",{onClick:()=>r({name:t.name,role:"客串",description:t.description}),className:"w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 shadow-sm active:scale-95 transition-all text-left",children:[e.jsx("img",{src:t.avatar,className:"w-8 h-8 rounded-full object-cover"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("div",{className:"font-bold text-sm text-slate-700",children:t.name}),e.jsx("div",{className:"text-[10px] text-slate-400 truncate",children:t.description})]})]},t.id)),U==="history"&&Pe.map((t,p)=>e.jsxs("button",{onClick:()=>r(t),className:"w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 shadow-sm active:scale-95 transition-all text-left",children:[e.jsx("div",{className:"w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200",children:t.name[0]}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("div",{className:"font-bold text-sm text-slate-700",children:t.name}),e.jsxs("div",{className:"text-[10px] text-slate-400 truncate",children:[t.role," - ",t.description||"无描述"]})]})]},`hist-${p}`))]})]}),e.jsx(D,{isOpen:xe,title:"导入世界书设定",onClose:()=>Ne(!1),children:e.jsx("div",{className:"max-h-[50vh] overflow-y-auto no-scrollbar space-y-2 p-1",children:k.map(t=>e.jsxs("button",{onClick:()=>x(t),className:"w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-300 bg-white shadow-sm active:scale-95 transition-all",children:[e.jsx("div",{className:"font-bold text-slate-700 text-sm",children:t.title}),e.jsx("div",{className:"text-[10px] text-slate-400 mt-1",children:t.category||"未分类"})]},t.id))})})]}):u==="write"&&d?e.jsx(ft,{activeBook:d,updateNovel:f,characters:m,userProfile:$,apiConfig:v,onBack:()=>l("shelf"),updateCharacter:y,collaborators:pe,targetCharId:Oe,setTargetCharId:_e,onOpenSettings:He}):null};export{St as default};
