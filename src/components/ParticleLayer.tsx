import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; size: number; speed: number;
  rotation: number; rotSpeed: number; opacity: number;
  type: 'petal' | 'leaf';
  element: HTMLDivElement;
}

export function ParticleLayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: Particle[] = [];
    const maxParticles = 14;

    const createParticle = (): Particle => {
      const el = document.createElement('div');
      el.className = 'particle';
      const type = Math.random() > 0.5 ? 'petal' : 'leaf';
      const size = type === 'petal' ? 8 + Math.random() * 8 : 5 + Math.random() * 6;
      el.style.width = `${size}px`;
      el.style.height = `${size * 1.4}px`;
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      el.style.willChange = 'transform, opacity';
      el.style.zIndex = 'var(--z-particles, 0)';
      const hue = type === 'petal' ? 340 + Math.random() * 20 : 80 + Math.random() * 40;
      const sat = 30 + Math.random() * 30;
      const light = 30 + Math.random() * 30;
      el.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
      el.style.borderRadius = type === 'petal' ? '50% 0 50% 0' : '2px 60% 2px 60%';
      el.style.opacity = '0';

      container.appendChild(el);

      return {
        x: Math.random() * 100,
        y: -10 - Math.random() * 30,
        size, speed: 0.3 + Math.random() * 0.7,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.15 + Math.random() * 0.25,
        type, element: el,
      };
    };

    // Init particles
    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle();
      p.y = Math.random() * 110;
      particles.push(p);
    }

    let animId: number;
    const animate = () => {
      for (const p of particles) {
        p.y += p.speed;
        p.rotation += p.rotSpeed;
        p.x += Math.sin(p.y * 0.02) * 0.15;

        if (p.y > 110) {
          p.y = -10;
          p.x = Math.random() * 100;
        }

        p.element.style.transform = `translate(${p.x}vw, ${p.y}vh) rotate(${p.rotation}deg)`;
        p.element.style.opacity = String(p.y < 0 || p.y > 100 ? 0 : p.opacity * (p.y < 10 ? p.y / 10 : p.y > 90 ? (100 - p.y) / 10 : 1));
      }
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      for (const p of particles) p.element.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="particle-layer"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        zIndex: 'var(--z-particles, 0)',
        overflow: 'hidden',
      }}
    />
  );
}
