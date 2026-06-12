import { useEffect, useRef, useState, useCallback } from 'react';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

const BASE_MAP_URL = 'https://files.catbox.moe/vkbiee.jpeg';

const LOCATIONS: Record<string, { x: number; y: number; desc: string }> = {
  '洛阳': { x: 526, y: 509, desc: '神都洛阳，天下之中。皇城巍峨，平康坊灯火彻夜不息。' },
  '长安': { x: 459, y: 504, desc: '古都长安，丝绸之路起点。秦王府坐镇，胡商云集，佛道争鸣。' },
  '开封': { x: 577, y: 518, desc: '中原都会，梁王府驻地。黄河水患频频，白莲教暗中滋长。' },
  '金陵': { x: 634, y: 528, desc: '江南佳丽地，金陵帝王州。陈郡谢氏与江南总督府共治。' },
  '幽州': { x: 604, y: 391, desc: '幽燕重镇，乾国公府所在。幽燕铁骑威震塞外。' },
  '晋阳': { x: 538, y: 430, desc: '河朔之脊，晋王府驻地。太行八陉锁钥。' },
  '襄阳': { x: 481, y: 559, desc: '铁打的襄阳，楚王府坐镇。汉水与长江交汇。' },
  '成都': { x: 334, y: 603, desc: '天府成都，巴蜀中心。青溪门悬壶济世。' },
  '大理': { x: 269, y: 714, desc: '南疆大理，黔国公与五仙教并存。' },
  '凉州': { x: 474, y: 416, desc: '凉州城，丝绸之路咽喉。凉国公府屯重兵。' },
  '西域都护府': { x: 135, y: 400, desc: '西域都护府，黄沙万里。高昌城、龟兹诸国。' },
  '漠北王庭': { x: 729, y: 127, desc: '漠北草原，安北都护府镇压诸部。' },
  '东瀛': { x: 1049, y: 474, desc: '扶桑诸岛，倭国，遣唐使往来频繁。' },
};

export function MapModal({ isOpen, onClose, onSend }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageLoadedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const dragRef = useRef({ active: false, startX: 0, startY: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!imageLoadedRef.current || !imageRef.current) {
      ctx.fillStyle = '#e8dcc7'; ctx.fillRect(0, 0, w, h);
      ctx.font = "18px 'Noto Serif SC'"; ctx.fillStyle = '#8a827a';
      ctx.fillText('地图加载中...', w / 2 - 80, h / 2);
      return;
    }

    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);
    ctx.drawImage(imageRef.current, 0, 0, w, h);

    for (const [name, loc] of Object.entries(LOCATIONS)) {
      ctx.beginPath(); ctx.arc(loc.x, loc.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#cfa868'; ctx.fill();
      ctx.beginPath(); ctx.arc(loc.x, loc.y, 11, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f5e6b3'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "bold 15px 'Noto Serif SC'"; ctx.fillStyle = '#3c2a1c';
      ctx.fillText(name, loc.x + 10, loc.y - 5);
    }

    if (selectedLoc && LOCATIONS[selectedLoc]) {
      const loc = LOCATIONS[selectedLoc];
      ctx.beginPath(); ctx.arc(loc.x, loc.y, 18, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5a030'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
  }, [selectedLoc]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => { imageLoadedRef.current = true; imageRef.current = img; draw(); };
    img.onerror = () => { imageLoadedRef.current = false; draw(); };
    img.src = BASE_MAP_URL;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const onMouseDown = (e: MouseEvent) => {
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY };
      viewport.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      offsetRef.current.x += e.clientX - dragRef.current.startX;
      offsetRef.current.y += e.clientY - dragRef.current.startY;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      draw();
    };
    const onMouseUp = () => {
      dragRef.current.active = false;
      viewport.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const ratioX = canvas.width / rect.width;
      const mx = (e.clientX - rect.left) * ratioX;
      const my = (e.clientY - rect.top) * ratioX;
      let ns = scaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1);
      ns = Math.min(2.5, Math.max(0.5, ns));
      const wx = (mx - offsetRef.current.x) / scaleRef.current;
      const wy = (my - offsetRef.current.y) / scaleRef.current;
      scaleRef.current = ns;
      offsetRef.current.x = mx - wx * ns;
      offsetRef.current.y = my - wy * ns;
      draw();
    };
    const onClick = (e: MouseEvent) => {
      if (dragRef.current.active) return;
      const rect = canvas.getBoundingClientRect();
      const ratioX = canvas.width / rect.width;
      let cx = (e.clientX - rect.left) * ratioX;
      let cy = (e.clientY - rect.top) * ratioX;
      cx = (cx - offsetRef.current.x) / scaleRef.current;
      cy = (cy - offsetRef.current.y) / scaleRef.current;
      for (const [name, loc] of Object.entries(LOCATIONS)) {
        if (Math.hypot(cx - loc.x, cy - loc.y) < 15) { setSelectedLoc(name); draw(); return; }
      }
    };

    viewport.addEventListener('mousedown', onMouseDown);
    viewport.addEventListener('wheel', onWheel);
    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    draw();

    return () => {
      viewport.removeEventListener('mousedown', onMouseDown);
      viewport.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isOpen, draw]);

  const handleGo = () => {
    if (selectedLoc) { onSend(`前往${selectedLoc}`); onClose(); }
  };

  return (
    <div className={`dz-modal dz-map-modal ${isOpen ? 'active' : ''}`} style={{ maxWidth: 640 }}>
      <div className="dz-modal-header">
        <h2>大周堪舆图</h2>
        <button className="dz-modal-close" onClick={onClose}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="dz-map-viewport" ref={viewportRef}>
          <canvas ref={canvasRef} width={1500} height={1000} style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>
        <div className="dz-map-detail">
          {selectedLoc ? (
            <>
              <h3>{selectedLoc}</h3>
              <p>{LOCATIONS[selectedLoc]?.desc}</p>
            </>
          ) : (
            <>
              <h3>未选择</h3>
              <p>点击地图上的金色圆点查看详情</p>
            </>
          )}
        </div>
        <button className="dz-map-go-btn" onClick={handleGo}>前往此地</button>
      </div>
    </div>
  );
}
