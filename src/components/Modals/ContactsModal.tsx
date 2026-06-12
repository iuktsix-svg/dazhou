import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

interface NPCData {
  基本信息?: Record<string, unknown>; 武学信息?: Record<string, unknown>;
  持有物品?: Record<string, unknown>; 对user态度?: Record<string, unknown>;
  所属势力?: string; 武功层次?: string; 好感度?: number; 敬畏度?: number;
  利用价值?: number; 当前心理活动?: string;
}

export function ContactsModal({ isOpen, onClose, onSend: _ }: Props) {
  const { activeChat } = useSillytavern();
  const [npcs, setNpcs] = useState<Record<string, NPCData>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    const raw = (vars['江湖人际录'] || {}) as Record<string, NPCData>;
    setNpcs(raw);
    const keys = Object.keys(raw);
    if (keys.length && !selected) setSelected(keys[0]);
  }, [isOpen, activeChat]);

  const npc = selected ? npcs[selected] : null;

  const renderDetail = () => {
    if (!npc) return <div className="dz-empty"><div className="guide">请在上方选择一位人物。</div></div>;
    const basic = npc.基本信息 || {}; const wushu = npc.武学信息 || {};
    const items = npc.持有物品 || {}; const att = npc.对user态度 || {};
    const hasExtended = Object.keys(basic).length > 0 || Object.keys(wushu).length > 0 || Object.keys(att).length > 0;

    if (hasExtended) {
      return (
        <div className="dz-npc-detail">
          <div className="dz-section"><div className="dz-section-title">基本信息</div>
            <div className="dz-npc-field"><span className="key">年龄</span><span className="val">{String(basic['年龄'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">状态</span><span className="val">{String(basic['状态'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">神色</span><span className="val">{String(basic['神色'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">衣着</span><span className="val">{String(basic['衣着'] || '--')}</span></div>
          </div>
          <div className="dz-section"><div className="dz-section-title">武学信息</div>
            <div className="dz-npc-field"><span className="key">境界</span><span className="val">{String(wushu['境界'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">内功</span><span className="val">{String(wushu['内功'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">外功</span><span className="val">{String(wushu['外功'] || '--')}</span></div>
          </div>
          <div className="dz-section"><div className="dz-section-title">持有物品</div>
            <div className="dz-npc-field"><span className="key">兵器</span><span className="val">{String(items['兵器'] || '--')}</span></div>
            <div className="dz-npc-field"><span className="key">物品</span><span className="val">{String(items['物品'] || '--')}</span></div>
          </div>
          <div className="dz-section"><div className="dz-section-title">对我的态度</div>
            <AttBar label="情感羁绊" val={String(att['情感羁绊'] || '--')} color="linear-gradient(to right, #b83b5e, #d9534f)" />
            <AttBar label="敬畏威慑" val={String(att['敬畏威慑'] || '--')} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
            <AttBar label="利益价值" val={String(att['利益价值'] || '--')} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
            {att['内心短评'] ? <div className="dz-npc-quote">{String(att['内心短评'])}</div> : null}
          </div>
        </div>
      );
    }

    return (
      <div className="dz-npc-detail">
        <div className="dz-npc-field"><span className="key">所属势力</span><span className="val">{npc['所属势力'] || '--'}</span></div>
        <div className="dz-npc-field"><span className="key">武功层次</span><span className="val">{npc['武功层次'] || '--'}</span></div>
        <AttBar label="好感" val={String(npc['好感度'] || 0)} color="linear-gradient(to right, #b83b5e, #d9534f)" />
        <AttBar label="敬畏" val={String(npc['敬畏度'] || 0)} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
        <AttBar label="价值" val={String(npc['利用价值'] || 0)} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
        {npc['当前心理活动'] ? <div className="dz-npc-quote">{String(npc['当前心理活动'])}</div> : null}
      </div>
    );
  };

  const keys = Object.keys(npcs);

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`} style={{ maxHeight: '85vh' }}>
      <div className="dz-modal-head">
        <h2>江湖人脉</h2>
        <button className="dz-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="dz-modal-body">
        {keys.length === 0 ? (
          <div className="dz-empty">
            <div className="icon">👥</div>
            <div className="title">暂无结识的江湖人士</div>
            <div className="guide">与 NPC 对话、切磋或同行后，<br />他们会出现在这里供你查看信息。</div>
          </div>
        ) : (
          <>
            <div className="dz-npc-row">
              {keys.map(k => (
                <div key={k} className={`dz-npc-chip ${k === selected ? 'selected' : ''}`} onClick={() => setSelected(k)}>
                  <div className="avatar">{k.charAt(0)}</div>
                  <div className="name">{k}</div>
                </div>
              ))}
            </div>
            {renderDetail()}
          </>
        )}
      </div>
    </div>
  );
}

function AttBar({ label, val, color }: { label: string; val: string; color: string }) {
  const vMap: Record<string, number> = { '倾心/生死': 100, '知己': 80, '平淡': 50, '臣服/恐惧': 100, '仰望': 80, '忌惮': 60, '平视': 40, '核心盟友': 100, '高价值筹码': 75, '可用之材': 50 };
  const pct = vMap[val] !== undefined ? vMap[val] : Math.min(100, Math.max(0, Number(val) || 0));
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="dz-stat-bar-label"><span>{label}</span><span>{val}</span></div>
      <div className="dz-stat-bar-track"><div className="dz-stat-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
