import { useEffect, useState } from 'react';
import { useSillytavern } from '../hooks/useSillytavern';

export function TopBar() {
  const { activeChat } = useSillytavern();
  const [info, setInfo] = useState({ time: '--', location: '--', condition: '健康' });

  useEffect(() => {
    const update = () => {
      const vars = (activeChat?.variables || {}) as Record<string, unknown>;
      const p = (vars['主角状态'] || {}) as Record<string, unknown>;
      const sys = (vars['系统与时辰'] || {}) as Record<string, unknown>;
      setInfo({
        time: String(sys['当前时辰'] || vars['当前时辰'] || '--'),
        location: String(p['当前所在地点'] || vars['当前所在地点'] || '--'),
        condition: String(p['身体状态'] || vars['身体状态'] || '健康'),
      });
    };
    update();
    const iv = setInterval(update, 2000);
    return () => clearInterval(iv);
  }, [activeChat]);

  return (
    <header className="dz-topbar">
      <span className="dz-topbar-title">大周日暮录</span>
      <div className="dz-topbar-meta">
        <span className="meta-item">{info.time}</span>
        <span className="meta-item">{info.location}</span>
        <span className={`meta-item meta-condition`}>{info.condition}</span>
      </div>
    </header>
  );
}
