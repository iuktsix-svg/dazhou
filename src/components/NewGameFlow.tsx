import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../hooks/useSillytavern';
import type { ChatSession } from '../sillytavern';
import { OPENING_TEXTS } from '../data/openings';
import { getSharedBaseVars, getOpeningVars } from '../data/initial-vars';
import { ChevronRight, User, Users } from 'lucide-react';

interface Props { onStart: (chat?: ChatSession) => void; }
type Step = 'intro' | 'character' | 'build' | 'opening';

const DINGCHANG_POEMS: Record<number, string> = {
  1: `飞狐径外野酒旌
朔风卷沙客心惊
红衣少女拍桌问
可愿随我闯江湖`,
  2: `长安西市闹重阳
试剑华山论短长
道姑不识人间礼
当街为你整衣裳`,
  3: `滹沱河畔古碑残
女扮红妆露玉峦
衣裂一声惊窘态
贴身相逼为遮拦`,
  4: `白马寺前朱门闭
太孙乔装问路津
幕篱遮面声声怯
不知郎君是储君`,
  5: `洞庭端午竞龙舟
苗女银铃过人头
轻拍肩头施奇蛊
一粽之间性命休`,
  6: `秦淮画舫夜连天
白衣负剑立摊前
不识铜钱只识珠
一颗珍珠换糖甜`,
  7: `上元灯火照番坊
浪人撞客为烧鹅
怀中香瓜尚未裂
便要赔她一桌席`,
  8: `华山脚下酒旗斜
试剑前夕赌兴赊
一只烧鸡作彩头
三招定胜负与盟`,
  9: `开封城外旱魃狂
粥棚十里赈饥荒
圣女白莲施甘露
不知己身在网中央`,
};

const OPENINGS = [
  { id: 1, title: '飞狐径酒肆', desc: '河朔飞狐径外野酒肆，红衣女孩邀你入伙，冥血圣教绝学重现江湖…', label: '江湖偶遇' },
  { id: 2, title: '长安西市', desc: '关中长安闹市，华山试剑大会前夕，偶遇太玄观宋皎当街为你整理衣领…', label: '长安奇缘' },
  { id: 3, title: '滹沱河古碑', desc: '燕齐中渡桥头，乾国公府世子袭长缨女装出行，衣襟崩裂的窘境…', label: '桥畔邂逅' },
  { id: 4, title: '白马寺侧门', desc: '洛阳白马寺，皇太孙武玄真乔装探亲，求助路人进入寺中…', label: '京畿秘事' },
  { id: 5, title: '洞庭端午', desc: '荆襄洞庭湖端午龙舟，苗疆五仙教圣女阿绫对你下了奇蛊…', label: '苗疆奇蛊' },
  { id: 6, title: '金陵秦淮', desc: '江淮金陵秦淮河畔，东海仙客洛轻尘用珍珠买糖葫芦…', label: '东海仙客' },
  { id: 7, title: '广州上元', desc: '岭南广州上元佳节，东瀛浪人平千鹤撞了你还要你请吃饭…', label: '番坊灯会' },
  { id: 8, title: '华山脚下', desc: '华山脚下野酒肆，天剑阁叶惊秋以烧鸡作彩头邀人切磋剑术…', label: '剑阁赌约' },
  { id: 9, title: '开封城外', desc: '开封旱灾饥民遍地，白莲教设粥棚赈灾，圣女白非烟却不知自己只是棋子…', label: '白莲赈灾' },
];

const INTRO_TEXT = [
  '大周承平五十年，天下看似太平。',
  '洛阳烈火烹油，平康坊灯火彻夜不息。',
  '然则暗流涌动——西北秘盟虎视眈眈，太行阴契蠢蠢欲动。',
  '五十年前正魔大战的余烬，正悄然复燃。',
  '江湖之大，何处是归途？',
  '且看——',
];

export function NewGameFlow({ onStart }: Props) {
  const { settings, presets, activeLorebookIds, sendMessage, isLoading } = useSillytavern();
  const [step, setStep] = useState<Step>('intro');
  const [introLine, setIntroLine] = useState(0);
  const [gender, setGender] = useState<'男' | '女' | '其他'>('男');
  const [desc, _setDesc] = useState('');
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [pendingOpening, setPendingOpening] = useState<{ text: string; id: number } | null>(null);
  const [previewOpening, setPreviewOpening] = useState<{ text: string; id: number; title: string; label: string } | null>(null);

  // Stat allocation
  const BASE_ATTR = 5; const FREE_POINTS = 10; const MAX_INIT = 10; // world max is 30, grows via gameplay
  const [attrs, setAttrs] = useState({ '臂力': BASE_ATTR, '身法': BASE_ATTR, '体魄': BASE_ATTR, '内息': BASE_ATTR, '灵巧': BASE_ATTR });
  const usedPoints = Object.values(attrs).reduce((s, v) => s + v - BASE_ATTR, 0);
  const remainingPoints = FREE_POINTS - usedPoints;
  const [kungfuPath, setKungfuPath] = useState<string>('balanced');
  const KUNGFU_PATHS: Record<string, { name: string; desc: string; skills: Record<string, { 武学描述: string; 类型: string }>; bonus: Record<string, number> }> = {
    balanced: { name: '均衡之道', desc: '内外兼修，稳扎稳打。适合初入江湖的侠客。', skills: { '基础吐纳法': { '武学描述': '最基础的呼吸法门，固本培元。习武之人入门必修。', '类型': '内功' }, '太祖长拳': { '武学描述': '江湖流传甚广的外家拳法，招式朴实，胜在实用。', '类型': '外功' } }, bonus: { '臂力': 1, '体魄': 1 } },
    brawler: { name: '外家横练', desc: '以力破巧，正面硬撼。气血上限更高，适合喜欢正面战斗的玩家。', skills: { '铁布衫': { '武学描述': '外家横练基本功，以皮肉筋骨硬接拳脚。修至大成刀枪不入。', '类型': '外功' }, '破山拳': { '武学描述': '军中流传的刚猛拳法，一拳下去开碑裂石。', '类型': '外功' } }, bonus: { '臂力': 2, '体魄': 2, '内息': -1 } },
    agile: { name: '轻灵剑客', desc: '以快制慢，身法灵动。真气上限更高，适合喜欢灵活战斗的玩家。', skills: { '清风心法': { '武学描述': '道门入门心法，吐纳之间真气流转如清风拂面。真气回复略快于常人。', '类型': '内功' }, '游身剑': { '武学描述': '以轻快见长的剑法，讲究身随剑走，攻敌不备。', '类型': '外功' } }, bonus: { '身法': 2, '灵巧': 2, '体魄': -1 } },
  };

  const setAttr = (k: keyof typeof attrs, v: number) => { if (v >= BASE_ATTR && v <= MAX_INIT) { const newTotal = usedPoints - attrs[k] + v; if (newTotal <= FREE_POINTS) setAttrs(p => ({ ...p, [k]: v })); } };

  useEffect(() => {
    if (step !== 'intro') return;
    if (introLine >= INTRO_TEXT.length + 2) { setTimeout(() => setStep('character'), 800); return; }
    const t = setTimeout(() => setIntroLine(l => l + 1), introLine === 0 ? 1000 : 3000);
    return () => clearTimeout(t);
  }, [step, introLine]);

  useEffect(() => {
    if (!pendingOpening) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      const playerName = name.trim() || (gender === '男' ? '少侠' : gender === '女' ? '女侠' : '侠客');
      const playerDesc = name.trim() || (gender === '男' ? '一位初入江湖的少侠' : gender === '女' ? '一位初入江湖的女侠' : '一位初入江湖的侠客');
      const displayText = pendingOpening.text.replace(/\{主角\}/g, playerDesc).replace(/\{\{user\}\}/g, playerDesc);

      // 直接创建带开场白的 chat，避免 React 状态时序问题
      const cid = crypto.randomUUID();
      const { saveChat } = await import('../sillytavern/database');
      const chat: ChatSession = {
        id: cid,
        name: `${playerName} - 江湖之旅`,
        messages: [
          { id: crypto.randomUUID(), role: 'user', content: displayText, timestamp: Date.now(), variables: {} },
        ],
        characterName: '主角',
        userName: playerName,
        presetId: settings?.activePresetId || presets[0]?.id || null,
        lorebookIds: [...(settings?.activeLorebookIds || activeLorebookIds)],
        variables: {
          ...getSharedBaseVars(),
          '主角状态': { '当前所在地点': getOpeningVars(pendingOpening.id).location, '武功境界': '淬体境·15%', '阵营倾向': '中立', '身体状态': '健康', '当前气血': 120, '气血上限': 120, '当前真气': 60, '真气上限': 60, '当前阅历': 15, '破境所需阅历': 100, '持有银两': 100, '心魔值': 0, '地图坐标': { 'lat': getOpeningVars(pendingOpening.id).lat, 'lng': getOpeningVars(pendingOpening.id).lng }, '基础属性': { 臂力: Math.min(10, attrs['臂力'] + (KUNGFU_PATHS[kungfuPath]?.bonus?.['臂力']||0)), 身法: Math.min(10, attrs['身法'] + (KUNGFU_PATHS[kungfuPath]?.bonus?.['身法']||0)), 体魄: Math.min(10, attrs['体魄'] + (KUNGFU_PATHS[kungfuPath]?.bonus?.['体魄']||0)), 内息: Math.min(10, attrs['内息'] + (KUNGFU_PATHS[kungfuPath]?.bonus?.['内息']||0)), 灵巧: Math.min(10, attrs['灵巧'] + (KUNGFU_PATHS[kungfuPath]?.bonus?.['灵巧']||0)) }, '已学武学': { ...KUNGFU_PATHS[kungfuPath].skills } },
          '系统与时辰': { '当前时辰': getOpeningVars(pendingOpening.id).time },
          '江湖人际录': { ...getOpeningVars(pendingOpening.id).npcs },
          '武林榜单与悬赏.悬赏榜': [...((getOpeningVars(pendingOpening.id) as unknown as Record<string,unknown>).bounties as Array<unknown> || [])],
          '江湖风媒情报': { ...getOpeningVars(pendingOpening.id).news },
          '随身行囊': { '金疮药': { '物品类型': '丹药', '数量': 5, '物品描述': '江湖常见的疗伤药，敷于患处可止血生肌。' }, '粗布包袱': { '物品类型': '杂物', '数量': 1, '物品描述': '一个打了补丁的粗布包袱，装着你全部的家当。' }, '铜钱串': { '物品类型': '杂物', '数量': 1, '物品描述': '用麻绳串起的散碎铜钱，约莫百来文。' }, '火折子': { '物品类型': '杂物', '数量': 2, '物品描述': '引火用的火折子，江湖夜行必备。' }, '干粮袋': { '物品类型': '杂物', '数量': 3, '物品描述': '几个硬邦邦的炊饼，就着凉水能顶一顿。' } },
          '任务与目标': {},
        } as unknown as Record<string, string | number>,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveChat(chat); 
      

      // 将 chat 传给 App.tsx，由 App 统一管理状态
      onStart(chat);
      if (cancelled) return;

      let playerInfo = `[玩家信息] 姓名：${playerName}，性别：${gender}`;
      if (desc.trim()) playerInfo += `，自我介绍：${desc.trim()}`;
      if (appearance.trim()) playerInfo += `，外貌：${appearance.trim()}`;
      if (personality.trim()) playerInfo += `，性格：${personality.trim()}`;
      playerInfo += `。以上是玩家信息，开始游戏吧。`;
      try { await sendMessage(playerInfo, chat); } catch (e) { console.error('sendMessage failed:', e); }
    })();
    return () => { cancelled = true; };
  }, [pendingOpening]);

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)' }}>加载中…</div>;

  const handleCustomStart = () => {
    const custom = (document.getElementById('custom-opening-input') as HTMLTextAreaElement)?.value?.trim();
    if (!custom) return;
    setPreviewOpening({ text: custom, id: 0, title: '自定义开场', label: '自编' });
  };

  if (step === 'intro') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {introLine < INTRO_TEXT.length && (
          <motion.div key={introLine} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: 'var(--wx-ink)', letterSpacing: '0.1em', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {INTRO_TEXT[introLine]}
          </motion.div>
        )}
        {introLine >= INTRO_TEXT.length && introLine < INTRO_TEXT.length + 2 && (
          <motion.div key="title" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--wx-vermillion)', letterSpacing: '0.15em', position: 'relative', zIndex: 1, textShadow: '2px 2px 12px rgba(181,40,26,0.2)' }}>
            大周日暮录
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (step === 'character') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-2xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, marginBottom: 32 }}>创建角色</h2>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>你的名字</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="留下你的江湖名号…" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-card)', color: 'var(--wx-ink)', fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', textAlign: 'center', outline: 'none', letterSpacing: 2 }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 12 }}>选择性别</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {(['男', '女', '其他'] as const).map(g => (
              <button key={g} onClick={() => setGender(g)} style={{ padding: '14px 32px', cursor: 'pointer', background: gender === g ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)', border: `2px solid ${gender === g ? 'var(--wx-vermillion)' : 'var(--bdr-subtle)'}`, borderRadius: 'var(--rd-md)', fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', color: gender === g ? 'var(--wx-vermillion)' : 'var(--wx-ink-dim)', transition: 'all 0.2s', minWidth: 80 }}>
                {g === '男' && <User size={16} style={{ marginRight: 4 }} />}{g === '女' && <User size={16} style={{ marginRight: 4 }} />}{g === '其他' && <Users size={16} style={{ marginRight: 4 }} />}{g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>外貌（可选）</div>
          <input value={appearance} onChange={e => setAppearance(e.target.value)} placeholder="剑眉星目，一袭青衫…" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-card)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', textAlign: 'center', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>性格（可选）</div>
          <input value={personality} onChange={e => setPersonality(e.target.value)} placeholder="沉默寡言，嫉恶如仇…" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-card)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', textAlign: 'center', outline: 'none' }} />
        </div>
        <button onClick={() => { if (name.trim()) setStep('build'); }} disabled={!name.trim()} style={{ padding: '14px 48px', background: name.trim() ? 'var(--wx-vermillion)' : 'var(--wx-surface-dark)', color: name.trim() ? '#fff' : 'var(--wx-ink-dim)', border: 'none', cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', letterSpacing: 4, borderRadius: 'var(--rd-md)', boxShadow: name.trim() ? 'var(--sh-vermillion)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>下一步 <ChevronRight size={20} /></button>
      </motion.div>
    </div>
  );

  // Martial arts paths
  if (step === 'build') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-2xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, marginBottom: 8 }}>天赋与武学</h2>

        {/* Stat allocation */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 10 }}>自由加点（剩余 <span style={{ color: 'var(--wx-gold)', fontWeight: 700 }}>{remainingPoints}</span> / {FREE_POINTS}）</div>
          {Object.entries(attrs).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
              <span style={{ width: 36, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink)', textAlign: 'right' }}>{k}</span>
              <div style={{ width: 180, height: 6, background: 'var(--wx-surface-dark)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((v - BASE_ATTR) / (MAX_INIT - BASE_ATTR)) * 100}%`, background: 'var(--wx-gold)', borderRadius: 3, transition: 'width 0.2s' }} />
              </div>
              <span style={{ width: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--wx-gold)' }}>{v}</span>
              <button onClick={() => setAttr(k as keyof typeof attrs, v - 1)} disabled={v <= BASE_ATTR} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--bdr-subtle)', background: 'var(--wx-card)', color: v <= BASE_ATTR ? 'var(--wx-ink-dim)' : 'var(--wx-ink)', cursor: v <= BASE_ATTR ? 'default' : 'pointer', fontSize: 15, opacity: v <= BASE_ATTR ? 0.3 : 1 }}>−</button>
              <button onClick={() => setAttr(k as keyof typeof attrs, v + 1)} disabled={v >= MAX_INIT} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--bdr-subtle)', background: 'var(--wx-card)', color: v >= MAX_INIT ? 'var(--wx-ink-dim)' : remainingPoints <= 0 ? 'var(--wx-ink-dim)' : 'var(--wx-ink)', cursor: v >= MAX_INIT ? 'default' : 'pointer', fontSize: 15, opacity: v >= MAX_INIT ? 0.3 : remainingPoints <= 0 ? 0.5 : 1 }}>+</button>
            </div>
          ))}
        </div>

        {/* Kungfu path */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 10 }}>选择武学路径</div>
          {Object.entries(KUNGFU_PATHS).map(([key, path]) => (
            <div key={key} onClick={() => setKungfuPath(key)} style={{
              padding: '12px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
              background: kungfuPath === key ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)',
              border: `2px solid ${kungfuPath === key ? 'var(--wx-vermillion)' : 'var(--bdr-subtle)'}`,
              borderRadius: 'var(--rd-md)', transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-ink)' }}>{path.name}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xs)', color: 'var(--wx-ink-dim)' }}>{Object.keys(path.skills).join(' + ')}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>{path.desc}</div>
            </div>
          ))}
        </div>

        {remainingPoints > 0 && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-gold)', marginBottom: 16 }}>
            ⚠ 还有 {remainingPoints} 点天赋未分配，弃之可惜。
          </div>
        )}
        <button onClick={() => setStep('opening')} style={{ padding: '14px 48px', background: remainingPoints > 0 ? 'var(--wx-gold)' : 'var(--wx-vermillion)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', letterSpacing: 4, borderRadius: 'var(--rd-md)', boxShadow: remainingPoints > 0 ? 'var(--sh-gold)' : 'var(--sh-vermillion)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>选择开局 <ChevronRight size={20} /></button>
      </motion.div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--wx-paper)', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '24px 20px 16px', borderBottom: '1px solid var(--bdr-subtle)' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, margin: 0 }}>选择开局</h2>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>选一个故事开始，或自己写一段开场</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, maxWidth: 900, margin: '0 auto' }}>
          {OPENINGS.map((o, i) => (
            <motion.button key={o.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3, boxShadow: 'var(--sh-gold)' }} whileTap={{ scale: 0.98 }}
              onClick={() => {
                const openingText = OPENING_TEXTS[o.id] || `第一回 ${o.title}\n\n${o.desc}`;
                
                setPreviewOpening({ text: openingText, id: o.id, title: o.title, label: o.label });
              }}
              style={{ padding: '18px 16px', cursor: 'pointer', textAlign: 'left', background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-vermillion)', letterSpacing: 1 }}>{o.title}</span>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--wx-gold)', background: 'var(--wx-gold-dim)', padding: '2px 8px', borderRadius: 'var(--rd-full)' }}>{o.label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', lineHeight: 1.6 }}>{o.desc}</div>
            </motion.button>
          ))}
        </div>
        <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '16px', background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>或自己写下开场…</div>
          <textarea id="custom-opening-input" rows={3} placeholder="写一段你的开场叙事，AI将从此开始……" style={{ width: '100%', padding: '12px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-sm)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', resize: 'vertical', outline: 'none' }} />
          <button onClick={handleCustomStart} className="wx-btn wx-btn-red" style={{ marginTop: 10, padding: '10px 24px' }}>以此开场</button>
        </div>
      </div>

      {/* 开场白预览弹窗 */}
      {previewOpening && (
        <div onClick={() => setPreviewOpening(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--wx-paper)', borderRadius: 'var(--rd-lg)', maxWidth: 680, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, margin: 0 }}>{previewOpening.title}</h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--wx-gold)', background: 'var(--wx-gold-dim)', padding: '2px 10px', borderRadius: 'var(--rd-full)' }}>{previewOpening.label}</span>
            </div>
            {/* Body — 定场诗 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-ink)', letterSpacing: '0.1em', lineHeight: 2.2, textAlign: 'center' }}>
                {DINGCHANG_POEMS[previewOpening.id]?.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div style={{ marginTop: 20, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', fontStyle: 'italic' }}>
                —— {previewOpening.title}
              </div>
            </div>
            {/* Footer — actions */}
            <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--bdr-subtle)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setPreviewOpening(null)} style={{ padding: '10px 28px', background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)' }}>再想想</button>
              <button onClick={() => {  setPendingOpening({ text: previewOpening.text, id: previewOpening.id }); setPreviewOpening(null); }}
                style={{ padding: '10px 32px', background: 'var(--wx-vermillion)', color: '#fff', border: 'none', borderRadius: 'var(--rd-md)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', letterSpacing: 2 }}>选择此开局</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
