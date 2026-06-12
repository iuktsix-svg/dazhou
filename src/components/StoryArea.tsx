import { useState } from 'react';
import { type ChatMessage, ASSISTANT_ROLE } from '../sillytavern';
import { useSillytavern } from '../hooks/useSillytavern';

interface Props { messages: ChatMessage[]; streamingText: string; isStreaming: boolean; onOption: (text: string) => void; }

function parseBlocks(text: string) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks: { type: 'npc' | 'narration'; name?: string; text: string }[] = [];
  let cur = ''; let curType: 'npc' | 'narration' = 'narration'; let curName = '';
  for (const line of lines) {
    const m1 = line.match(/^【(.+?)】(.*)/), m2 = line.match(/^(.{1,6})：(.+)/);
    if (m1 || m2) {
      if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() });
      curName = m1 ? m1[1] : m2![1]; cur = m1 ? m1[2] : m2![2]; curType = 'npc';
    } else {
      if (curType === 'npc' && line.trim()) { cur += '\n' + line; }
      else { if (curType === 'narration') cur += (cur ? '\n' : '') + line; else { if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() }); curType = 'narration'; curName = ''; cur = line; } }
    }
  }
  if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() });
  return blocks.length > 0 ? blocks : [{ type: 'narration' as const, text }];
}

const DEMO_TEXT = `<maintext>
暮色如血，洛阳城西的官道被夕阳染成一片暗红。

你牵着马走出函谷关，身后是连绵起伏的邙山。三日前在洛阳平康坊接下的那桩差事——护送一封密信前往长安秦王府——本该是趟轻松的活计。但自打出了洛阳城，一路上总有几双眼睛在暗处盯着你。

今日午时，你终于撞破了他们的来历。

三具尸体横在官道旁的乱石堆里，衣物上绣着控鹤府的暗纹。你蹲下身，从领头那人怀中摸出一块铜牌——左鹤司，乙字第七号。阎枭的人。

"控鹤府也掺和进来了......"你把铜牌翻过来，背面刻着一行小字：截杀持信者，取密信，焚之。

风忽然变了方向。你抬起头，前方的岔路口站着一个人。

【茶摊老者】
"客官，天色不早了，喝碗茶再赶路吧。"

岔路口不知何时多了一个简陋的茶摊。支着两张方桌的老人正用蒲扇扇着炉火，炉上陶壶咕嘟作响。他看起来六十出头，穿着满是补丁的粗布短褐，头上顶着一顶磨破了边的竹笠。那双浑浊的眼睛正笑吟吟地望着你。

你扫了一眼茶摊。桌上摆着四个碗，其中一碗还冒着热气——像是刚才还有人坐在这里。

老者似乎注意到了你的目光，不紧不慢地说道："方才有个穿黑衣的客官，喝了半碗茶就急匆匆往长安方向去了。临走还多给了二两银子......这年头，人心惶惶啊。"

他从炉上提下陶壶，慢悠悠地斟了一碗茶，朝你推过来。

"老朽姓楚，在这官道旁支了几十年的茶摊。这几年啊，往长安去的生面孔越来越多了。"他拿起粗瓷碗自己喝了一口，压低声音："客官可听说了？秦王殿下上月进贡了八千匹战马，朝堂上有人说他是在'扩军备战'，也有人说......这是在'清君侧'。"

【楚老丈】
"哎，老朽多嘴了。不过客官若是要去长安，我倒是有个忠告——别走官道了，翻终南山吧。虽然绕远些，但至少不会碰上'那些人'。"

他指了指地上那些控鹤府的尸首，眼中忽然闪过一丝精光，随即又恢复了浑浊。他站起身，开始收拾茶具，仿佛刚才那句话只是无心之言。
</maintext>
<thinking>
茶摊老者楚老丈的身份存疑。他认出控鹤府的尸首却毫不惊慌，且对秦王府内情了如指掌。可能身份：1) 前控鹤府退隐人员 2) 太玄观的外线耳目 3) 秦王府安插在洛阳至长安要道上的暗桩。建议后续调查。
</thinking>
<option>
1. 端起茶碗抿了一口："老人家，这终南山的路，该怎么走？"
2. 将茶碗推回去，翻身上马，继续沿官道前行
3. 拔剑指向老者："你到底是何人？这茶摊今日之前并不在此处！"
4. 在茶摊歇脚，向老者打听秦王府和控鹤府之间的纠葛
</option>
<var name="当前所在地点" value="洛阳至长安官道·岔路口茶摊" />
<var name="当前气血" value="85" />
<var name="当前真气" value="72" />
<var name="持有银两" value="150" />
<var name="身体状态" value="轻伤" />
<var name="江湖风媒情报.控鹤府动向" value="控鹤府左鹤司奉命截杀前往长安秦王府的密使，阎枭手下已有多名探子埋伏在洛阳至长安沿线" />
<var name="江湖人际录.楚老丈" value='{"所属势力":"未知","武功层次":"深藏不露","好感度":20,"当前心理活动":"这小子能干掉三个控鹤府的人，身手不差。但愿他能把密信送到秦王手上。"}' />
</maintext>`;

export function StoryArea({ messages, streamingText, isStreaming, onOption }: Props) {
  const { settings } = useSillytavern();
  const [info] = useState({ time: '酉时三刻·日落时分', location: '洛阳至长安官道·岔路口茶摊' });
  const stripTags = settings?.stripTags || ['thinking', 'think', 'sum', 'vars'];

  const last = [...messages].reverse().find(m => m.role === ASSISTANT_ROLE);
  const rawText = (isStreaming && streamingText) ? streamingText : (last?.content || DEMO_TEXT);

  // Strip tags for clean display
  // Strip display tags dynamically from settings
  let cleanText = rawText
    .replace(/<maintext>/gi, '').replace(/<\/maintext>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<var\s[^>]*\/>/gi, '');   // self-closing var tags
  for (const tag of stripTags) {
    cleanText = cleanText.replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
  }

  const blocks = parseBlocks(cleanText);

  // Extract options from <option> or <w3g> tags
  const optMatch = rawText.match(/<option>([\s\S]*?)<\/option>/i);
  const w3gMatch = !optMatch ? rawText.match(/<w3g>([\s\S]*?)<\/w3g>/i) : null;
  const optRaw = optMatch ? optMatch[1] : (w3gMatch ? w3gMatch[1] : '');
  const options = optRaw
    ? optRaw.trim().split(/\r?\n/).map((l: string) => l.trim().replace(/^\d+\.\s*/, '')).filter(Boolean)
    : [];

  const hasContent = messages.length > 0;

  return (
    <div className="dz-story">
      <div className="dz-story-inner">
        {!hasContent && !isStreaming && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
            paddingBottom: 16, borderBottom: '1px solid var(--bdr-subtle)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ fontSize: 'var(--text-lg)', color: 'var(--wx-gold)', fontWeight: 600 }}>{info.time}</span>
            <span style={{ color: 'var(--wx-ink-dim)', fontSize: 'var(--text-base)' }}>·</span>
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--wx-ink)' }}>{info.location}</span>
          </div>
        )}

        {blocks.map((b, i) => b.type === 'npc' ? (
          <div key={i} className="dz-bubble">
            {b.name && <div className="dz-bubble-label">{b.name}</div>}
            <div className="dz-bubble-text">{b.text}</div>
          </div>
        ) : (
          <div key={i} className="dz-narration">{b.text}</div>
        ))}
        {isStreaming && streamingText && <span className="dz-cursor" />}
      </div>
      {options.length > 0 && (
        <div className="dz-options">
          {options.map((opt: string, i: number) => (
            <div key={i} className="dz-option" onClick={() => onOption(opt)}>
              <div className="opt-idx">选项 {i + 1}</div>
              <div className="opt-text">{opt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
