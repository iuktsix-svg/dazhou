import { useEffect, useRef, useState, useCallback } from 'react'; import { X } from 'lucide-react';
interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }

const MAP_URL = 'https://files.catbox.moe/vkbiee.jpeg';
const LOCS: Record<string,{x:number;y:number;desc:string}> = {
  '洛阳':{x:526,y:509,desc:'神都洛阳，天下之中。皇城巍峨，平康坊灯火彻夜不息。'},'长安':{x:459,y:504,desc:'古都长安，丝绸之路起点。秦王府坐镇，胡商云集。'},'开封':{x:577,y:518,desc:'中原都会，梁王府驻地。黄河水患频频，白莲教暗中滋长。'},'金陵':{x:634,y:528,desc:'江南佳丽地，金陵帝王州。陈郡谢氏与江南总督府共治。'},'幽州':{x:604,y:391,desc:'幽燕重镇，乾国公府所在。幽燕铁骑威震塞外。'},'晋阳':{x:538,y:430,desc:'河朔之脊，晋王府驻地。太行八陉锁钥。'},'襄阳':{x:481,y:559,desc:'铁打的襄阳，楚王府坐镇。汉水与长江交汇。'},'成都':{x:334,y:603,desc:'天府成都，巴蜀中心。青溪门悬壶济世。'},'大理':{x:269,y:714,desc:'南疆大理，黔国公与五仙教并存。'},'凉州':{x:474,y:416,desc:'凉州城，丝绸之路咽喉。凉国公府屯重兵。'},'西域都护府':{x:135,y:400,desc:'西域都护府，黄沙万里。'},'漠北王庭':{x:729,y:127,desc:'漠北草原，安北都护府镇压诸部。'},'东瀛':{x:1049,y:474,desc:'扶桑诸岛，倭国，遣唐使往来频繁。'},
};

export function MapModal({ isOpen, onClose, onSend }: Props) {
  const cv = useRef<HTMLCanvasElement>(null); const vp = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string|null>(null);
  const imgRef = useRef<HTMLImageElement|null>(null); const loadedRef = useRef(false); const offRef = useRef({x:0,y:0}); const scRef = useRef(1); const dragRef = useRef({a:false,sx:0,sy:0});

  const draw = useCallback(() => {
    const c=cv.current; if(!c)return; const ctx=c.getContext('2d'); if(!ctx)return;
    const w=c.width,h=c.height; ctx.clearRect(0,0,w,h);
    if(!loadedRef.current||!imgRef.current){ctx.fillStyle='#e8dcc7';ctx.fillRect(0,0,w,h);ctx.font="16px 'Noto Serif SC'";ctx.fillStyle='#8a827a';ctx.fillText('地图加载中...',w/2-60,h/2);return;}
    ctx.save();ctx.translate(offRef.current.x,offRef.current.y);ctx.scale(scRef.current,scRef.current);ctx.drawImage(imgRef.current,0,0,w,h);
    for(const[n,l]of Object.entries(LOCS)){ctx.beginPath();ctx.arc(l.x,l.y,6,0,2*Math.PI);ctx.fillStyle='#c8a060';ctx.fill();ctx.beginPath();ctx.arc(l.x,l.y,10,0,2*Math.PI);ctx.strokeStyle='#f5e6b3';ctx.lineWidth=1.2;ctx.stroke();ctx.font="bold 14px 'Noto Serif SC'";ctx.fillStyle='#3c2a1c';ctx.fillText(n,l.x+10,l.y-4);}
    if(sel&&LOCS[sel]){const l=LOCS[sel];ctx.beginPath();ctx.arc(l.x,l.y,16,0,2*Math.PI);ctx.strokeStyle='#e5a030';ctx.lineWidth=3;ctx.stroke();}
    ctx.restore();
  },[sel]);

  useEffect(()=>{if(!isOpen)return;const c=cv.current;if(!c)return;const img=new Image();img.onload=()=>{loadedRef.current=true;imgRef.current=img;draw();};img.onerror=()=>{loadedRef.current=false;draw();};img.src=MAP_URL;const v=vp.current;if(!v)return;
    const md=(e:MouseEvent)=>{dragRef.current={a:true,sx:e.clientX,sy:e.clientY};v.style.cursor='grabbing'};
    const mm=(e:MouseEvent)=>{if(!dragRef.current.a)return;offRef.current.x+=e.clientX-dragRef.current.sx;offRef.current.y+=e.clientY-dragRef.current.sy;dragRef.current.sx=e.clientX;dragRef.current.sy=e.clientY;draw()};
    const mu=()=>{dragRef.current.a=false;v.style.cursor='grab'};
    const mw=(e:WheelEvent)=>{e.preventDefault();const r=v.getBoundingClientRect();const rx=c.width/r.width;const mx=(e.clientX-r.left)*rx;const my=(e.clientY-r.top)*rx;let ns=scRef.current+(e.deltaY>0?-0.1:0.1);ns=Math.min(2.5,Math.max(0.5,ns));const wx=(mx-offRef.current.x)/scRef.current;const wy=(my-offRef.current.y)/scRef.current;scRef.current=ns;offRef.current.x=mx-wx*ns;offRef.current.y=my-wy*ns;draw()};
    const cl=(e:MouseEvent)=>{if(dragRef.current.a)return;const r=c.getBoundingClientRect();const rx=c.width/r.width;let cx=(e.clientX-r.left)*rx;let cy=(e.clientY-r.top)*rx;cx=(cx-offRef.current.x)/scRef.current;cy=(cy-offRef.current.y)/scRef.current;for(const[n,l]of Object.entries(LOCS)){if(Math.hypot(cx-l.x,cy-l.y)<15){setSel(n);draw();return}}};
    v.addEventListener('mousedown',md);v.addEventListener('wheel',mw);c.addEventListener('click',cl);document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);draw();return ()=>{v.removeEventListener('mousedown',md);v.removeEventListener('wheel',mw);c.removeEventListener('click',cl);document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu)};
  },[isOpen,draw]);

  return (<div className={`dz-modal ${isOpen?'on':''}`} style={{maxWidth:620}}><div className="dz-modal-halftone"/><div className="dz-modal-head"><h2>大周堪舆图</h2><button className="dz-modal-close" onClick={onClose}><X size={18}/></button></div><div className="dz-modal-body"><div className="dz-map-wrap"><div className="dz-map-view" ref={vp}><canvas ref={cv} width={1500} height={1000} style={{display:'block',width:'100%',height:'auto'}}/></div><div className="dz-map-info">{sel?<><h4>{sel}</h4><p>{LOCS[sel]?.desc}</p></>:<><h4>未选择</h4><p>点击地图上的金色圆点查看详情</p></>}</div><button className="dz-map-go" onClick={()=>{if(sel){onSend(`前往${sel}`);onClose();}}}>前往此地</button></div></div><div className="dz-modal-foot"/></div>);
}
