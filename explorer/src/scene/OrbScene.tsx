import React, { useRef, useMemo } from 'react';
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

  const callbacks = useMemo(() => ({
    onOrbClick,
    onOrbHover: () => {},
    activeRepoIds,
  }), [onOrbClick, activeRepoIds]);

  useWebGL(canvasRef, repos, callbacks);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#000', cursor: 'grab' }}
    />
  );
}
