import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../hooks/useSillytavern';
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
  { id: 8, title: '华山脚下', desc: '华山脚下野酒肆，天剑阁叶惊秋以烧鸡作彩头邀人切磋剑术…', label: '剑阁赌约',
    opening: `第一回 野酒肆烧鸡作彩头 论剑台赌约牵红线

承平五十年，九月初八，重阳前一日。

华山脚下，一处歪歪斜斜的野酒肆里，酒气熏天。几张方桌旁横七竖八地坐着十几个佩剑的江湖人，有男有女，多是冲着明日重阳华山试剑大会来的。离试剑台最近的客栈早已人满为患，这破酒肆便成了落魄剑客们的栖身之所。

柜台后的老板娘是个裹着花布头巾的胖大婶，正拿块油腻腻的抹布有一下没一下地擦着桌面。灶台上炖着一大锅羊肉汤，咕嘟咕嘟地冒着白汽。

忽然，门外传来一阵马蹄声。紧接着，一只脚踩在门槛上，发出一声脆响。

那人跨进门来——一袭天剑阁制式的青色劲装，腰间别着一把轻薄如蝉翼的长剑，剑鞘上刻着两个字：掠影。

“老板娘！来两坛竹叶青，再切三斤熟牛肉！”

声音清脆，带着几分江湖儿女的豪迈。正是天剑阁论剑台真传弟子、惊蛰榜第五的叶惊秋。

她径自挑了张空桌坐下，目光扫了一圈屋内，最后停在角落一桌人身上。那双杏眼亮了一亮。

“哟，这儿还有人在呢。”

叶惊秋站起身，走到{{user}}桌前。她也不坐，只双手抱胸，微微歪着头，将那把掠影剑往桌上一拍，发出“啪”的一声脆响。

“明日就是试剑大会了，今晚闲着也是闲着。我这儿有只从山下镇上带的烧鸡——”她说着，从怀里掏出一个油纸包，拆开来，赫然是一只油光锃亮的烧鸡，香味直往鼻子里钻。

“你我切磋一场。若你能在我手下走三招，这鸡归你。若走不过，你请我喝一坛竹叶青。如何？”` },
  { id: 9, title: '开封城外', desc: '开封旱灾饥民遍地，白莲教设粥棚赈灾，圣女白非烟却不知自己只是棋子…', label: '白莲赈灾',
    opening: `第一回 旱魃千里饿殍遍野 圣女施粥暗藏杀机

承平五十年，七月初九。

开封城外十里，土地龟裂，庄稼枯黄。三个月滴雨未下，官道上野狗啃食着倒毙的流民尸骸，散发出令人作呕的甜腥味。道旁几株老槐树的叶子早已落尽，光秃秃的枝桠在烈日下投下稀疏的影子。

城门外，却是一派奇异的景象。

白莲教的粥棚一字排开，足有十座之多。每座粥棚前都排着长队，衣衫褴褛的灾民端着破碗，眼巴巴地望着那口冒着热气的大铁锅。几个身穿素白僧袍的白莲教弟子正拿着长勺分粥，口中念着“无生老母，真空家乡”的经文。

粥棚正中央，站着一位少女。

她不过二十出头年纪，穿着一袭素白长裙，长发仅用一根白丝带系在脑后。面容纯善圣洁，眼眸清澈得不染一丝尘埃。她正亲手将一碗碗热粥递到灾民手中，每递一碗，便轻声说一句：“无生老母保佑你。”

这便是白莲教核心圣女——白非烟。

她那纯净得不似凡尘的气质，在这饿殍遍野的荒郊野外，宛如一朵在泥泞中绽放的白莲。领到粥的灾民跪在地上磕头，称她为“活菩萨”。白非烟眼中闪过一丝不忍，忙伸手扶起老人，将粥碗亲自递到他手中。

此时，{{user}}正站在粥棚外的人群中。

白非烟注意到了你。她将手中的粥勺交给身旁的弟子，提起裙摆，朝你走来。那双清澈的眼眸望着你，带着几分好奇。

“这位施主，你是来领粥的吗？还是……来查探什么的？”

她微微一笑，那笑容纯净得让人不忍欺骗。但在那纯真的笑意深处，隐约藏着一丝不安——仿佛她自己也知道，这座粥棚之下，暗藏着远比赈灾更为复杂的真相。` },
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
  const { createChat, sendMessage } = useSillytavern();
  const [step, setStep] = useState<Step>('intro');
  const [introLine, setIntroLine] = useState(0);
  const [gender, setGender] = useState<'男' | '女' | '其他'>('男');
  const [desc, setDesc] = useState('');
  const [pendingOpening, setPendingOpening] = useState<{ text: string; id: number } | null>(null);

  // Intro text cycling
  useEffect(() => {
    if (step !== 'intro') return;
    if (introLine >= INTRO_TEXT.length + 2) {
      setTimeout(() => setStep('character'), 800);
      return;
    }
    const t = setTimeout(() => setIntroLine(l => l + 1), introLine === 0 ? 1000 : 3000);
    return () => clearTimeout(t);
  }, [step, introLine]);

  // When opening is selected, create chat and start
  useEffect(() => {
    if (!pendingOpening) return;
    (async () => {
      try { await createChat(`${gender === '男' ? '少侠' : gender === '女' ? '女侠' : '侠客'} - 江湖之旅`);
      // Start vars are pre-defined in START_VARS map — AI will set them based on opening context
      const introMsg = desc.trim()
        ? `[开局] ${pendingOpening.text}\n\n[玩家信息] 性别：${gender}。自我介绍：${desc}\n\n请根据上述开局背景开始叙事，并在首次回复中用 <var> 标签设置初始变量：所在地点、身体状态、持有银两、武功境界(淬体)、当前气血150、气血上限150、阵营倾向(中立)。`
        : `[开局] ${pendingOpening.text}\n\n[玩家信息] 性别：${gender}。\n\n请根据上述开局背景开始叙事，并在首次回复中用 <var> 标签设置初始变量：所在地点、身体状态、持有银两、武功境界(淬体)、当前气血150、气血上限150、阵营倾向(中立)。`;
      sendMessage(introMsg); } catch {} onStart();
      onStart();
    })();
  }, [pendingOpening]);

  const handleCustomStart = () => {
    const custom = (document.getElementById('custom-opening-input') as HTMLTextAreaElement)?.value?.trim();
    if (!custom) return;
    setPendingOpening({ text: custom, id: 1 });
  };

  if (step === 'intro') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {introLine < INTRO_TEXT.length && (
            <motion.div
              key={introLine}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                color: 'var(--wx-ink)',
                letterSpacing: '0.1em',
                textAlign: 'center',
                position: 'relative', zIndex: 1,
              }}
            >
              {INTRO_TEXT[introLine]}
            </motion.div>
          )}
          {introLine >= INTRO_TEXT.length && introLine < INTRO_TEXT.length + 2 && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                color: 'var(--wx-vermillion)',
                letterSpacing: '0.15em',
                position: 'relative', zIndex: 1,
                textShadow: '2px 2px 12px rgba(181,40,26,0.2)',
              }}
            >
              大周日暮录
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 'character') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wx-paper)', padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-2xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, marginBottom: 32 }}>创建角色</h2>

          {/* Gender */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 12 }}>选择性别</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {(['男', '女', '其他'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  padding: '14px 32px', cursor: 'pointer',
                  background: gender === g ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)',
                  border: `2px solid ${gender === g ? 'var(--wx-vermillion)' : 'var(--bdr-subtle)'}`,
                  borderRadius: 'var(--rd-md)', fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)',
                  color: gender === g ? 'var(--wx-vermillion)' : 'var(--wx-ink-dim)',
                  transition: 'all 0.2s', minWidth: 80,
                }}>
                  {g === '男' && <User size={16} style={{ marginRight: 4 }} />}
                  {g === '女' && <User size={16} style={{ marginRight: 4 }} />}
                  {g === '其他' && <Users size={16} style={{ marginRight: 4 }} />}
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>自我介绍（可选）</div>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="描述你的外貌、性格、来历……让江湖知道你是谁"
              rows={3}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-card)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', resize: 'vertical', outline: 'none' }}
            />
          </div>

          <button onClick={() => setStep('opening')} style={{
            padding: '14px 48px', background: 'var(--wx-vermillion)', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', letterSpacing: 4, borderRadius: 'var(--rd-md)',
            boxShadow: 'var(--sh-vermillion)', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            踏入江湖 <ChevronRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  // step === 'opening'
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--wx-paper)', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '24px 20px 16px', borderBottom: '1px solid var(--bdr-subtle)' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', letterSpacing: 2, margin: 0 }}>选择开局</h2>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>选一个故事开始，或自己写一段开场</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, maxWidth: 900, margin: '0 auto' }}>
          {OPENINGS.map((o, i) => (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3, boxShadow: 'var(--sh-gold)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const prompt = (o as unknown as { opening?: string }).opening
                  ? ((o as unknown as { opening: string }).opening.replace(/\{\{user\}\}/g, desc || `${gender === '男' ? '一位初入江湖的少侠' : gender === '女' ? '一位初入江湖的女侠' : '一位初入江湖的侠客'}`))
                  : `[开局选择] ${o.label}\n\n请以"${o.title}"为背景开始游戏，我是${gender === '男' ? '一位初入江湖的少侠' : gender === '女' ? '一位初入江湖的女侠' : '一位初入江湖的侠客'}${desc ? '，' + desc : '。'}请从这个场景开始叙述。`;
                setPendingOpening({ text: prompt, id: o.id });
              }}
              style={{
                padding: '18px 16px', cursor: 'pointer', textAlign: 'left',
                background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)',
                borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-vermillion)', letterSpacing: 1 }}>{o.title}</span>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--wx-gold)', background: 'var(--wx-gold-dim)', padding: '2px 8px', borderRadius: 'var(--rd-full)' }}>{o.label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', lineHeight: 1.6 }}>{o.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* Custom opening */}
        <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '16px', background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>或自己写下开场…</div>
          <textarea id="custom-opening-input" rows={3} placeholder="写一段你的开场叙事，AI将从此开始……" style={{ width: '100%', padding: '12px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-sm)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', resize: 'vertical', outline: 'none' }} />
          <button onClick={handleCustomStart} className="wx-btn wx-btn-red" style={{ marginTop: 10, padding: '10px 24px' }}>以此开场</button>
        </div>
      </div>
    </div>
  );
}
