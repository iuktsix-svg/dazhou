export function MountainBG() {
  return (
    <div className="app-bg-mountains" aria-hidden="true">
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Far mountains (lightest) */}
        <path d="M0 400 L0 280 Q80 220 160 260 Q240 200 320 240 Q400 180 480 230 Q560 160 640 210 Q720 140 800 200 Q880 150 960 200 Q1040 160 1120 210 Q1200 180 1280 220 Q1360 200 1440 240 L1440 400Z"
          fill="currentColor" opacity="0.3"/>
        {/* Mid mountains */}
        <path d="M0 400 L0 310 Q100 260 200 300 Q300 240 400 290 Q500 220 600 280 Q700 230 800 280 Q900 210 1000 270 Q1100 230 1200 280 Q1300 250 1440 290 L1440 400Z"
          fill="currentColor" opacity="0.45"/>
        {/* Near mountains (darkest) */}
        <path d="M0 400 L0 340 Q120 300 240 350 Q360 290 480 340 Q600 280 720 330 Q840 270 960 320 Q1080 280 1200 330 Q1320 290 1440 340 L1440 400Z"
          fill="currentColor" opacity="0.6"/>
        {/* Mist layers */}
        <ellipse cx="300" cy="320" rx="400" ry="30" fill="currentColor" opacity="0.15"/>
        <ellipse cx="900" cy="300" rx="500" ry="35" fill="currentColor" opacity="0.12"/>
        <ellipse cx="600" cy="350" rx="600" ry="40" fill="currentColor" opacity="0.18"/>
        {/* Lone pine on right */}
        <g transform="translate(1100, 240)" opacity="0.5">
          <rect x="0" y="0" width="3" height="80" rx="1.5" fill="currentColor"/>
          <path d="M-15 20 L1 -10 L17 20Z" fill="currentColor" opacity="0.6"/>
          <path d="M-12 35 L1 8 L15 35Z" fill="currentColor" opacity="0.5"/>
          <path d="M-8 50 L1 25 L11 50Z" fill="currentColor" opacity="0.4"/>
        </g>
        {/* Pavillion on left */}
        <g transform="translate(180, 270)" opacity="0.35">
          <rect x="15" y="30" width="4" height="40" fill="currentColor"/>
          <rect x="25" y="30" width="4" height="40" fill="currentColor"/>
          <path d="M5 30 L35 30 L30 15 L10 15Z" fill="currentColor" opacity="0.6"/>
          <path d="M10 15 L30 15 L25 5 L15 5Z" fill="currentColor" opacity="0.5"/>
        </g>
        {/* Moon */}
        <circle cx="1200" cy="80" r="40" fill="currentColor" opacity="0.08"/>
        <circle cx="1200" cy="80" r="38" fill="currentColor" opacity="0.02"/>
        {/* Stars */}
        {[[200,50],[350,30],[500,65],[680,25],[780,55],[950,40],[1050,20],[1150,70]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={1.2} fill="currentColor" opacity={0.15 + Math.random() * 0.1}/>
        ))}
      </svg>
    </div>
  );
}
