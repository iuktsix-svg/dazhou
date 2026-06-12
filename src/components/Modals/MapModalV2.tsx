import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

export function MapModal({ isOpen, onClose, onSend }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const map = L.map('dz-leaflet-map', {
      center: [34.5, 108],
      zoom: 5,
      minZoom: 3,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    // Custom tile filter for sepia/warm tone
    const tilePane = map.getPane('tilePane');
    if (tilePane) tilePane.style.filter = 'sepia(0.5) saturate(0.4) brightness(0.7) contrast(1.1)';

    // 大周国境线
    L.polygon([
      [53, 85], [53, 95], [52, 105], [50, 115], [48, 120], [45, 125],
      [42, 128], [40, 130], [38, 128], [35, 122], [32, 122], [28, 121],
      [25, 120], [22, 118], [20, 112], [18, 108], [18, 105], [20, 100],
      [22, 100], [24, 98], [26, 97], [28, 92], [30, 88], [32, 82],
      [35, 75], [38, 73], [42, 75], [45, 78], [48, 80], [50, 82], [53, 85],
    ], {
      color: '#8b6914', weight: 2.5, opacity: 0.7,
      fillColor: '#3a2f1a', fillOpacity: 0.12,
      dashArray: '8,4',
    }).addTo(map);

    // 黄河
    L.polyline([
      [35.5, 96], [36, 100], [36.5, 103], [37.5, 105], [38, 107], [37.8, 109],
      [37, 110], [36.5, 110.5], [35.5, 111], [35, 113], [34.8, 114.5], [35.2, 117], [35.5, 119],
    ], { color: '#6b5a2a', weight: 2, opacity: 0.5, dashArray: '4,3' }).addTo(map);

    // 长江
    L.polyline([
      [30, 97], [29.5, 101], [29.8, 104], [30.2, 106], [30.5, 108], [30.8, 111],
      [30.5, 113], [31, 116], [31.5, 118], [31.8, 120], [31.5, 121.5],
    ], { color: '#4a5a3a', weight: 2, opacity: 0.5, dashArray: '4,3' }).addTo(map);

    // Marker factory
    const mk = (color: string, size = 10) => L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 8px ${color}80;"></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });

    // Simplified popup — just name + brief desc + go button
    const popup = (title: string, desc: string, locName: string) => `
      <div style="font-family:'Noto Serif SC',serif;font-size:13px;line-height:1.7;color:#d4c5a0;padding:4px 0;">
        <div style="font-size:18px;font-weight:700;color:#f0e0b0;border-bottom:1px solid #5a4a30;padding-bottom:8px;margin-bottom:8px;letter-spacing:2px;">${title}</div>
        <div style="font-size:11px;color:#8a7a5a;margin-bottom:8px;">${desc}</div>
        <button onclick="window._dzGoTo && window._dzGoTo('${locName}')" style="width:100%;padding:8px;background:#c53030;color:#fff;border:none;cursor:pointer;font-family:'Noto Serif SC',serif;font-size:13px;font-weight:700;letter-spacing:1px;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);">前往此地</button>
      </div>`;

    const places = [
      { lat: 34.62, lng: 112.45, color: '#ff4444', size: 14, name: '洛阳', desc: '天下之中 · 大周皇都', title: '京畿 · 洛阳城' },
      { lat: 34.75, lng: 112.48, color: '#44dd44', size: 7, name: '上清宫', desc: '沈清颜出家之地', title: '北邙山 · 上清宫' },
      { lat: 34.70, lng: 112.55, color: '#44dd44', size: 7, name: '白马寺', desc: '武玄贞常驻', title: '洛阳 · 白马寺' },
      { lat: 34.26, lng: 108.94, color: '#ff8800', size: 14, name: '长安', desc: '前唐旧都 · 秦王府驻地', title: '关中 · 长安城' },
      { lat: 33.95, lng: 108.95, color: '#44dd44', size: 11, name: '终南山', desc: '太玄观 · 道门正宗', title: '终南山 · 太玄观' },
      { lat: 34.48, lng: 110.09, color: '#44dd44', size: 11, name: '华山', desc: '天剑阁 · 天下第一剑派', title: '华山 · 天剑阁' },
      { lat: 34.80, lng: 114.35, color: '#ff8800', size: 14, name: '开封', desc: '中原都会 · 梁王府驻地', title: '中原 · 开封城' },
      { lat: 37.87, lng: 112.55, color: '#ff8800', size: 14, name: '晋阳', desc: '河朔重镇 · 晋王府驻地', title: '河朔 · 晋阳城' },
      { lat: 35.36, lng: 111.22, color: '#ddaa44', size: 9, name: '闻喜', desc: '河东裴氏 · 天下钱庄之源', title: '闻喜 · 裴氏坞堡' },
      { lat: 40.09, lng: 113.30, color: '#ff8800', size: 8, name: '大同', desc: '太行阴契咽喉', title: '大同官马场' },
      { lat: 39.91, lng: 116.40, color: '#ff8800', size: 12, name: '幽州', desc: '御北重镇 · 乾国公府', title: '燕齐 · 幽州城' },
      { lat: 37.06, lng: 115.68, color: '#ddaa44', size: 10, name: '清河', desc: '崔氏 · 四大世家之首', title: '清河崔氏' },
      { lat: 35.10, lng: 118.35, color: '#ddaa44', size: 10, name: '琅琊', desc: '王氏 · 天下兵刃之源', title: '琅琊王氏' },
      { lat: 36.25, lng: 117.10, color: '#44dd44', size: 10, name: '泰山', desc: '天衍宗 · 国师坐镇', title: '泰山 · 天衍宗' },
      { lat: 32.06, lng: 118.80, color: '#44aaff', size: 12, name: '金陵', desc: '财赋重地 · 陈郡谢氏', title: '江淮 · 金陵城' },
      { lat: 32.04, lng: 112.14, color: '#ff8800', size: 12, name: '襄阳', desc: '天下粮仓 · 楚王府驻地', title: '荆襄 · 襄阳城' },
      { lat: 29.38, lng: 113.00, color: '#44dd44', size: 8, name: '君山', desc: '丐帮君山分舵', title: '洞庭湖 · 君山' },
      { lat: 30.57, lng: 104.07, color: '#44aaff', size: 12, name: '成都', desc: '天府之国 · 青溪门', title: '巴蜀 · 成都城' },
      { lat: 28.50, lng: 104.50, color: '#44dd44', size: 10, name: '万岭箐', desc: '青溪门 · 医武合一', title: '蜀南 · 青溪门' },
      { lat: 37.93, lng: 102.64, color: '#ff8800', size: 12, name: '凉州', desc: '丝路咽喉 · 凉国公府', title: '雍凉 · 凉州城' },
      { lat: 34.58, lng: 105.72, color: '#ddaa44', size: 8, name: '天水', desc: '关中旧族 · 丝路走私', title: '天水 · 关中旧族' },
      { lat: 35.58, lng: 104.14, color: '#ddaa44', size: 8, name: '陇西', desc: '李氏 · 前唐后裔', title: '陇西李氏' },
      { lat: 42.95, lng: 89.19, color: '#888', size: 12, name: '高昌', desc: '西域都护府', title: '西域 · 高昌城' },
      { lat: 43.50, lng: 85.00, color: '#cc6666', size: 10, name: '天山', desc: '明教总坛 · 圣火不灭', title: '天山 · 明教' },
      { lat: 42.00, lng: 112.00, color: '#888', size: 12, name: '受降城', desc: '安北都护府', title: '草原 · 受降城' },
      { lat: 25.60, lng: 100.23, color: '#44aaff', size: 10, name: '大理', desc: '苗疆 · 黔国公府', title: '苗疆 · 大理城' },
      { lat: 24.50, lng: 100.70, color: '#cc6666', size: 10, name: '无量山', desc: '五仙教 · 天下毒蛊之源', title: '无量山 · 五仙教' },
      { lat: 23.13, lng: 113.26, color: '#44aaff', size: 10, name: '广州', desc: '万国商会 · 远洋海贸', title: '岭南 · 广州城' },
      ...(['虎牢关', '函谷关', '雁门关', '剑门关', '嘉峪关', '玉门关', '梅关', '散关'] as const).map(name => {
        const lats: Record<string, number> = { '虎牢关': 34.83, '函谷关': 34.52, '雁门关': 39.84, '剑门关': 32.65, '嘉峪关': 39.83, '玉门关': 40.14, '梅关': 25.00, '散关': 34.00 };
        const lngs: Record<string, number> = { '虎牢关': 113.65, '函谷关': 110.30, '雁门关': 113.30, '剑门关': 105.85, '嘉峪关': 98.29, '玉门关': 96.76, '梅关': 114.20, '散关': 106.80 };
        return { lat: lats[name], lng: lngs[name], color: '#aa66cc', size: 7, name, desc: '大周关隘要塞', title: name };
      }),
      { lat: 34.48, lng: 112.95, color: '#cc6666', size: 8, name: '嵩山', desc: '白莲教真空总坛', title: '嵩山 · 白莲教' },
      { lat: 37.80, lng: 120.75, color: '#44aaff', size: 8, name: '登州', desc: '燕齐最大出海口', title: '登州港' },
      { lat: 40.14, lng: 94.66, color: '#44aaff', size: 7, name: '敦煌', desc: '佛土流金 · 莫高窟', title: '敦煌莫高窟' },
      { lat: 48.00, lng: 107.00, color: '#888', size: 7, name: '狼居胥', desc: '大周开国祭天处', title: '狼居胥山' },
      { lat: 38.05, lng: 115.50, color: '#44aaff', size: 7, name: '中渡桥', desc: '太祖建国转折之役古战场', title: '中渡桥' },
      { lat: 24.87, lng: 118.68, color: '#44aaff', size: 7, name: '泉州', desc: '市舶司 · 南洋商船', title: '泉州港' },
    ];

    places.forEach(p => {
      L.marker([p.lat, p.lng], { icon: mk(p.color, p.size) })
        .addTo(map)
        .bindPopup(popup(p.title, p.desc, p.name), { maxWidth: 360 });
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
          html: `<span style="font-family:'Noto Serif SC',serif;font-size:15px;font-weight:700;color:#c8a86c;text-shadow:2px 2px 6px rgba(0,0,0,0.9);letter-spacing:4px;white-space:nowrap;">${text}</span>`,
          iconSize: [120, 20], iconAnchor: [60, 10],
        }),
        interactive: false,
      }).addTo(map);
    });

    // Foreign labels
    [
      [52, 100, '北狄'], [36, 70, '大食'], [30, 78, '天竺'],
      [20, 106, '交趾'], [35, 128, '高丽'], [35, 135, '东瀛'],
      [15, 115, '南洋诸岛'], [42, 78, '西域诸邦'], [50, 120, '女真'], [28, 90, '吐蕃'],
    ].forEach(([lat, lng, text]) => {
      L.marker([lat as number, lng as number], {
        icon: L.divIcon({
          className: '',
          html: `<span style="font-family:'Noto Serif SC',serif;font-size:12px;color:#7a6a50;text-shadow:1px 1px 4px rgba(0,0,0,0.8);letter-spacing:3px;white-space:nowrap;">${text}</span>`,
          iconSize: [120, 20], iconAnchor: [60, 10],
        }),
        interactive: false,
      }).addTo(map);
    });

    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    // Expose go-to function
    (window as unknown as Record<string, unknown>)._dzGoTo = (name: string) => {
      onSend(`前往${name}`);
      onClose();
    };

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      delete (window as unknown as Record<string, unknown>)._dzGoTo;
      map.remove();
    };
  }, [isOpen, onSend, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 900, height: '82vh',
        background: '#1a1a1a', border: '1px solid var(--dz-gray-light)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(40,30,15,0.95)', borderBottom: '2px solid #8b7355', flexShrink: 0, zIndex: 10 }}>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 900, color: '#e8d5a3', letterSpacing: 8, margin: 0 }}>大周堪舆图</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a08c6a', cursor: 'pointer', fontSize: 22, padding: '4px 8px' }}>×</button>
        </div>
        {/* Map */}
        <div id="dz-leaflet-map" style={{ flex: 1 }} />
        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(40,30,15,0.92)', border: '1px solid #6b5b3e', borderRadius: 4,
          padding: '10px 14px', fontFamily: "'Noto Serif SC',serif", fontSize: 11, lineHeight: 2.2, color: '#d4c5a0',
          maxWidth: 180, pointerEvents: 'none',
        }}>
          <div style={{ color: '#e8d5a3', fontWeight: 700, marginBottom: 4 }}>图 例</div>
          {[['#ff4444', '京畿·皇都'], ['#ff8800', '藩王府·国公府'], ['#44aaff', '州府重镇'], ['#44dd44', '七大正派·三教'], ['#ddaa44', '世家族地'], ['#aa66cc', '关隘要塞'], ['#888', '边镇都护府'], ['#cc6666', '邪派·暗势力']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 10 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
