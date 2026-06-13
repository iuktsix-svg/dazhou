import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../hooks/useSillytavern';
import { OPENING_TEXTS } from '../data/openings';
import { ChevronRight, User, Users } from 'lucide-react';

interface Props { onStart: () => void; }
type Step = 'intro' | 'character' | 'opening';

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
  const { createChat, sendMessage, setChatMessages, isLoading } = useSillytavern();
  const [step, setStep] = useState<Step>('intro');
  const [introLine, setIntroLine] = useState(0);
  const [gender, setGender] = useState<'男' | '女' | '其他'>('男');
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [pendingOpening, setPendingOpening] = useState<{ text: string; id: number } | null>(null);
  const [previewOpening, setPreviewOpening] = useState<{ text: string; id: number; title: string; label: string } | null>(null);

  useEffect(() => {
    if (step !== 'intro') return;
    if (introLine >= INTRO_TEXT.length + 2) { setTimeout(() => setStep('character'), 800); return; }
    const t = setTimeout(() => setIntroLine(l => l + 1), introLine === 0 ? 1000 : 3000);
    return () => clearTimeout(t);
  }, [step, introLine]);

  const startedRef = useRef(false);
  // Reset guard on unmount so re-entering NewGameFlow works
  useEffect(() => () => { startedRef.current = false; }, []);

  useEffect(() => {
    if (!pendingOpening || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      const playerName = name.trim() || (gender === '男' ? '少侠' : gender === '女' ? '女侠' : '侠客');
      const cid = await createChat(`${playerName} - 江湖之旅`).catch(() => null);
      if (cid) {
        const { getChat, saveChat } = await import('../sillytavern/database');
        const chat = await getChat(cid);
        if (chat) {
          // Replace {主角} and {{user}} with player name/desc in the opening text
          const playerName = name.trim() || (gender === '男' ? '少侠' : gender === '女' ? '女侠' : '侠客');
          const playerDesc = name.trim() || (gender === '男' ? '一位初入江湖的少侠' : gender === '女' ? '一位初入江湖的女侠' : '一位初入江湖的侠客');
          const displayText = pendingOpening.text.replace(/\{主角\}/g, playerDesc).replace(/\{\{user\}\}/g, playerDesc);

          // ---- Layer 0: 开场白作为第一条用户消息（展示在 StoryArea） ----
          chat.messages = [
            { id: crypto.randomUUID(), role: 'user', content: displayText, timestamp: Date.now(), variables: {} },
          ];
          chat.updatedAt = Date.now();
          await saveChat(chat);
          setChatMessages(cid, chat.messages);
          console.log('[NewGame] Layer 0 saved, chatId:', cid, 'msg length:', displayText.length);

          // ---- Layer 1: 玩家信息发送给 AI，触发游戏开始 ----
          let playerInfo = `[玩家信息] 姓名：${playerName}，性别：${gender}`;
          if (desc.trim()) playerInfo += `，自我介绍：${desc.trim()}`;
          playerInfo += `。以上是玩家信息，开始游戏吧。`;
          console.log('[NewGame] Sending Layer 1:', playerInfo);
          try { await sendMessage(playerInfo, chat); console.log('[NewGame] sendMessage completed'); } catch (e) { console.error('sendMessage failed:', e); }
        }
      }
      console.log('[NewGame] calling onStart, cancelled:', cancelled);
      if (!cancelled) onStart();
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
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>自我介绍（可选）</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述你的外貌、性格、来历……让江湖知道你是谁" rows={3} style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-card)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', resize: 'vertical', outline: 'none' }} />
        </div>
        <button onClick={() => setStep('opening')} style={{ padding: '14px 48px', background: 'var(--wx-vermillion)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', letterSpacing: 4, borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-vermillion)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>踏入江湖 <ChevronRight size={20} /></button>
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
            {/* Body — full opening text */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {previewOpening.text}
            </div>
            {/* Footer — actions */}
            <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--bdr-subtle)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setPreviewOpening(null)} style={{ padding: '10px 28px', background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)' }}>再想想</button>
              <button onClick={() => { setPendingOpening({ text: previewOpening.text, id: previewOpening.id }); setPreviewOpening(null); }}
                style={{ padding: '10px 32px', background: 'var(--wx-vermillion)', color: '#fff', border: 'none', borderRadius: 'var(--rd-md)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', letterSpacing: 2 }}>选择此开局</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
