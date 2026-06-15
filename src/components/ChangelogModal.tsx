interface Props { onClose: () => void; }

const LOGS = [
  {
    version: 'v1.0.1',
    date: '2026年6月15日',
    items: [
      '世界书逻辑修复：修正历史年号错误（大周150年→205年）、国祚275→269年、黔国公一脉姓名统一等 25 处漏洞',
      '势力定位优化：三教重分类为"异端教派"、凉国公府定位修正、梁王府追加白莲教应对策略',
      '角色数据校准：武极登基33岁、武悼/铁痕参战年龄、褚鉴之东宫血案年龄等 5 处修正',
      '武学体系完善：绝顶境上限800→1000、秘籍未定义等级补充、落雁剑法补录、残余标签清除',
      '时间线自洽：玉龙璧之变→正魔大战→承平帝登基三年连贯链对齐',
      '西北秘盟与太行阴契联动说明，两大反叛联盟暗中互通情报的逻辑补全',
      '手机端输入栏 position:fixed 钉底，100dvh 视口适配，正文区 padding-bottom 补偿',
      '手机端侧边栏改为滑出抽屉式导航，选项区横向滑动卡片，不遮挡正文',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026年6月',
    items: [
      '九段开局：飞狐径酒肆、长安西市等，每篇有定场诗与 NPC 互动',
      '421 条世界书：涵盖势力、人物、武学、地区、榜单、历史，AI 自动注入',
      '三模型流水线：正文引擎 → 变量引擎 → 记忆引擎，各配独立 API',
      '流式正文输出，楼层分隔，转场标签，【NPC】对话气泡',
      '常驻顶部状态栏：时间、地点，AI 推动剧情时自动更新',
      '排行榜：定海神针、太阿录、惊蛰榜、群芳谱、名锋卷，点击可展开醉花阴评语',
      '悬赏令：每场开局独立生成 5 条，赏金 15~500 两，含出没地点与追踪',
      '人脉：NPC 完整档案，基本信息、武学、持有物品、态度条、内心独白',
      '背包 · 仓库：静默存取，不浪费聊天楼层，AI 感知物品转移',
      '记忆系统：重要性评分、向量语义搜索、定期合并压缩',
      '战力体系：八境百分比进度，同境段位差决定胜负，跨境正面必败',
      '心魔规则：阈值触发叙事故意、NPC 察觉、幻听，满值走火入魔',
      '角色创建：天赋加点 10 点自由分配，三武学路径选择',
      '全屏设置：接口库管理、变量/记忆路由分配、提示词模版可编辑、预设导入',
      '战斗级悬赏规则：境界压制，无法越级挑战',
      '内置预设「双人成行」246 条，大周武侠文风',
      '地图：当前位置脉冲标记，点击查看百晓生风格地点描述',
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
