import { useEffect, useState } from 'react';
import { getChats } from '../../sillytavern/database';
import { Users, Swords, Heart, Shield, Gem, MessageCircle } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }
interface NPCData { 基本信息?: Record<string, unknown>; 武学信息?: Record<string, unknown>; 持有物品?: Record<string, unknown>; 对user态度?: Record<string, unknown>; 所属势力?: string; 武功层次?: string; 好感度?: number; 敬畏度?: number; 利用价值?: number; 当前心理活动?: string; }

function AttBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="cm-att">
      <div className="cm-att-head"><span>{label}</span><span className="cm-att-val">{value}</span></div>
      <div className="cm-att-track"><div className="cm-att-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

export function ContactsModal({ isOpen, onClose }: Props) {
  const [npcs, setNpcs] = useState<Record<string, NPCData>>({});
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { if (!isOpen) return; getChats().then(chats => { const raw = ((chats[0]?.variables || {}) as Record<string, unknown>)['江湖人际录'] as Record<string, NPCData> || {}; setNpcs(raw); const k = Object.keys(raw); if (k.length && !sel) setSel(k[0]); }); }, [isOpen]);
  const npc = sel ? npcs[sel] : null; const keys = Object.keys(npcs);
  if (!isOpen) return null;

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="cm-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cm-head">
          <Users size={18} />
          <span>江湖人脉</span>
          {keys.length > 0 && <span className="cm-count">{keys.length}人</span>}
          <button className="cm-close" onClick={onClose}>×</button>
        </div>

        <div className="cm-body">
          {keys.length === 0 ? (
            <div className="cm-empty">暂无结识的江湖人士</div>
          ) : (
            <>
              {/* NPC list — horizontal scrollable pills */}
              <div className="cm-list">
                {keys.map(k => (
                  <button key={k} className={`cm-pill ${k === sel ? 'active' : ''}`} onClick={() => setSel(k)}>
                    <span className="cm-pill-avatar">{k.charAt(0)}</span>
                    <span className="cm-pill-name">{k}</span>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              {npc && (
                <div className="cm-detail">
                  {/* Name + faction + level */}
                  <div className="cm-detail-head">
                    <h3>{sel}</h3>
                    <div className="cm-tags">
                      {npc['所属势力'] && <span className="cm-tag faction">{npc['所属势力']}</span>}
                      {npc['武功层次'] && <span className="cm-tag level">{npc['武功层次']}</span>}
                    </div>
                  </div>

                  {/* Attitude bars */}
                  <div className="cm-section">
                    <div className="cm-section-title"><Heart size={13} />态度</div>
                    <AttBar label="好感" value={npc['好感度'] ?? 0} max={100} color="linear-gradient(to right, #c53030, #f56565)" />
                    <AttBar label="敬畏" value={npc['敬畏度'] ?? 0} max={100} color="linear-gradient(to right, #2b6cb0, #63b3ed)" />
                    <AttBar label="价值" value={npc['利用价值'] ?? 0} max={100} color="linear-gradient(to right, #c8a060, #f0d080)" />
                  </div>

                  {/* 基本信息 */}
                  {npc['基本信息'] && Object.keys(npc['基本信息']).length > 0 && (
                    <div className="cm-section">
                      <div className="cm-section-title"><Users size={13} />基本信息</div>
                      <div className="cm-grid">
                        {Object.entries(npc['基本信息']).map(([k, v]) => (
                          <div key={k} className="cm-grid-item">
                            <span className="cm-grid-label">{k}</span>
                            <span className="cm-grid-value">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 武学信息 */}
                  {npc['武学信息'] && Object.keys(npc['武学信息']).length > 0 && (
                    <div className="cm-section">
                      <div className="cm-section-title"><Swords size={13} />武学信息</div>
                      <div className="cm-grid">
                        {Object.entries(npc['武学信息']).map(([k, v]) => (
                          <div key={k} className="cm-grid-item">
                            <span className="cm-grid-label">{k}</span>
                            <span className="cm-grid-value">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 持有物品 */}
                  {npc['持有物品'] && Object.keys(npc['持有物品']).length > 0 && (
                    <div className="cm-section">
                      <div className="cm-section-title"><Gem size={13} />持有物品</div>
                      <div className="cm-grid">
                        {Object.entries(npc['持有物品']).map(([k, v]) => (
                          <div key={k} className="cm-grid-item">
                            <span className="cm-grid-label">{k}</span>
                            <span className="cm-grid-value">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 对user态度 */}
                  {npc['对user态度'] && Object.keys(npc['对user态度']).length > 0 && (
                    <div className="cm-section">
                      <div className="cm-section-title"><Shield size={13} />对我的态度</div>
                      <div className="cm-grid">
                        {Object.entries(npc['对user态度']).filter(([k]) => k !== '内心短评').map(([k, v]) => (
                          <div key={k} className="cm-grid-item">
                            <span className="cm-grid-label">{k}</span>
                            <span className="cm-grid-value">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 内心独白 */}
                  {npc['当前心理活动'] && (
                    <div className="cm-section">
                      <div className="cm-section-title"><MessageCircle size={13} />内心独白</div>
                      <div className="cm-quote">{npc['当前心理活动']}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
