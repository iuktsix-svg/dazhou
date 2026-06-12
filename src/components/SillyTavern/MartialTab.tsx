import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { SwordIcon } from '../icons';
import { BookOpen, Zap } from 'lucide-react';

interface MartialSkill { name: string; type: string; description?: string; }

function parseSkills(variables: Record<string, string | number>): MartialSkill[] {
  const raw = variables['已学武学'] || variables['主角状态.已学武学'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s: unknown) => {
      if (typeof s === 'object' && s) {
        const obj = s as Record<string, unknown>;
        return {
          name: String(obj.名称 || obj.name || '未知武学'),
          type: String(obj.类型 || obj.type || '外功'),
          description: obj.描述 || obj.description ? String(obj.描述 || obj.description) : undefined,
        };
      }
      return { name: String(s), type: '外功' };
    });
  }
  return [];
}

const TYPE_COLORS: Record<string, string> = {
  '内功': 'var(--indigo)', '外功': 'var(--vermillion)', '轻功': 'var(--jade)', '秘术': 'var(--gold)',
};

export function MartialTab() {
  const { activeChat, sendMessage } = useSillytavern();
  const vars = activeChat?.variables || {};
  const skills = useMemo(() => parseSkills(vars), [vars]);

  const hasManual = useMemo(() => {
    const items = vars['随身行囊'] || vars['主角状态.随身行囊'];
    if (Array.isArray(items)) return items.some((i: unknown) => typeof i === 'object' && i && ((i as Record<string, unknown>).类型 === '秘籍' || (i as Record<string, unknown>).type === '秘籍'));
    return false;
  }, [vars]);

  return (
    <div>
      <div className="martial-action-row">
        {hasManual && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="martial-action-btn study" onClick={() => sendMessage('研习行囊中的武学秘籍。')}>
            <BookOpen size={15} /> 研习秘籍
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="martial-action-btn meditate" onClick={() => sendMessage('运功调息，恢复气血和真气。')}>
          <Zap size={15} /> 运功调息
        </motion.button>
      </div>

      <div className="panel-section-title">已学武学</div>

      {skills.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">尚未习得武学</div></div>
      ) : (
        skills.map((skill, i) => (
          <motion.div
            key={`${skill.name}-${i}`}
            className="martial-skill-card"
            style={{ borderLeftColor: TYPE_COLORS[skill.type] || 'var(--moon-dim)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ x: 4 }}
          >
            <div className="martial-skill-header">
              <div className="martial-skill-name">
                <SwordIcon size={14} style={{ color: TYPE_COLORS[skill.type] || 'var(--moon-dim)' }} />
                {skill.name}
              </div>
              <span className="martial-skill-type" style={{
                background: `${TYPE_COLORS[skill.type] || 'var(--moon-dim)'}20`,
                color: TYPE_COLORS[skill.type] || 'var(--moon-dim)',
              }}>{skill.type}</span>
            </div>
            {skill.description && <div className="martial-skill-desc">{skill.description.slice(0, 100)}{skill.description.length > 100 ? '…' : ''}</div>}
          </motion.div>
        ))
      )}
    </div>
  );
}
