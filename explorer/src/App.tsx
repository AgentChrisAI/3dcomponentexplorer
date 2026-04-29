import React, { useEffect, useState, useCallback } from 'react';
import OrbScene from './scene/OrbScene';
import ComponentPanel from './components/ComponentPanel';
import SearchBar from './components/SearchBar';
import HUD from './components/HUD';

interface Manifest {
  totalRepos: number;
  totalComponents: number;
  repos: any[];
  searchIndex: any[];
}

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    fetch('/manifest.json')
      .then(r => r.json())
      .then(setManifest)
      .catch(e => console.error('Failed to load manifest:', e));
  }, []);

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSelectedRepo(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeRepoIds = activeCategory
    ? manifest?.repos.filter((r: any) => r.category === activeCategory).map((r: any) => r.id)
    : undefined;

  const onSearchSelect = useCallback((repoId: string, _componentId: string) => {
    const repo = manifest?.repos.find((r: any) => r.id === repoId);
    if (repo) setSelectedRepo(repo);
  }, [manifest]);

  if (!manifest) {
    return (
      <div style={{ width:'100%', height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontFamily:'var(--font-display)' }}>
        Loading manifest...
      </div>
    );
  }

  return (
    <div style={{ width:'100%', height:'100vh', overflow:'hidden', background:'#000' }}>
      <OrbScene
        repos={manifest.repos}
        onOrbClick={setSelectedRepo}
        activeRepoIds={activeRepoIds}
      />
      <HUD
        totalRepos={manifest.totalRepos}
        totalComponents={manifest.totalComponents}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onSearchOpen={() => setSearchOpen(true)}
      />
      {selectedRepo && (
        <ComponentPanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
      )}
      {searchOpen && (
        <SearchBar
          searchIndex={manifest.searchIndex}
          onSelect={onSearchSelect}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
