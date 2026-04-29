import React, { useEffect, useState } from 'react';

type Repo = {
  id: string;
  name: string;
  orbPosition: [number, number, number];
  orbSize: number;
  githubUrl?: string;
};

export default function App(){
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Repo | null>(null);

  useEffect(() => {
    fetch('/manifest.json')
      .then(res => res.json())
      .then((m) => {
        const items = m.repos || [];
        // map to a simple 3D-ish 2D projection using the provided orbPosition for display
        const list = items.map((r: any) => ({
          id: r.id,
          name: r.name,
          orbPosition: r.orbPosition ?? [0,0,0],
          orbSize: r.orbSize ?? 0.8,
        })) as Repo[];
        // ensure we have at least 6 for a nicer screen
        if (list.length < 6) {
          while (list.length < 6) list.push({ id: `seed-${list.length}`, name: `Seed ${list.length+1}`, orbPosition: [list.length*1.2, 0, 0], orbSize: 0.8 });
        }
        setRepos(list);
      })
      .catch(() => {
        // fallback mock data
        const mock: Repo[] = [
          { id: 'zustand', name: 'zustand', orbPosition: [0,0,0], orbSize:0.8, githubUrl:''},
          { id:'react', name:'react', orbPosition:[2,0,0], orbSize:0.8, githubUrl:''},
          { id:'material-ui', name:'material-ui', orbPosition:[4,0,0], orbSize:0.9, githubUrl:''}
        ];
        setRepos(mock);
      });
  }, []);

  return (
    <div style={{ width:'100%', height:'100%', background:'#000', color:'#fff' }}>
      <header style={{padding:20, fontFamily:'var(--font-display)'}}>OpenClaw 3D Explorer Scaffold</header>
      <main style={{ padding: 20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, 100px)', gap:20 }}>
          {repos.map((r) => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ width:100, height:100, borderRadius:'50%', border:'1px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <span style={{ fontSize:12, textAlign:'center', color:'#fff' }}>{r.name}</span>
            </div>
          ))}
        </div>
      </main>
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:600, height:300, background:'#111', border:'1px solid #333', borderRadius:8, padding:20 }}>
            <h3 style={{marginTop:0}}>{selected.name}</h3>
            <p>Live preview and source panel will render here in MVP.</p>
            <button onClick={()=>setSelected(null)} style={{ marginTop:12, padding:'6px 12px', borderRadius:999, border:'1px solid #fff', background:'#000', color:'#fff' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
