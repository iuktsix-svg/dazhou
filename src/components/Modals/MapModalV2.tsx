import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

export function MapModal({ isOpen, onClose, onSend }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const map = L.map('dz-leaflet-map', {
      center: [34.5, 108], zoom: 5, minZoom: 3, maxZoom: 10,
      zoomControl: true, attributionControl: false,
    });

    // No-label tiles — pure geography, no English text to break wuxia immersion
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    // Warm muted tone filter
    const tp = map.getPane('tilePane');
    if (tp) tp.style.filter = 'brightness(0.4) saturate(0.25) sepia(0.5) contrast(1.1)';

    // Marker factory
    const mk = (color: string, size = 10) => L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 10px ${color}90, 0 0 3px rgba(0,0,0,0.8);"></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });

    const popup = (title: string, desc: string, locName: string) => `
      <div style="font-family:'Noto Serif SC',serif;font-size:13px;line-height:1.7;color:#d4c5a0;padding:4px 0;">
        <div style="font-size:17px;font-weight:700;color:#f0e0b0;border-bottom:1px solid #5a4a30;padding-bottom:8px;margin-bottom:8px;letter-spacing:2px;">${title}</div>
        <div style="font-size:11px;color:#8a7a5a;margin-bottom:8px;">${desc}</div>
        <button onclick="window._dzGo && window._dzGo('${locName}')" style="width:100%;padding:8px;background:#c53030;color:#fff;border:none;cursor:pointer;font-family:'Noto Serif SC',serif;font-size:13px;font-weight:700;letter-spacing:1px;">前往此地</button>
      </div>`;

    // Foreign popup (no go button for overseas locations, just info)
    const foreignPopup = (title: string, desc: string, chars: string) => `
      <div style="font-family:'Noto Serif SC',serif;font-size:12px;line-height:1.7;color:#c8b888;padding:4px 0;">
        <div style="font-size:16px;font-weight:700;color:#e0c878;border-bottom:1px solid #5a4a30;padding-bottom:8px;margin-bottom:8px;letter-spacing:2px;">${title}</div>
        <div style="font-size:10px;color:#8a7a5a;margin-bottom:8px;">${desc}</div>
        ${chars ? `<div style="margin-top:6px;padding-top:6px;border-top:1px dotted #3a3020;font-size:11px;color:#9a8a6a;">${chars}</div>` : ''}
      </div>`;

    // ---- 大周标记 ----
    const places = [
      // 京畿
      { lat: 34.62, lng: 112.45, color: '#ff4444', size: 16, name: '洛阳', desc: '天下之中 · 大周皇都 · 烈火烹油的盛世幻梦', title: '京畿 · 洛阳城' },
      { lat: 34.75, lng: 112.48, color: '#44dd44', size: 8, name: '上清宫', desc: '北邙山 · 沈清颜出家之地', title: '北邙山 · 上清宫' },
      { lat: 34.70, lng: 112.55, color: '#44dd44', size: 8, name: '白马寺', desc: '武玄贞常驻 · 大慈恩寺耳目', title: '洛阳 · 白马寺' },
      // 关中
      { lat: 34.26, lng: 108.94, color: '#ff8800', size: 15, name: '长安', desc: '前唐旧都 · 秦王府驻地 · 丝路起点', title: '关中 · 长安城' },
      { lat: 33.95, lng: 108.95, color: '#44dd44', size: 12, name: '终南山', desc: '太玄观 · 道门正宗 · 上三门', title: '终南山 · 太玄观' },
      { lat: 34.48, lng: 110.09, color: '#44dd44', size: 12, name: '华山', desc: '天剑阁 · 天下第一剑派 · 杀伐第一', title: '华山 · 天剑阁' },
      { lat: 35.36, lng: 111.22, color: '#ddaa44', size: 10, name: '闻喜', desc: '河东裴氏 · 天下律法与钱庄之源', title: '闻喜 · 裴氏坞堡' },
      // 中原
      { lat: 34.80, lng: 114.35, color: '#ff8800', size: 15, name: '开封', desc: '中原都会 · 梁王府驻地 · 白莲教滋长', title: '中原 · 开封城' },
      { lat: 34.48, lng: 112.95, color: '#cc6666', size: 8, name: '嵩山', desc: '白莲教真空总坛', title: '嵩山 · 白莲教' },
      // 河朔
      { lat: 37.87, lng: 112.55, color: '#ff8800', size: 15, name: '晋阳', desc: '北方屏障 · 晋王府驻地 · 八万甲士', title: '河朔 · 晋阳城' },
      { lat: 40.09, lng: 113.30, color: '#ff8800', size: 8, name: '大同', desc: '太行阴契咽喉 · 官马场', title: '大同官马场' },
      // 燕齐
      { lat: 39.91, lng: 116.40, color: '#ff8800', size: 13, name: '幽州', desc: '御北重镇 · 乾国公府 · 海陆贸易', title: '燕齐 · 幽州城' },
      { lat: 37.06, lng: 115.68, color: '#ddaa44', size: 10, name: '清河', desc: '崔氏 · 四大世家之首 · 累世公卿', title: '清河崔氏' },
      { lat: 35.10, lng: 118.35, color: '#ddaa44', size: 10, name: '琅琊', desc: '王氏 · 天下兵刃铸造之源 · 东海剑炉', title: '琅琊王氏' },
      { lat: 36.25, lng: 117.10, color: '#44dd44', size: 10, name: '泰山', desc: '天衍宗 · 术数卜卦 · 国师坐镇', title: '泰山 · 天衍宗' },
      { lat: 37.80, lng: 120.75, color: '#44aaff', size: 8, name: '登州', desc: '燕齐最大出海港口', title: '登州港' },
      // 江淮
      { lat: 32.06, lng: 118.80, color: '#44aaff', size: 13, name: '金陵', desc: '财赋重地 · 陈郡谢氏 · 烟雨江南', title: '江淮 · 金陵城' },
      { lat: 24.87, lng: 118.68, color: '#44aaff', size: 7, name: '泉州', desc: '市舶司 · 南洋商船往来', title: '泉州港' },
      // 荆襄
      { lat: 32.04, lng: 112.14, color: '#ff8800', size: 13, name: '襄阳', desc: '铁打的襄阳 · 楚王府驻地 · 天下粮仓', title: '荆襄 · 襄阳城' },
      { lat: 29.38, lng: 113.00, color: '#44dd44', size: 8, name: '君山', desc: '丐帮君山分舵 · 洞庭湖', title: '洞庭湖 · 君山' },
      // 巴蜀
      { lat: 30.57, lng: 104.07, color: '#44aaff', size: 13, name: '成都', desc: '天府之国 · 青溪门 · 袍哥会', title: '巴蜀 · 成都城' },
      { lat: 28.50, lng: 104.50, color: '#44dd44', size: 10, name: '万岭箐', desc: '青溪门 · 医武合一 · 下四门', title: '蜀南 · 青溪门' },
      // 雍凉
      { lat: 37.93, lng: 102.64, color: '#ff8800', size: 13, name: '凉州', desc: '丝路咽喉 · 凉国公府 · 全民皆兵', title: '雍凉 · 凉州城' },
      { lat: 34.58, lng: 105.72, color: '#ddaa44', size: 8, name: '天水', desc: '关中旧族 · 丝路走私集散地', title: '天水 · 关中旧族' },
      { lat: 35.58, lng: 104.14, color: '#ddaa44', size: 8, name: '陇西', desc: '李氏 · 前唐皇族后裔 · 图谋复辟', title: '陇西李氏' },
      { lat: 40.14, lng: 94.66, color: '#44aaff', size: 7, name: '敦煌', desc: '佛土流金 · 莫高窟千佛洞', title: '敦煌莫高窟' },
      // 西域
      { lat: 42.95, lng: 89.19, color: '#888', size: 13, name: '高昌', desc: '西域都护府 · 形同独立王国', title: '西域 · 高昌城' },
      { lat: 43.50, lng: 85.00, color: '#cc6666', size: 10, name: '天山', desc: '明教总坛 · 圣火不灭 · 教主空悬', title: '天山 · 明教' },
      // 草原
      { lat: 42.00, lng: 112.00, color: '#888', size: 13, name: '受降城', desc: '安北都护府 · 漠南军事堡垒', title: '草原 · 受降城' },
      { lat: 48.00, lng: 107.00, color: '#888', size: 7, name: '狼居胥', desc: '漠北圣山 · 大周祭天石碑', title: '狼居胥山' },
      // 苗疆
      { lat: 25.60, lng: 100.23, color: '#44aaff', size: 10, name: '大理', desc: '苗疆 · 黔国公府 · 原始巫蛊', title: '苗疆 · 大理城' },
      { lat: 24.50, lng: 100.70, color: '#cc6666', size: 10, name: '无量山', desc: '五仙教 · 天下毒蛊之源 · 毒瘴封山', title: '无量山 · 五仙教' },
      // 岭南
      { lat: 23.13, lng: 113.26, color: '#44aaff', size: 10, name: '广州', desc: '万国商会 · 远洋海贸枢纽 · 流放之所', title: '岭南 · 广州城' },
      // 关隘
      { lat: 34.83, lng: 113.65, color: '#aa66cc', size: 7, name: '虎牢关', desc: '大周关隘要塞', title: '虎牢关' },
      { lat: 34.52, lng: 110.30, color: '#aa66cc', size: 7, name: '函谷关', desc: '大周关隘要塞', title: '函谷关' },
      { lat: 39.84, lng: 113.30, color: '#aa66cc', size: 7, name: '雁门关', desc: '大周关隘要塞', title: '雁门关' },
      { lat: 32.65, lng: 105.85, color: '#aa66cc', size: 7, name: '剑门关', desc: '大周关隘要塞', title: '剑门关' },
      { lat: 39.83, lng: 98.29, color: '#aa66cc', size: 7, name: '嘉峪关', desc: '大周关隘要塞', title: '嘉峪关' },
      { lat: 40.14, lng: 96.76, color: '#aa66cc', size: 7, name: '玉门关', desc: '大周关隘要塞', title: '玉门关' },
      { lat: 25.00, lng: 114.20, color: '#aa66cc', size: 7, name: '梅关', desc: '大周关隘要塞', title: '梅关' },
      { lat: 34.00, lng: 106.80, color: '#aa66cc', size: 7, name: '散关', desc: '大周关隘要塞', title: '散关' },
      { lat: 38.05, lng: 115.50, color: '#aa66cc', size: 7, name: '中渡桥', desc: '大周建国转折之役古战场', title: '中渡桥' },
    ];

    places.forEach(p => {
      L.marker([p.lat, p.lng], { icon: mk(p.color, p.size) })
        .addTo(map).bindPopup(popup(p.title, p.desc, p.name), { maxWidth: 340 });
    });

    // ===== 外国区域 =====
    const foreignMarkers: { lat: number; lng: number; color: string; size: number; name: string; title: string; desc: string; chars: string }[] = [
      // 东瀛
      { lat: 35.5, lng: 137, color: '#e88', size: 14, name: '东瀛', title: '东瀛 · 扶桑诸岛',
        desc: '倭国 · 遣唐使往来频繁 · 剑道与忍术独树一帜',
        chars: '▸ 柳生宗严（剑圣）· 服部半藏（忍军头领）· 出云阿国（巫女舞者）\n▸ 武学：无刀取·影缚术·八咫乌·天诛剑\n▸ 势力：德川幕府·伊贺忍军·出云神社' },
      // 高丽
      { lat: 37.5, lng: 127, color: '#e88', size: 14, name: '高丽', title: '高丽 · 海东之国',
        desc: '朝鲜半岛 · 儒学立国 · 武臣跋扈',
        chars: '▸ 崔忠献（武臣首领）· 李奎报（文臣）· 金允侯（义军将）\n▸ 武学：花郎道·跆跟·弓道·海东剑法\n▸ 势力：高丽王室·武臣政权·花郎道场' },
      // 吐蕃
      { lat: 30, lng: 91, color: '#e88', size: 16, name: '吐蕃', title: '吐蕃 · 雪域高原',
        desc: '赞普王庭 · 密宗佛法 · 高原铁骑',
        chars: '▸ 松赞干布（赞普）· 莲花生（密宗上师）· 论钦陵（大论）\n▸ 武学：大日如来印·金刚伏魔杵·雪域九转·天葬刀\n▸ 势力：赞普王庭·桑耶寺·苯教祭坛·吐蕃铁骑' },
      // 南洋
      { lat: 5, lng: 118, color: '#e88', size: 14, name: '南洋', title: '南洋 · 万岛之域',
        desc: '三佛齐·满者伯夷 · 香料群岛 · 海盗横行',
        chars: '▸ 郑和义（海商魁首）· 陈祖义（海盗王）· 公主蒂雅（满者伯夷）\n▸ 武学：分海刀·潜渊诀·鲨咬拳·毒鳞刺\n▸ 势力：三佛齐王朝·巨蛟帮·香料商会·珊瑚舰' },
      // 英吉利
      { lat: 52, lng: -1, color: '#e88', size: 14, name: '英吉利', title: '英吉利 · 西洋列岛',
        desc: '骑士王国 · 东印度公司 · 火器初兴',
        chars: '▸ 亨利八世（国王）· 弗朗西斯·德雷克（海盗提督）· 艾琳·斯图亚特（女勋爵）\n▸ 武学：骑士剑术·长弓术·铳术·炼金术\n▸ 势力：英王王室·东印度公司·圣殿骑士团·皇家海军' },
    ];

    foreignMarkers.forEach(p => {
      L.marker([p.lat, p.lng], { icon: mk(p.color, p.size) })
        .addTo(map).bindPopup(foreignPopup(p.title, p.desc, p.chars), { maxWidth: 380 });
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
          className: '',
          html: `<span style="font-family:'Noto Serif SC',serif;font-size:16px;font-weight:700;color:#c8a86c;text-shadow:2px 2px 8px rgba(0,0,0,0.95),0 0 12px rgba(0,0,0,0.6);letter-spacing:5px;white-space:nowrap;">${text}</span>`,
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
          className: '',
          html: `<span style="font-family:'Noto Serif SC',serif;font-size:13px;color:#7a6a50;text-shadow:1px 1px 6px rgba(0,0,0,0.9);letter-spacing:4px;white-space:nowrap;">${text}</span>`,
          iconSize: [130, 20], iconAnchor: [65, 10],
        }), interactive: false,
      }).addTo(map);
    });

    // Scale
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    // Go-to handler
    (window as unknown as Record<string, unknown>)._dzGo = (name: string) => {
      onSend(`前往${name}`);
      onClose();
    };

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      delete (window as unknown as Record<string, unknown>)._dzGo;
      map.remove();
    };
  }, [isOpen, onSend, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '96%', maxWidth: 960, height: '86vh',
        background: '#1a1a1a', border: '1px solid var(--dz-gray-light)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: 'rgba(40,30,15,0.95)', borderBottom: '2px solid #8b7355', flexShrink: 0, zIndex: 10 }}>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 900, color: '#e8d5a3', letterSpacing: 10, margin: 0 }}>大周堪舆图</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a08c6a', cursor: 'pointer', fontSize: 24, padding: '4px 8px' }}>×</button>
        </div>
        <div id="dz-leaflet-map" style={{ flex: 1, background: '#2a2518' }} />
        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
          background: 'rgba(40,30,15,0.92)', border: '1px solid #6b5b3e', borderRadius: 4,
          padding: '8px 12px', fontFamily: "'Noto Serif SC',serif", fontSize: 10, lineHeight: 2,
          color: '#d4c5a0', maxWidth: 170, pointerEvents: 'none',
        }}>
          <div style={{ color: '#e8d5a3', fontWeight: 700, marginBottom: 2 }}>图 例</div>
          {[['#ff4444', '京畿·皇都'], ['#ff8800', '王府·国公府'], ['#44aaff', '州府重镇'], ['#44dd44', '正派·宗门'], ['#ddaa44', '世家族地'], ['#aa66cc', '关隘要塞'], ['#888', '边镇都护府'], ['#cc6666', '邪派·暗势力'], ['#e88', '外邦区域']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
