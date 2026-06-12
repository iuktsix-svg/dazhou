import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { X } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }
interface NPCData { 基本信息?: Record<string, unknown>; 武学信息?: Record<string, unknown>; 持有物品?: Record<string, unknown>; 对user态度?: Record<string, unknown>; 所属势力?: string; 武功层次?: string; 好感度?: number; 敬畏度?: number; 利用价值?: number; 当前心理活动?: string; }

export function ContactsModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [npcs, setNpcs] = useState<Record<string, NPCData>>({});
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const raw = ((activeChat?.variables || {}) as Record<string, unknown>)['江湖人际录'] as Record<string, NPCData> || {};
    setNpcs(raw);
    const keys = Object.keys(raw);
    if (keys.length && !sel) setSel(keys[0]);
  }, [isOpen, activeChat]);

  const npc = sel ? npcs[sel] : null;

  const renderDetail = () => {
    if (!npc) return <div className="dz-empty"><div className="gd">请选择上方一位人物。</div></div>;
    const b = npc.基本信息 || {}; const w = npc.武学信息 || {}; const a = npc.对user态度 || {};
    const extended = Object.keys(b).length > 0 || Object.keys(w).length > 0 || Object.keys(a).length > 0;

    const AttB = ({ l, v, color }: { l: string; v: string; color: string }) => {
      const vm: Record<string, number> = { '倾心/生死': 100, '知己': 80, '平淡': 50, '臣服/恐惧': 100, '仰望': 80, '忌惮': 60, '平视': 40, '核心盟友': 100, '高价值筹码': 75, '可用之材': 50 };
      const pct = vm[v] !== undefined ? vm[v] : Math.min(100, Math.max(0, Number(v) || 0));
      return (<div style={{ marginBottom: 8 }}>
        <div className="dz-stat-label"><span>{l}</span><span>{v}</span></div>
        <div className="dz-stat-track"><div className="dz-stat-fill" style={{ width: `${pct}%`, background: color }} /></div>
      </div>);
    };

    if (extended) return <div className="dz-npc-detail">
      <div className="dz-sec"><div className="dz-sec-title">基本信息</div>
        <div className="dz-npc-field"><span className="k">年龄</span><span className="v">{String(b['年龄'] || '--')}</span></div>
        <div className="dz-npc-field"><span className="k">状态</span><span className="v">{String(b['状态'] || '--')}</span></div>
        <div className="dz-npc-field"><span className="k">神色</span><span className="v">{String(b['神色'] || '--')}</span></div>
        <div className="dz-npc-field"><span className="k">衣着</span><span className="v">{String(b['衣着'] || '--')}</span></div>
      </div>
      <div className="dz-sec"><div className="dz-sec-title">武学信息</div>
        <div className="dz-npc-field"><span className="k">境界</span><span className="v">{String(w['境界'] || '--')}</span></div>
        <div className="dz-npc-field"><span className="k">内功</span><span className="v">{String(w['内功'] || '--')}</span></div>
        <div className="dz-npc-field"><span className="k">外功</span><span className="v">{String(w['外功'] || '--')}</span></div>
      </div>
      <div className="dz-sec"><div className="dz-sec-title">对我的态度</div>
        <AttB l="情感羁绊" v={String(a['情感羁绊'] || '--')} color="linear-gradient(to right, #b83b5e, #d9534f)" />
        <AttB l="敬畏威慑" v={String(a['敬畏威慑'] || '--')} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
        <AttB l="利益价值" v={String(a['利益价值'] || '--')} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
        {a['内心短评'] ? <div className="dz-npc-quote">{String(a['内心短评'])}</div> : null}
      </div>
    </div>;

    return <div className="dz-npc-detail">
      <div className="dz-npc-field"><span className="k">所属势力</span><span className="v">{npc['所属势力'] || '--'}</span></div>
      <div className="dz-npc-field"><span className="k">武功层次</span><span className="v">{npc['武功层次'] || '--'}</span></div>
      <AttB l="好感" v={String(npc['好感度'] || 0)} color="linear-gradient(to right, #b83b5e, #d9534f)" />
      <AttB l="敬畏" v={String(npc['敬畏度'] || 0)} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
      <AttB l="价值" v={String(npc['利用价值'] || 0)} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
      {npc['当前心理活动'] ? <div className="dz-npc-quote">{String(npc['当前心理活动'])}</div> : null}
    </div>;
  };

  const keys = Object.keys(npcs);

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`} style={{ maxHeight: '85vh' }}>
      <div className="dz-modal-halftone" />
      <div className="dz-modal-head"><h2>江湖人脉</h2><button className="dz-modal-close" onClick={onClose}><X size={18} /></button></div>
      <div className="dz-modal-body">
        {keys.length === 0 ? (
          <div className="dz-empty"><div className="ic">👥</div><div className="tl">暂无结识的江湖人士</div><div className="gd">与 NPC 对话、切磋或同行后，<br />他们会出现在这里。</div></div>
        ) : (<>
          <div className="dz-npc-row">{keys.map(k => <div key={k} className={`dz-npc-chip ${k===sel?'sel':''}`} onClick={()=>setSel(k)}><div className="av">{k.charAt(0)}</div><div className="nm">{k}</div></div>)}</div>
          {renderDetail()}
        </>)}
      </div>
      <div className="dz-modal-foot" />
    </div>
  );
}
