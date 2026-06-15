// ============================================================
// 大周日暮录 世界书优化脚本
// ============================================================
// 优化策略:
// 1. 拆分巨型条目（角色速览 7596 chars → 按势力拆分为小条目）
// 2. 转换 9 条 constant 为 selective
// 3. 解决重复关键词
// 4. 添加 group 分组
// 5. 添加 cooldown/sticky
// ============================================================

const fs = require('fs');
const path = require('path');

const INPUT = path.resolve(__dirname, '../src/lorebooks/大周日暮录v1.0.json');
const OUTPUT = path.resolve(__dirname, '../src/lorebooks/大周日暮录v1.0.json');

// ---- Load ----
const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
const entries = data.entries;
let maxUid = Math.max(...Object.keys(entries).map(Number));

function nextUid() {
  return ++maxUid;
}

// ============================================================
// STEP 1: Split giant entry uid=53 (角色速览, 7596 chars)
// ============================================================
function splitCharacterRoster() {
  const entry = entries['53'];
  if (!entry) return;

  const content = entry.content;
  const baseOrder = entry.order;

  // Parse faction blocks from the content
  // Each faction section starts with a header like "  大周皇室与朝廷中枢:" or "  七大正派:"
  const factionPattern = /  (\S[^:]*?):\n([\s\S]*?)(?=\n  \S[^:]*?:|\n<\/角色速览|$)/g;

  const factions = [];
  let match;
  while ((match = factionPattern.exec(content)) !== null) {
    const name = match[1].trim();
    const body = match[2].trim();
    factions.push({ name, body });
  }

  // Also extract the iron law preamble (before first faction)
  const preambleMatch = content.match(/^([\s\S]*?)(?=\n  大周皇室)/);
  const preamble = preambleMatch ? preambleMatch[1].trim() : '';

  // Map faction names to groups and trigger keywords
  const factionMap = {
    '大周皇室与朝廷中枢': {
      group: 'character',
      keys: ['皇室成员', '朝廷中枢', '皇帝', '天后', '皇太孙', '太孙太妃'],
      subBlocks: [
        { name: '皇室核心与后宫', keys: ['武极', '承平帝', '崔玉真', '沈清颜', '裴素仪', '武玄真', '阿史那云', '谢宜安', '淑妃', '德妃'] },
        { name: '京畿大都督府', keys: ['武悼', '镇国公', '贺拔冲', '楚铁甲', '卢敬亭', '京畿大都督'] },
        { name: '凤阁', keys: ['武明空', '长公主', '谢令姜', '上官婉', '独孤伽'] },
        { name: '控鹤府', keys: ['魏九重', '阎枭', '段千劫', '控鹤府'] },
        { name: '大理寺', keys: ['铁痕', '冷追命', '展飞星', '慕容妍', '花解语'] },
        { name: '朝堂六部与地方', keys: ['崔知命', '宰相', '六部尚书', '御史大夫', '江南总督', '裴行之', '薛定边', '卢居正', '褚鉴之', '王景之'] },
      ],
    },
    '地方藩镇势力': {
      group: 'character',
      keys: ['藩镇人物', '藩王', '国公', '都护'],
      subBlocks: [
        { name: '乾国公府', keys: ['袭天远', '乾国公', '袭长缨', '袭晚宁', '高素', '崔克俭'] },
        { name: '黔国公府', keys: ['沐镇山', '黔国公', '沐霆威', '沐云崖'] },
        { name: '凉国公府', keys: ['蓝岳', '凉国公', '蓝破阵', '蓝听雪'] },
        { name: '秦王府', keys: ['武承疆', '秦王', '武玄策', '武红妆'] },
        { name: '晋王府', keys: ['武骧', '晋王', '武天骄', '武青鸾'] },
        { name: '梁王府', keys: ['武延秀', '梁王', '武媚儿', '谢盈'] },
        { name: '楚王府', keys: ['武安邦', '楚王', '武惊澜'] },
        { name: '安北都护府', keys: ['贺兰万钧', '安北大都护', '完颜破', '呼延铁'] },
        { name: '西域都护府', keys: ['安镇疆', '西域大都护', '安无常', '安红砂', '石破风'] },
      ],
    },
    '武林门派与世家': {
      group: 'character',
      keys: ['武林人物', '七大派人物', '世家子弟'],
      subBlocks: [
        { name: '太玄观', keys: ['张道玄', '太玄观弟子', '燕羽', '柳霜', '顾青锋'] },
        { name: '天剑阁', keys: ['裴南屏', '天剑阁弟子', '厉寒江', '苏问雪', '陆涯'] },
        { name: '天衍宗', keys: ['姬望舒', '天衍宗弟子', '晏孤鸿', '计隐', '楚星河', '墨百括'] },
        { name: '丐帮', keys: ['乔镇岳', '丐帮弟子', '鲁苍波', '庞开山', '严三娘', '齐小六'] },
        { name: '大慈恩寺', keys: ['释空见', '大慈恩寺弟子', '释渡厄', '释觉慧'] },
        { name: '醉花阴', keys: ['沈清昼', '醉花阴弟子', '荆红袖', '温婉', '薛画扇', '梅弄影'] },
        { name: '青溪门', keys: ['水月先生', '青溪门弟子', '贺枯荣', '莫留行', '曲南星'] },
        { name: '五仙教', keys: ['蚩罗', '五仙教弟子', '百里巫支'] },
        { name: '明教', keys: ['赫连城', '明教弟子', '雷震山', '拓跋野', '阴无咎', '夜伽罗'] },
        { name: '白莲教', keys: ['唐慈音', '白莲教弟子'] },
        { name: '四大世家', keys: ['清河崔氏子弟', '河东裴氏子弟', '琅琊王氏子弟', '陈郡谢氏子弟', '崔婉仪', '裴元绍', '裴铮', '裴缜', '王道渊', '崔华旒', '王伯安', '王初霁', '谢灵枢', '谢洵', '谢熙光'] },
        { name: '二流势力', keys: ['关中旧族子弟', '陇西李氏子弟', '龙门镖局子弟', '韦中流', '杜慎思', '薛摧阵', '柳穿鱼', '李朔风', '李烽燧', '李绛珠', '霍饮冰', '左纵辔', '狄金鳞'] },
        { name: '三流势力', keys: ['朱邪李氏子弟', '冥血圣教子弟', '李克悲', '李青霓'] },
      ],
    },
    '散修与无阵营角色': {
      group: 'character',
      keys: ['散修', '无阵营角色', '游侠', '游方散人'],
      subBlocks: [],
    },
    '岭南道与海外势力': {
      group: 'character',
      keys: ['海外势力', '外国角色', '东瀛角色', '高丽角色', '吐蕃角色', '英吉利角色', '南洋角色', '波斯角色'],
      subBlocks: [
        { name: '万国商会与岭南冼氏', keys: ['金若水', '万国商会', '冼知机', '冼清商', '冼云帆'] },
        { name: '东瀛', keys: ['东瀛武士', '东瀛忍者', '九鬼红叶', '千叶凛', '宫本武', '德川宗严', '望月千代', '柳生雪姬', '源静子', '藤原香子', '汪直'] },
        { name: '高丽', keys: ['高丽武人', '宋智恩', '尹素姬', '崔真英', '朴贞熙', '李成桂', '柳东龙', '金善雅'] },
        { name: '吐蕃', keys: ['吐蕃武士', '吐蕃僧人', '卓玛', '央金', '尼玛', '拉珍', '格桑', '桑结', '梅朵', '班丹', '白玛', '达瓦'] },
        { name: '英吉利', keys: ['英吉利骑士', '亚瑟', '伊丽莎白', '夏洛特', '梅林', '海伦', '爱丽丝', '玛丽', '维多利亚', '莎雅'] },
        { name: '南洋与海盗', keys: ['南洋海盗', '沈海兰', '李明月', '李清愁', '夜鸢', '红姑', '阿缇', '巴图'] },
        { name: '波斯', keys: ['波斯流亡者', '拜火教', '巴赫拉姆', '希林', '法蒂玛', '玛利亚姆', '莱拉', '萨拉', '阿尔达希尔', '阿米娜'] },
      ],
    },
  };

  const newEntries = {};
  let subUidCounter = nextUid();

  // Build summary entry (replaces original giant entry)
  const factionSummaries = [];
  for (const [factionName, config] of Object.entries(factionMap)) {
    const subUids = [];
    for (const block of config.subBlocks) {
      subUidCounter++;
      const uid = String(subUidCounter);
      subUids.push(uid);

      // Find the raw text for this sub-block from the original content
      const blockPattern = new RegExp(`(${escapeRegex(block.name)}:)[\\s\\S]*?(?=\\n  (?:${config.subBlocks.map(b => escapeRegex(b.name)).join('|')})|\\n  (?:${Object.keys(factionMap).map(escapeRegex).join('|')})|\\n<\\/角色速览|$)`, 'm');
      let blockContent = '';
      const blockMatch = content.match(blockPattern);
      if (blockMatch) {
        // Grab up to the next section
        const startIdx = blockMatch.index;
        const remaining = content.substring(startIdx);
        const lines = remaining.split('\n');
        const sectionLines = [];
        let started = false;
        for (const line of lines) {
          if (line.includes(block.name + ':')) { started = true; sectionLines.push(line); continue; }
          if (started) {
            // Stop at next section header (indented name:)
            if (/^  \S.*?:$/.test(line) && !line.includes('-')) break;
            // Stop at end marker
            if (line.includes('</角色速览')) break;
            sectionLines.push(line);
          }
        }
        blockContent = sectionLines.join('\n').trim();
      }

      newEntries[uid] = {
        uid: parseInt(uid),
        displayIndex: parseInt(uid),
        comment: `角色_${block.name}`,
        disable: false,
        constant: false,
        selective: true,
        key: block.keys,
        selectiveLogic: 0,
        keysecondary: [],
        scanDepth: null,
        vectorized: false,
        position: 0,
        role: null,
        depth: 4,
        order: baseOrder,
        content: `【角色速览 · ${block.name}】\n${blockContent}\n\n关联条目：详见【角色速览】获取完整名单`,
        useProbability: true,
        probability: 100,
        excludeRecursion: true,
        preventRecursion: true,
        delayUntilRecursion: false,
        sticky: null,
        cooldown: 3,
        delay: null,
        addMemo: true,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        group: 'character',
        groupOverride: false,
        groupWeight: 100,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: false,
        automationId: '',
        ignoreBudget: false,
        outletName: '',
        triggers: [],
        characterFilter: { isExclude: false, names: [], tags: [] },
      };
    }
    factionSummaries.push(`  ${factionName}: 共 ${subUids.length} 个子条目 (uid: ${subUids.join(', ')})`);
  }

  // Replace uid=53 with a lightweight index
  const summaryContent = `【角色速览 · 总索引】
名称保护与调用铁律 (DM核心指令):
  说明: 以下名单中列出的所有角色，均为本世界观已有详细人设的关键角色。
  铁律:
    规则一: 仅能在符合其所在势力、行事动机与境界规则的合理剧情下出场。
    规则二: 绝对禁止将名单中的人名用于随机生成的龙套、NPC或背景路人。
    规则三: 绝对禁止擅自改动角色的性别、境界、所属势力与核心身份。
    规则四: 剧情需要创建全新NPC时，必须生成与本名单存在明显差异的新名字。
    规则五: 若角色名在名单中，须严格遵循已有设定调用；若不确定其设定，使用通用称呼代替。
  当前收录统计: 181 人（涵盖其本名、称号、表字与化名）

角色名单已按势力拆分为独立子条目，触发对应势力的关键词即可查看：
${factionSummaries.join('\n')}

关联条目：触发具体势力名或角色名查看详细名单。`;

  entries['53'] = {
    ...entry,
    constant: false,
    selective: true,
    key: ['角色速览', '角色总览', '人物名单', 'NPC名单', '关键角色', '登场角色', '全部角色'],
    content: summaryContent,
    group: 'character',
    cooldown: 5,
  };

  // Add new entries
  for (const [uid, newEntry] of Object.entries(newEntries)) {
    entries[uid] = newEntry;
  }

  console.log(`  Split 角色速览: created ${Object.keys(newEntries).length} sub-entries, replaced original with index`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// STEP 2: Convert constant entries to selective (keep 5 core rules)
// ============================================================
function convertConstants() {
  const keepConstant = new Set([
    '19',    // 世界运转与角色行为逻辑 (DM核心法则)
    '688456', // 变量更新规则
    '794268', // 变量输出格式
    '794451', // 前端UI交互规则
    '238',    // 进程与节庆触发系统
  ]);

  const convertToSelective = {
    '3': { comment: '天下十三州地理简述', addKeys: ['十三州', '地理概况', '疆域概览'] },
    '14': { comment: '大周江湖势力概括', addKeys: ['势力格局', '门派排行', '势力总览'] },
    '18': { comment: '大周武学系统总览', addKeys: ['武学体系', '武功分类', '武学境界'] },
    '237': { comment: '大周节庆盛会录', addKeys: ['节庆', '盛会', '节日活动', '年度盛事'] },
    // Small system entries — should be selective, not constant (they already have good keys)
    '794359': { comment: '设定_高原反应', addKeys: [] },
    '794360': { comment: '设定_吐蕃阶层壁垒', addKeys: [] },
    '794381': { comment: '机制_海战接舷', addKeys: [] },
    '794382': { comment: '机制_季风航行', addKeys: [] },
    '794383': { comment: '机制_深水压制', addKeys: [] },
    '794384': { comment: '机制_火器走私', addKeys: [] },
  };

  let converted = 0;
  for (const [uid, config] of Object.entries(convertToSelective)) {
    if (entries[uid] && entries[uid].constant) {
      entries[uid].constant = false;
      entries[uid].selective = true;
      // Add broader trigger keys
      if (config.addKeys) {
        const existingKeys = new Set(entries[uid].key);
        for (const k of config.addKeys) {
          if (!existingKeys.has(k)) {
            entries[uid].key.push(k);
          }
        }
      }
      converted++;
      console.log(`  Converted uid=${uid} (${config.comment}) from constant to selective (+${config.addKeys?.length || 0} keys)`);
    }
  }

  // Verify the kept constants
  for (const uid of keepConstant) {
    if (entries[uid] && !entries[uid].constant) {
      entries[uid].constant = true;
      console.log(`  Restored constant=true for uid=${uid}`);
    }
  }

  console.log(`  Converted ${converted} constant entries to selective, kept ${keepConstant.size} as constant`);
}

// ============================================================
// STEP 3: Fix duplicate keywords
// ============================================================
function fixDuplicateKeywords() {
  // Build keyword -> entry map
  const keyMap = new Map(); // key -> [uid, ...]
  for (const [uid, entry] of Object.entries(entries)) {
    if (entry.key) {
      for (const k of entry.key) {
        if (!keyMap.has(k)) keyMap.set(k, []);
        keyMap.get(k).push(uid);
      }
    }
  }

  // Find duplicates
  const duplicates = [];
  for (const [key, uids] of keyMap) {
    if (uids.length > 1) duplicates.push({ key, uids });
  }

  // Resolution rules: for each duplicate, decide which entry keeps the key
  // Strategy: detailed/specific entries keep specific keywords; overview entries use broader terms
  const resolutionRules = {
    // Geography overlaps: overview entries should use broader terms
    '平康坊': { keep: '1', remove: ['27'] },  // 京畿 keeps it, 醉花阴 removes
    '长安': { keep: '2', remove: ['48'] },     // 关中 keeps it
    '终南山': { keep: '2', remove: ['23'] },    // 关中 keeps it (太玄观 has its own keys)
    '赶路': { keep: '3', remove: ['190'] },     // 十三州概述 keeps it, 出行指南 removes
    '西域': { keep: '4', remove: ['794301'] },  // 地区_西域 keeps it
    '凉州': { keep: '5', remove: ['50'] },
    '河朔': { keep: '6', remove: ['47'] },
    '晋阳': { keep: '6', remove: ['47'] },
    '闻喜': { keep: '6', remove: ['35'] },
    '雁门关': { keep: '6', remove: ['193'] },
    '幽州': { keep: '7', remove: ['52'] },
    '泰山': { keep: '7', remove: ['25'] },
    '清河': { keep: '7', remove: ['36'] },
    '琅琊': { keep: '7', remove: ['33'] },
    '受降城': { keep: '8', remove: ['46'] },
    '中原': { keep: '9', remove: ['189'] },
    '开封': { keep: '9', remove: ['189'] },
    '襄阳': { keep: '11', remove: ['49'] },
    '万岭箐': { keep: '12', remove: ['29'] },
    '大理城': { keep: '13', remove: ['51'] },
    // Faction overlaps
    '皇帝': { keep: '15', remove: ['135'] },
    '大理寺': { keep: '15', remove: ['43'] },  // 朝廷概括 keeps, 大理寺详情 has its own keys
    '控鹤府': { keep: '15', remove: ['583516'] },
    '凤阁': { keep: '15', remove: ['42'] },
    // Martial arts overlaps
    '轻功': { keep: '18', remove: ['794376'] },
    // Rankings overlaps
    '太阿录': { keep: '22', remove: ['185'] },
    '惊蛰榜': { keep: '22', remove: ['186'] },
  };

  let fixedCount = 0;
  for (const [key, rule] of Object.entries(resolutionRules)) {
    for (const removeUid of rule.remove) {
      if (entries[removeUid]) {
        const idx = entries[removeUid].key.indexOf(key);
        if (idx >= 0) {
          entries[removeUid].key.splice(idx, 1);
          fixedCount++;
        }
      }
    }
  }

  // For remaining duplicates not in resolution rules, apply generic strategy:
  // If one entry is constant and the other is selective, remove from the selective one
  // If both are selective, keep on the one with more specific comment name
  for (const { key, uids } of duplicates) {
    if (resolutionRules[key]) continue; // already handled

    const involvedEntries = uids.map(uid => entries[uid]).filter(Boolean);
    if (involvedEntries.length <= 1) continue;

    // If one is constant and others selective, remove from selective
    const constantEntry = involvedEntries.find(e => e.constant);
    if (constantEntry) {
      for (const e of involvedEntries) {
        if (e !== constantEntry) {
          const idx = e.key.indexOf(key);
          if (idx >= 0) { e.key.splice(idx, 1); fixedCount++; }
        }
      }
    }
  }

  console.log(`  Fixed ${fixedCount} duplicate keyword occurrences across ${duplicates.length} duplicate keys`);
}

// ============================================================
// STEP 4: Add group assignments to all entries
// ============================================================
function assignGroups() {
  const commentToGroup = {
    '地区': 'geography',
    '江湖秘辛': 'event',
    '前尘旧事': 'event',
    '前尘往事': 'event',
    '事件': 'event',
    '传闻': 'event',
    '势力': 'faction',
    '角色': 'character',
    '武学': 'martial-arts',
    '功法': 'martial-arts',
    '物品': 'item',
    '特产': 'item',
    '设定': 'system',
    '机制': 'mechanic',
    '风俗': 'culture',
    '文化': 'culture',
    '大周': 'world-overview',
    '历史': 'history',
    '船只': 'item',
    '地点': 'geography',
  };

  // Prefix-based group assignment for entries with formatted comments
  const prefixToGroup = {
    '太玄观': 'faction',
    '天剑阁': 'faction',
    '天衍宗': 'faction',
    '丐帮': 'faction',
    '醉花阴': 'faction',
    '明教': 'faction',
    '大慈恩寺': 'faction',
    '青溪门': 'faction',
    '大理寺': 'faction',
    '凤阁': 'faction',
    '乾国公府': 'faction',
    '琅琊王氏': 'faction',
    '河东裴氏': 'faction',
    '清河崔氏': 'faction',
    '陈郡谢氏': 'faction',
    '关中旧姓': 'faction',
    '五仙教': 'faction',
    '秦王府': 'faction',
    '晋王府': 'faction',
    '梁王府': 'faction',
    '楚王府': 'faction',
    '控鹤府': 'faction',
    '黔国公府': 'faction',
    '凉国公府': 'faction',
    '陇西李氏': 'faction',
    '龙门镖局': 'faction',
    '安北都护府': 'faction',
    '岭南冼氏': 'faction',
    '白莲教': 'faction',
    '京畿大都督府': 'faction',
    '西域都护府': 'faction',
    '草原游侠': 'character',
    '东海散修': 'character',
    '游方散人': 'character',
    '冥血圣教': 'faction',
    '万国商会': 'faction',
    '岭南浪人': 'character',
    '波斯': 'foreign',
  };

  let assigned = 0;
  for (const [uid, entry] of Object.entries(entries)) {
    // Skip if already has a group
    if (entry.group && entry.group.trim()) continue;

    const comment = entry.comment || '';

    // Check prefix-based groups first
    for (const [prefix, group] of Object.entries(prefixToGroup)) {
      if (comment.startsWith(prefix)) {
        entry.group = group;
        assigned++;
        break;
      }
    }
    if (entry.group) continue;

    // Check category-based groups
    for (const [category, group] of Object.entries(commentToGroup)) {
      if (comment.startsWith(category)) {
        entry.group = group;
        assigned++;
        break;
      }
    }
    if (entry.group) continue;

    // System entries
    if (comment.startsWith('[mvu') || comment.startsWith('[sys]')) {
      entry.group = 'system';
      assigned++;
      continue;
    }

    // Character names (standalone)
    if (comment.includes('_') && !comment.startsWith('[')) {
      const parts = comment.split('_');
      if (parts.length === 2 && parts[1].length <= 4) {
        entry.group = 'character';
        assigned++;
        continue;
      }
    }

    // Default based on content patterns
    if (entry.content && entry.content.includes('武学')) {
      entry.group = 'martial-arts';
      assigned++;
    } else if (entry.content && entry.content.includes('境界')) {
      entry.group = 'system';
      assigned++;
    }
  }

  console.log(`  Assigned groups to ${assigned} entries`);
}

// ============================================================
// STEP 5: Add cooldown to frequently-triggered entries
// ============================================================
function addCooldowns() {
  // Add cooldown to entries that are likely to trigger frequently
  const entriesWithCooldown = [];

  for (const [uid, entry] of Object.entries(entries)) {
    if (entry.constant) continue; // constant entries always inject
    if (entry.cooldown !== null && entry.cooldown !== undefined) continue; // already has cooldown

    const keyCount = (entry.key || []).length;
    const contentLen = (entry.content || '').length;

    // Geography entries: 3-turn cooldown (player stays in one place for a while)
    if (entry.group === 'geography') {
      entry.cooldown = 3;
      entriesWithCooldown.push(uid);
    }
    // Large entries (> 1000 chars): 5-turn cooldown
    else if (contentLen > 1000) {
      entry.cooldown = 5;
      entriesWithCooldown.push(uid);
    }
    // Short common-keyword entries: 2-turn cooldown
    else if (keyCount <= 2 && contentLen < 300) {
      entry.cooldown = 2;
      entriesWithCooldown.push(uid);
    }
  }

  console.log(`  Added cooldown to ${entriesWithCooldown.length} entries`);
}

// ============================================================
// EXECUTE
// ============================================================
console.log('=== 大周日暮录 世界书优化 ===\n');

console.log('Step 1: Splitting giant entries...');
splitCharacterRoster();

console.log('\nStep 2: Converting constant entries to selective...');
convertConstants();

console.log('\nStep 3: Fixing duplicate keywords...');
fixDuplicateKeywords();

console.log('\nStep 4: Assigning group categories...');
assignGroups();

console.log('\nStep 5: Adding cooldown settings...');
addCooldowns();

// ============================================================
// STEP 6: Post-processing fixes
// ============================================================
console.log('\nStep 6: Post-processing fixes...');

// Fix uid=19 group (should be system, not martial-arts)
if (entries['19']) {
  entries['19'].group = 'system';
  console.log('  Fixed uid=19 group: martial-arts -> system');
}

// Assign groups to remaining ungrouped entries
for (const [uid, entry] of Object.entries(entries)) {
  if (entry.group && entry.group.trim()) continue;
  const comment = entry.comment || '';

  if (comment.includes('武学功法') || comment.includes('武功')) {
    entry.group = 'martial-arts';
  } else if (comment.includes('太阿录') || comment.includes('惊蛰榜') || comment.includes('群芳谱') || comment.includes('榜单')) {
    entry.group = 'rankings';
  } else if (comment.includes('进程') || comment.includes('节庆') || comment.includes('触发')) {
    entry.group = 'system';
  } else if (comment.includes('变量')) {
    entry.group = 'system';
  } else if (comment.includes('大周') && (comment.includes('时间') || comment.includes('时辰') || comment.includes('年龄'))) {
    entry.group = 'system';
  } else if (comment.includes('出行') || comment.includes('指南')) {
    entry.group = 'world-overview';
  } else if (comment.includes('门派起源')) {
    entry.group = 'history';
  }
}

// Count remaining ungrouped
const stillUngrouped = Object.entries(entries).filter(([, e]) => !e.group || !e.group.trim());
if (stillUngrouped.length > 0) {
  console.log(`  Still ungrouped: ${stillUngrouped.length}`);
  for (const [uid, e] of stillUngrouped) {
    console.log(`    uid=${uid} comment=${e.comment}`);
  }
}

// ---- Write output ----
console.log('\nWriting optimized lorebook...');
fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');

// ---- Summary ----
const finalEntries = Object.entries(data.entries);
const constCount = finalEntries.filter(([, e]) => e.constant).length;
const withGroup = finalEntries.filter(([, e]) => e.group && e.group.trim()).length;
const withCooldown = finalEntries.filter(([, e]) => e.cooldown !== null && e.cooldown !== undefined).length;
const maxLen = Math.max(...finalEntries.map(([, e]) => (e.content || '').length));
const totalChars = finalEntries.reduce((sum, [, e]) => sum + (e.content || '').length, 0);

// Count duplicate keys
const keyMap2 = new Map();
for (const [, e] of finalEntries) {
  if (e.key) {
    for (const k of e.key) {
      if (!keyMap2.has(k)) keyMap2.set(k, []);
      keyMap2.get(k).push(e.uid);
    }
  }
}
const dupKeys = [...keyMap2.entries()].filter(([, uids]) => uids.length > 1);

console.log('\n=== 优化结果 ===');
console.log(`  总条目数: ${finalEntries.length} (原 419, +${finalEntries.length - 419})`);
console.log(`  Constant 条目: ${constCount} (原 14, 减少 ${14 - constCount})`);
console.log(`  已分组条目: ${withGroup}/${finalEntries.length} (${(withGroup / finalEntries.length * 100).toFixed(1)}%)`);
console.log(`  已设冷却条目: ${withCooldown}`);
console.log(`  重复关键词: ${dupKeys.length} (原 111, 减少 ${111 - dupKeys.length})`);
console.log(`  最大条目大小: ${maxLen} chars`);
console.log(`  总内容量: ${(totalChars / 1024).toFixed(1)} KB`);
console.log('\nDone!');
