interface Props { onClose: () => void; }

const LOGS = [
  {
    version: 'v1.0.0',
    date: '2026年6月',
    items: [
      '初始版本发布',
      '双主题系统：日间宣纸水墨 / 夜间暗黑风格一键切换',
      '完整武侠 UI：左导航 + 右状态 + 中间正文卷轴式三栏布局',
      '六大功能面板：命盘、人脉、行囊、情报、榜单、地图',
      '书架式榜单：定海神针榜、太阿录、惊蛰榜、群芳谱、名锋卷、岁时节庆录',
      '悬赏令独立系统：追杀榜单独展示，含追踪功能',
      '交互式地图：无标签瓦片底图，55+ 地点标记，丝绸之路/大运河/蜀道路线可点击',
      '背囊与仓库系统：20 栏位限制，七类物品分类，卡片网格展示',
      '三 API 端点架构：正文生成 + 变量校验 + 记忆压缩',
      '世界书引擎：422 条目自动导入，关键词匹配注入 System Prompt',
      '变量系统：嵌套路径支持，深层替换，自动提取 <var> 标签',
      '修炼体系：凡骨→天人八境，心魔值追踪，破境需剧情契机',
      '50+ 外国角色完整人设：东瀛、波斯、吐蕃、南洋、英吉利、高丽',
      '毛笔楷书标题 + 朱砂印章 Logo + 宣纸纹理背景',
    ],
  },
];

export function ChangelogModal({ onClose }: Props) {
  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="dz-modal-head">
          <h2>更新日志</h2>
          <button className="dz-modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="dz-modal-body">
          {LOGS.map(log => (
            <div key={log.version}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', letterSpacing: 1 }}>{log.version}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>{log.date}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                {log.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-light)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--wx-vermillion)', flexShrink: 0 }}>·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="dz-modal-foot" />
      </div>
    </div>
  );
}
