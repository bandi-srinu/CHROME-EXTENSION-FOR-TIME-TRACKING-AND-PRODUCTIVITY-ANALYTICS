import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function fmt(sec){
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
  return `${h}h ${m}m`;
}

export default function App() {
  const [data,setData] = useState(null);
  const [days,setDays] = useState(7);

  async function load() {
    const res = await fetch(`${BACKEND}/summary?days=${days}`);
    const json = await res.json();
    setData(json);
  }
  useEffect(() => { load(); }, [days]);

  if (!data) return <div style={{padding:24}}>Loading…</div>;

  return (
    <div style={{maxWidth:900, margin:'24px auto', fontFamily:'system-ui, Arial'}}>
      <h1>Weekly Productivity</h1>
      <div style={{display:'flex', gap:12, alignItems:'center', margin:'12px 0'}}>
        <label>Range:</label>
        <select value={days} onChange={e=>setDays(+e.target.value)}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
        <button onClick={load}>Refresh</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
        <Stat title="Total" value={fmt(data.totalSeconds)} />
        <Stat title="Productive" value={fmt(data.productiveSeconds)} />
        <Stat title="Unproductive" value={fmt(data.unproductiveSeconds)} />
      </div>

      <h2 style={{marginTop:24}}>By Domain</h2>
      <table width="100%" cellPadding="8" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f4f4f4'}}>
            <th align="left">Domain</th>
            <th align="left">Type</th>
            <th align="right">Time</th>
            <th align="right">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(row => (
            <tr key={row.domain} style={{borderBottom:'1px solid #eee'}}>
              <td>{row.domain}</td>
              <td>{row.type}</td>
              <td align="right">{fmt(row.seconds)}</td>
              <td align="right">{row.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{color:'#666', marginTop:12}}>Tip: change classifications from the extension popup/options.</p>
    </div>
  );
}

function Stat({title, value}) {
  return (
    <div style={{padding:16, border:'1px solid #eee', borderRadius:12}}>
      <div style={{color:'#666', fontSize:14}}>{title}</div>
      <div style={{fontSize:24, fontWeight:600}}>{value}</div>
    </div>
  );
}
