import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

interface CharInfo { name: string; info: string; }
interface LocData {
  lat: number; lng: number; color: string; size: number; name: string;
  title: string; desc: string; chars: CharInfo[]; factionNote?: string;
}

const LOCATIONS: LocData[] = [
  // ============ 京畿 ============
  { lat: 34.62, lng: 112.45, color: '#ff4444', size: 16, name: '洛阳', title: '京畿 · 洛阳城',
    desc: '天下之中，大周皇都。烈火烹油的盛世幻梦。宵禁名存实亡，平康坊灯火映照半城，酒楼画舫彻夜营业。',
    chars: [
      { name: '武极（承平帝）', info: '男·82岁·入微境 | 绝世·天纲九重诀·裂鼎定国拳 | 年轻时英武果决，后期沉迷长生丹药，年老昏聩' },
      { name: '武悼（镇国公）', info: '男·75岁·天人境·太阿录榜首 | 绝世·关山玉龙诀·百龙辟易枪 | 大周军威具象，国之柱石' },
      { name: '武明空（长公主）', info: '女·65岁·半步天人·凤阁大学士 | 绝世·太玄长明功 | 权力生物，掌握实际批红权' },
      { name: '沈清昼（醉花阴宗主）', info: '女·66岁·天人境·群芳谱第一 | 绝世·太真明月功·二十四番花信剑 | 广陵沈氏遗孤' },
    ],
    factionNote: '皇权·凤阁·控鹤府·大理寺·醉花阴 — 洛阳六方制衡。武悼不死，天下无人敢反。',
  },
  { lat: 34.75, lng: 112.48, color: '#44dd44', size: 8, name: '上清宫', title: '北邙山 · 上清宫',
    desc: '沈清颜出家之地。每年沈家忌日在太上老君像前长跪不起。',
    chars: [{ name: '沈清颜（前天后）', info: '女·64岁·半步天人·群芳谱第五 | 绝世·玉景化劫真经·二十四番花信剑 | 哀莫大于心死' }],
  },
  { lat: 34.70, lng: 112.55, color: '#44dd44', size: 8, name: '白马寺', title: '白马寺',
    desc: '大慈恩寺在洛阳的耳目。武玄贞常驻于此，白日抄经，夜深练武。',
    chars: [{ name: '武玄贞', info: '女·20岁·入微境·群芳谱第十八 | 绝世·玉景化劫真经·探花折枝手 | 隐忍克制，清冷孤傲' }],
  },

  // ============ 关中 ============
  { lat: 34.26, lng: 108.94, color: '#ff8800', size: 15, name: '长安', title: '关中 · 长安城',
    desc: '前唐旧都，丝路起点，胡汉同饮。秦王府坐镇关中，与凉国公、西域都护组成西北秘盟。',
    chars: [
      { name: '武承疆（秦王）', info: '男·65岁·宗师境 | 不传·太公阴符经·破阵霸王枪 | 沉稳内敛，每年足额上贡掩盖扩军' },
      { name: '武玄策（世子）', info: '男·28岁·绝顶境·渭水大营统领 | 十八岁隐姓走河西，治军严苛' },
      { name: '武红妆（郡主）', info: '女·25岁·入微境 | 绝密·破阵霸王枪(小成) | 十岁烧女戒跑进军营' },
    ],
    factionNote: '秦王府·朱邪李氏·龙门镖局 — 西北秘盟核心。图谋中原生变时出函谷关直取洛阳。',
  },
  { lat: 33.95, lng: 108.95, color: '#44dd44', size: 12, name: '终南山', title: '终南山 · 太玄观',
    desc: '道门正宗，上三门。五峰建制，底蕴深不可测。',
    chars: [
      { name: '张道玄（观主）', info: '男·156岁·天人境 | 绝世·先天一气诀·太始无极剑 | 六岁入观，百岁入天人，清静寡欲' },
      { name: '顾青锋', info: '男·26岁·入微境·神霄峰真传 | 过目不忘，精通唇语伪装' },
      { name: '宋皎', info: '女·22岁·入微境·群芳谱第四十 | 严谨刻板，潜在武痴。专属名锋：天枢' },
    ],
  },
  { lat: 34.48, lng: 110.09, color: '#44dd44', size: 12, name: '华山', title: '华山 · 天剑阁',
    desc: '天下第一剑派，上三门，杀伐第一。出剑只攻不守。',
    chars: [
      { name: '裴南屏（剑主）', info: '女·128岁·天人境·群芳谱第三 | 绝世·裁天剑心决·无我剑典 | 百年前拒斥联姻持剑杀出裴氏' },
      { name: '陆涯', info: '男·26岁·入微境·惊蛰榜第三 | 太行山猎户出身，天生神力' },
      { name: '叶惊秋', info: '女·21岁·入微境·惊蛰榜第五 | 嗜酒懂行，贪吃剑痴。专属名锋：掠影' },
    ],
  },

  // ============ 中原 ============
  { lat: 34.80, lng: 114.35, color: '#ff8800', size: 15, name: '开封', title: '中原 · 开封城',
    desc: '九州腹地，旱魃千里。官道野狗啃食无名尸骸，市集易子换粮。梁王以江南牛乳喂斗犬。',
    chars: [
      { name: '武延秀（梁王）', info: '男·55岁·绝顶境(虚浮) | 绝密·大欢喜极乐功 | 穷奢极欲，截留修堤专款建纳凉楼' },
      { name: '乔镇岳（丐帮帮主）', info: '男·78岁·天人境·定海神针 | 绝世·擒龙诀·降龙十八掌 | 天下刚猛第一掌' },
      { name: '唐慈音（无生老母）', info: '女·68岁·半步天人·群芳谱第四 | 绝世·真空无生经 | 极致利己，草菅人命' },
    ],
    factionNote: '梁王府·丐帮总舵·白莲教总坛 — 三方角力。旱灾与黄河决堤危机叠加。',
  },

  // ============ 河朔 ============
  { lat: 37.87, lng: 112.55, color: '#ff8800', size: 15, name: '晋阳', title: '河朔 · 晋阳城',
    desc: '北方屏障，全城巨石包砖。囤积十年粮草军械，街道布局如兵营。',
    chars: [
      { name: '武骧（晋王）', info: '男·62岁·宗师境 | 不传·问鼎龙枪(圆满) | 跋扈骄横，截留河朔盐铁税' },
      { name: '武青鸾', info: '女·24岁·入微境·晋王庶女 | 心思玲珑，暗掌晋商网络，筹谋退路' },
    ],
    factionNote: '晋王府·安北都护府 — "太行阴契"约定洛阳生变时南北夹击。',
  },

  // ============ 燕齐 ============
  { lat: 39.91, lng: 116.40, color: '#ff8800', size: 13, name: '幽州', title: '燕齐 · 幽州城',
    desc: '御北重镇，海陆贸易繁盛。乾国公府坐镇，清河崔氏与琅琊王氏龙盘虎踞。',
    chars: [
      { name: '袭天远（乾国公）', info: '男·60岁·宗师境 | 藏锋守拙' },
      { name: '袭长缨（世子）', info: '男·25岁·绝顶境 | 女扮男装，真龙之资' },
    ],
    factionNote: '乾国公府·清河崔氏·琅琊王氏·天衍宗 — 燕齐四柱。',
  },
  { lat: 36.25, lng: 117.10, color: '#44dd44', size: 10, name: '泰山', title: '泰山 · 天衍宗',
    desc: '上三门，术数卜卦，国师坐镇。',
    chars: [{ name: '姬望舒（宗主/国师）', info: '男·145岁·天人境 | 算尽天机。常遣使问长生，皆以闭关谢绝' }],
  },

  // ============ 江淮 ============
  { lat: 32.06, lng: 118.80, color: '#44aaff', size: 13, name: '金陵', title: '江淮 · 金陵城',
    desc: '财赋重地，纸醉金迷，烟雨江南。陈郡谢氏与江南总督府共治。',
    chars: [
      { name: '谢灵枢（谢氏家主）', info: '男·58岁·宗师境 | 天下财富半出谢氏' },
      { name: '谢熙光', info: '女·23岁·入微境·群芳谱第十 | 江南第一才女' },
    ],
    factionNote: '陈郡谢氏·江南总督府 — 江南双壁，掌握天下水路商道。',
  },

  // ============ 荆襄 ============
  { lat: 32.04, lng: 112.14, color: '#ff8800', size: 13, name: '襄阳', title: '荆襄 · 襄阳城',
    desc: '铁打的襄阳，楚王府坐镇。汉水与长江交汇，天下粮仓。',
    chars: [
      { name: '武安邦（楚王）', info: '男·68岁·宗师境 | 老谋深算' },
      { name: '武惊澜（世子）', info: '男·32岁·绝顶境·水师统领' },
    ],
  },

  // ============ 巴蜀 ============
  { lat: 30.57, lng: 104.07, color: '#44aaff', size: 13, name: '成都', title: '巴蜀 · 成都城',
    desc: '天府之国，偏安安逸，险阻封闭。民间祭拜武侯远超当朝皇帝。',
    chars: [],
  },
  { lat: 28.50, lng: 104.50, color: '#44dd44', size: 10, name: '万岭箐', title: '蜀南 · 青溪门',
    desc: '医武合一，一命一价，下四门。',
    chars: [
      { name: '水月先生', info: '女·265岁·天人境·群芳谱第二 | 创派祖师，医术通天' },
      { name: '曲南星', info: '女·22岁·入微境·小医仙 | 悬壶济世' },
    ],
  },

  // ============ 雍凉 ============
  { lat: 37.93, lng: 102.64, color: '#ff8800', size: 13, name: '凉州', title: '雍凉 · 凉州城',
    desc: '丝路咽喉，全民皆兵。凉国公府屯重兵把守河西走廊。',
    chars: [
      { name: '蓝岳（凉国公）', info: '男·62岁·宗师境 | 伪装绝顶境巅峰，实际为西北秘盟重要一环' },
      { name: '蓝听雪', info: '女·24岁·入微境·互市走马司暗案' },
    ],
    factionNote: '凉国公府·关中旧族·陇西李氏 — 西北秘盟西域侧翼。',
  },

  // ============ 西域 ============
  { lat: 42.95, lng: 89.19, color: '#888', size: 13, name: '高昌', title: '西域 · 高昌城',
    desc: '西域都护府驻地，形同独立王国。安镇疆拥兵自重。',
    chars: [
      { name: '安镇疆（大都护）', info: '男·62岁·半步天人 | 割据一方，不奉洛阳号令' },
      { name: '安红砂', info: '女·26岁·入微境巅峰·惊蛰榜第二' },
    ],
  },
  { lat: 43.50, lng: 85.00, color: '#cc6666', size: 10, name: '天山', title: '天山 · 明教',
    desc: '拜火教总坛，圣火不灭，教主空悬多年。',
    chars: [
      { name: '赫连城（光明左使）', info: '男·65岁·宗师境 | 暂代教主之位' },
      { name: '夜伽罗（紫月龙王）', info: '女·38岁·绝顶境 | 波斯后裔，精通火器' },
    ],
  },

  // ============ 草原 ============
  { lat: 42.00, lng: 112.00, color: '#888', size: 13, name: '受降城', title: '草原 · 受降城',
    desc: '安北都护府驻地，漠南军事堡垒。城门外矗立阿史那部头颅京观。',
    chars: [
      { name: '贺兰万钧（大都护）', info: '男·58岁·半步天人 | 图谋南下，以夷制夷' },
      { name: '完颜破', info: '男·45岁·宗师境·军法司统领 | 太行阴契关键人物' },
    ],
  },

  // ============ 苗疆 ============
  { lat: 25.60, lng: 100.23, color: '#44aaff', size: 10, name: '大理', title: '苗疆 · 大理城',
    desc: '改土归流，土司割据，原始巫蛊。',
    chars: [
      { name: '沐镇山（黔国公）', info: '男·65岁·宗师境' },
      { name: '蚩罗（五仙教主）', info: '男·105岁·天人境·闭关神木殿' },
    ],
  },

  // ============ 岭南 ============
  { lat: 23.13, lng: 113.26, color: '#44aaff', size: 10, name: '广州', title: '岭南 · 广州城',
    desc: '万国交汇，远洋海贸枢纽。流放贬谪之所。',
    chars: [
      { name: '金若水', info: '女·28岁·绝顶境·万国商会总会长' },
      { name: '冼知机', info: '男·63岁·绝顶境·冼氏家主' },
    ],
  },

  // ============ 外国区域 ============
  { lat: 35.5, lng: 137, color: '#e88', size: 15, name: '东瀛', title: '东瀛 · 扶桑诸岛',
    desc: '倭国，遣唐使往来频繁。剑道与忍术独树一帜。',
    chars: [
      { name: '柳生宗严', info: '剑圣·无刀取奥义 | 德川幕府剑术指南' },
      { name: '服部半藏', info: '忍军头领·影缚术 | 伊贺忍军统帅' },
    ],
    factionNote: '德川幕府·伊贺忍军·出云神社 — 三足鼎立。',
  },
  { lat: 37.5, lng: 127, color: '#e88', size: 15, name: '高丽', title: '高丽 · 海东之国',
    desc: '朝鲜半岛，儒学立国，武臣跋扈。',
    chars: [
      { name: '崔忠献', info: '武臣首领·花郎道 | 架空王权' },
      { name: '金允侯', info: '义军将领·弓道·海东剑法 | 抗击蒙古前锋' },
    ],
    factionNote: '高丽王室·武臣政权·花郎道场 — 王权旁落。',
  },
  { lat: 30, lng: 91, color: '#e88', size: 17, name: '吐蕃', title: '吐蕃 · 雪域高原',
    desc: '赞普王庭，密宗佛法昌盛，高原铁骑威震西域。',
    chars: [
      { name: '松赞干布', info: '赞普·大日如来印 | 统一吐蕃诸部' },
      { name: '莲花生', info: '密宗上师·金刚伏魔杵 | 桑耶寺主持' },
      { name: '论钦陵', info: '大论(宰相)·雪域九转 | 吐蕃铁骑统帅' },
    ],
    factionNote: '赞普王庭·桑耶寺·苯教祭坛 — 佛苯之争暗流涌动。',
  },
  { lat: 5, lng: 118, color: '#e88', size: 15, name: '南洋', title: '南洋 · 万岛之域',
    desc: '三佛齐·满者伯夷，香料群岛，海盗横行。',
    chars: [
      { name: '郑和义', info: '海商魁首·分海刀 | 掌控香料航道' },
      { name: '陈祖义', info: '海盗王·潜渊诀·鲨咬拳 | 巨蛟帮总瓢把子' },
    ],
    factionNote: '三佛齐王朝·巨蛟帮·香料商会 — 海上三国杀。',
  },
  { lat: 52, lng: -1, color: '#e88', size: 15, name: '英吉利', title: '英吉利 · 西洋列岛',
    desc: '骑士王国，东印度公司崛起，火器初兴。',
    chars: [
      { name: '亨利八世', info: '国王·骑士剑术 | 与教廷决裂，建立国教' },
      { name: '德雷克', info: '海盗提督·铳术·炼金术 | 皇家海军传奇' },
    ],
    factionNote: '英王王室·东印度公司·圣殿骑士团 — 新旧势力交替。',
  },
];

// 势力关系线
const FACTION_LINES: { from: [number, number]; to: [number, number]; color: string; dash: string; label: string }[] = [
  { from: [34.62, 112.45], to: [34.26, 108.94], color: '#8b6914', dash: '6,4', label: '皇权vs西北秘盟' },
  { from: [34.26, 108.94], to: [37.93, 102.64], color: '#8b6914', dash: '6,4', label: '西北秘盟' },
  { from: [37.93, 102.64], to: [42.95, 89.19], color: '#8b6914', dash: '6,4', label: '西北秘盟西域侧翼' },
  { from: [37.87, 112.55], to: [42.00, 112.00], color: '#6b3a2a', dash: '4,4', label: '太行阴契' },
  { from: [32.06, 118.80], to: [34.62, 112.45], color: '#4a6a3a', dash: '3,5', label: '谢氏商道(漕运)' },
  { from: [32.06, 118.80], to: [23.13, 113.26], color: '#4a6a3a', dash: '3,5', label: '沿海商道' },
];

// 路线
const ROUTES: { path: [number, number][]; color: string; dash: string; weight: number; label: string }[] = [
  { path: [[34.62, 112.45], [34.80, 114.35], [32.04, 112.14], [32.06, 118.80], [24.87, 118.68]], color: '#5a7a4a', dash: '8,6', weight: 1.5, label: '大运河-长江漕运' },
  { path: [[34.26, 108.94], [37.93, 102.64], [40.14, 94.66], [42.95, 89.19], [36, 70]], color: '#8a7a4a', dash: '10,6', weight: 1.5, label: '丝绸之路' },
  { path: [[34.62, 112.45], [34.26, 108.94], [37.93, 102.64]], color: '#8a7a4a', dash: '10,6', weight: 1.5, label: '丝路东段' },
  { path: [[32.06, 118.80], [37.80, 120.75], [39.91, 116.40]], color: '#4a6a6a', dash: '5,7', weight: 1, label: '沿海航线' },
  { path: [[23.13, 113.26], [24.87, 118.68], [32.06, 118.80]], color: '#4a6a6a', dash: '5,7', weight: 1, label: '南洋航线' },
  { path: [[34.62, 112.45], [37.87, 112.55], [39.91, 116.40]], color: '#6a5a3a', dash: '6,5', weight: 1.2, label: '北上官道' },
  { path: [[34.26, 108.94], [33.95, 108.95], [30.57, 104.07], [28.50, 104.50]], color: '#6a5a3a', dash: '6,5', weight: 1.2, label: '蜀道' },
];

export function MapModal({ isOpen, onClose, onSend }: Props) {
  const [selectedLoc, setSelectedLoc] = useState<LocData | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const map = L.map('dz-leaflet-map', {
      center: [34.5, 108], zoom: 5, minZoom: 3, maxZoom: 10,
      zoomControl: true, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    const tp = map.getPane('tilePane');
    if (tp) tp.style.filter = 'brightness(0.4) saturate(0.25) sepia(0.5) contrast(1.1)';

    // Routes
    ROUTES.forEach(r => {
      L.polyline(r.path, { color: r.color, weight: r.weight, opacity: 0.5, dashArray: r.dash })
        .addTo(map).bindTooltip(r.label, { permanent: false, direction: 'center', className: '', offset: [0, 0], opacity: 0.8 });
    });

    // Faction lines
    FACTION_LINES.forEach(f => {
      L.polyline([f.from, f.to], { color: f.color, weight: 1.5, opacity: 0.5, dashArray: f.dash })
        .addTo(map);
    });

    // Markers
    const mk = (color: string, size: number) => L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 10px ${color}90;"></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });

    LOCATIONS.forEach(p => {
      L.marker([p.lat, p.lng], { icon: mk(p.color, p.size) })
        .addTo(map)
        .on('click', () => setSelectedLoc(p));
    });

    // Region labels
    [
      [34.8, 112.5, '京 畿'], [34.2, 108.5, '关 中'], [35.0, 114.8, '中 原'],
      [38.5, 112.0, '河 朔'], [38.5, 118.0, '燕 齐'], [37.5, 102.0, '雍 凉'],
      [31.5, 118.0, '江 淮'], [31.0, 112.0, '荆 襄'], [30.0, 104.0, '巴 蜀'],
      [42.0, 90.0, '西 域'], [46.0, 108.0, '草 原'], [25.5, 101.0, '苗 疆'], [23.5, 113.0, '岭 南'],
    ].forEach(([lat, lng, text]) => {
      L.marker([lat as number, lng as number], {
        icon: L.divIcon({
          className: '', html: `<span style="font-family:'Noto Serif SC',serif;font-size:15px;font-weight:700;color:#c8a86c;text-shadow:2px 2px 8px rgba(0,0,0,0.95);letter-spacing:4px;white-space:nowrap;">${text}</span>`,
          iconSize: [120, 20], iconAnchor: [60, 10],
        }), interactive: false,
      }).addTo(map);
    });

    // Foreign labels
    [
      [52, 100, '北 狄'], [36, 70, '大 食'], [30, 78, '天 竺'],
      [20, 106, '交 趾'], [15, 115, '南 洋'], [42, 78, '西域诸邦'], [50, 116, '女 真'],
    ].forEach(([lat, lng, text]) => {
      L.marker([lat as number, lng as number], {
        icon: L.divIcon({
          className: '', html: `<span style="font-family:'Noto Serif SC',serif;font-size:13px;color:#7a6a50;text-shadow:1px 1px 6px rgba(0,0,0,0.9);letter-spacing:4px;">${text}</span>`,
          iconSize: [130, 20], iconAnchor: [65, 10],
        }), interactive: false,
      }).addTo(map);
    });

    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    setTimeout(() => map.invalidateSize(), 150);

    return () => { map.remove(); };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '96%', maxWidth: 1100, height: '86vh',
        background: '#1a1a1a', border: '1px solid var(--dz-gray-light)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8)', display: 'flex',
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        overflow: 'hidden',
      }}>
        {/* Map area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(40,30,15,0.95)', borderBottom: '2px solid #8b7355', flexShrink: 0 }}>
            <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 900, color: '#e8d5a3', letterSpacing: 8, margin: 0 }}>大周堪舆图</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a08c6a', cursor: 'pointer', fontSize: 22 }}>×</button>
          </div>
          <div id="dz-leaflet-map" style={{ flex: 1, background: '#2a2518' }} />
        </div>

        {/* Side panel */}
        {selectedLoc && (
          <div style={{
            width: 320, flexShrink: 0, background: 'rgba(20,16,12,0.97)', borderLeft: '1px solid #6b5b3e',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 18px 12px', borderBottom: '1px solid #3a3020' }}>
              <div>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 18, fontWeight: 700, color: '#f0e0b0', letterSpacing: 2, marginBottom: 4 }}>{selectedLoc.title}</div>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 11, color: '#8a7a5a' }}>{selectedLoc.desc.slice(0, 80)}...</div>
              </div>
              <button onClick={() => { onSend(`前往${selectedLoc.name}`); onClose(); }} style={{
                padding: '6px 14px', flexShrink: 0, marginLeft: 8,
                background: 'var(--dz-red)', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: "'Noto Serif SC',serif", fontSize: 12, fontWeight: 700,
                clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
              }}>前往</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
              {/* Characters */}
              {selectedLoc.chars.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 13, color: '#c8a86c', fontWeight: 700, letterSpacing: 1, marginBottom: 8, borderLeft: '2px solid #c8a86c', paddingLeft: 8 }}>人物</div>
                  {selectedLoc.chars.map((c, i) => (
                    <div key={i} style={{
                      padding: '8px 10px', marginBottom: 4,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(107,91,62,0.3)',
                      clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)',
                    }}>
                      <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 13, color: '#e8c878', fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 10, color: '#9a8a6a', lineHeight: 1.5 }}>{c.info}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Faction */}
              {selectedLoc.factionNote && (
                <div>
                  <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 13, color: '#c8a86c', fontWeight: 700, letterSpacing: 1, marginBottom: 6, borderLeft: '2px solid #c8a86c', paddingLeft: 8 }}>势力纠葛</div>
                  <div style={{
                    padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(107,91,62,0.3)',
                    clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                    fontFamily: "'Noto Serif SC',serif", fontSize: 11, color: '#a09070', lineHeight: 1.7,
                  }}>{selectedLoc.factionNote}</div>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedLoc(null)} style={{
              padding: '8px', borderTop: '1px solid #3a3020', background: 'none', border: 'none',
              color: '#8a7a5a', cursor: 'pointer', fontFamily: "'Noto Serif SC',serif", fontSize: 12,
            }}>收起详情</button>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 10,
          background: 'rgba(40,30,15,0.92)', border: '1px solid #6b5b3e', borderRadius: 4,
          padding: '6px 10px', fontFamily: "'Noto Serif SC',serif", fontSize: 10, lineHeight: 2, color: '#d4c5a0',
          maxWidth: 200, pointerEvents: selectedLoc ? 'none' : 'auto',
        }}>
          <div style={{ color: '#e8d5a3', fontWeight: 700, marginBottom: 2 }}>图 例</div>
          {[['#ff4444', '京畿·皇都'], ['#ff8800', '王府·国公府'], ['#44aaff', '州府重镇'], ['#44dd44', '正派·宗门'], ['#ddaa44', '世家族地'], ['#aa66cc', '关隘要塞'], ['#888', '边镇都护府'], ['#cc6666', '邪派·暗势力'], ['#e88', '外邦区域']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />{l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
