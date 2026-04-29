import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useWebGL } from './useWebGL';

interface Repo {
  id: string;
  name: string;
  orbPosition: [number, number, number];
  orbSize: number;
  category: string;
  components: any[];
}

interface OrbSceneProps {
  repos: Repo[];
  onOrbClick: (repo: Repo) => void;
  activeRepoIds?: string[];
}

export default function OrbScene({ repos, onOrbClick, activeRepoIds }: OrbSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<Repo | null>(null);
  const [labelPos, setLabelPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const callbacks = useMemo(() => ({
    onOrbClick,
    onOrbHover: (repo: Repo | null) => setHovered(repo),
    activeRepoIds,
  }), [onOrbClick, activeRepoIds]);

  useWebGL(canvasRef, repos, callbacks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      setLabelPos({ x: e.clientX, y: e.clientY - 40 });
    };
    canvas.addEventListener('mousemove', onMove);
    return () => canvas.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', background: '#000', cursor: hovered ? 'pointer' : 'grab' }}
      />
      {hovered && (
        <div style={{
          position: 'fixed',
          left: labelPos.x,
          top: labelPos.y,
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 60,
          transition: 'opacity 200ms ease',
        }}>
          {hovered.name}
        </div>
      )}
    </div>
  );
}
