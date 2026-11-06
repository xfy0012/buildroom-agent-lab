'use client';
import { useState } from 'react';
import { agents, runWorkflow, type Scenario, type WorkflowState } from '../lib/workflow';
export default function Home() {
    const [brief, setBrief] = useState('A cosy reading corner with storage');
    const [budget, setBudget] = useState(200);
    const [scenario, setScenario] = useState<Scenario>('success');
    const [result, setResult] = useState<WorkflowState>();
    const [selected, setSelected] = useState(0);
    const [filter, setFilter] = useState('All agents');
    const [error, setError] = useState('');
    const event = result?.trace[selected];
    return <main>
    <header><a href="/" className="brand">▦ BUILDROOM <span>AGENT LAB / 01</span></a><span className="local">● Local simulation</span></header>
    <section className="intro"><p className="eyebrow">FOUR AGENTS. ONE SHARED STATE.</p><h1>See the thinking.<br /><em>Trace the workflow.</em></h1><p>A small room-planning playground for exploring deterministic orchestration, recovery, and safe termination.</p></section>
    <div className="workspace"><section className="panel"><p className="eyebrow">01 / CONFIGURE</p><h2>Your room brief</h2><form onSubmit={e => { e.preventDefault(); try {
        const next = runWorkflow(brief, budget, { scenario });
        setResult(next);
        setSelected(0);
        setFilter('All agents');
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    } }}>
      <label htmlFor="brief">What are we creating?</label><textarea id="brief" required maxLength={500} value={brief} onChange={e => setBrief(e.target.value)}/>
      <label htmlFor="budget">Budget · GBP</label><input id="budget" type="number" min="0" max="10000" required value={budget} onChange={e => setBudget(Number(e.target.value))}/>
      <label htmlFor="scenario">Simulation scenario</label><select id="scenario" value={scenario} onChange={e => setScenario(e.target.value as Scenario)}><option value="success">Successful execution</option><option value="transient-failure">Recoverable tool failure</option><option value="tool-failure">Persistent tool failure</option><option value="repeated-search">Repeated search</option><option value="termination-limit">Termination limit</option></select>
      <button className="primary" type="submit">Run workflow <span>↗</span></button>{error && <p role="alert">{error}</p>}
    </form><p className="note">FakeLLMProvider + mock IKEA UK catalogue.<br />No API keys, network calls, or paid services.</p></section>
    <section className="panel trace"><div className="panel-top"><div><p className="eyebrow">02 / OBSERVE</p><h2>Agent Trace Viewer</h2></div><span role="status" className="badge">{result?.status ?? 'Ready'}</span></div>
      <div className="pipeline">{agents.map((a, i) => <div key={a} className={result?.trace.some(t => t.agent === a) ? 'visited' : ''}><small>0{i + 1}</small>{a}</div>)}</div>
      {!result ? <div className="empty"><span>◎</span><h3>A clear path, from brief to room.</h3><p>Run a scenario to inspect agent decisions and shared state.</p></div> : <>
        <div className="trace-tools"><p>{result.steps} steps · {result.searches.length} searches</p><label>Filter agent<select value={filter} onChange={e => setFilter(e.target.value)}><option>All agents</option>{agents.map(a => <option key={a}>{a}</option>)}</select></label></div>
        {result.reason && <p className="reason">{result.reason}</p>}
        <div className="trace-body"><ol aria-label="Trace events">{result.trace.map((t, i) => (filter === 'All agents' || filter === t.agent) && <li key={t.id}><button className={i === selected ? 'event active' : 'event'} aria-pressed={i === selected} onClick={() => setSelected(i)}><span className="event-title">{t.id.toString().padStart(2, '0')} · {t.agent}<small>{t.kind}</small></span><span>{t.message}</span></button></li>)}</ol><div className="inspector"><h3>State after event {event?.id}</h3><pre aria-label="Shared state">{JSON.stringify(event?.snapshot, null, 2)}</pre></div></div>
        <details><summary>Full workflow JSON</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
      </>}
    </section></div>
    {result?.render && <section className="panel outcome"><div><p className="eyebrow">03 / RESULT</p><h2>{result.render.title}</h2><p>Illustrative plan · £{result.render.totalGBP} total</p></div><div className="products">{result.selected.map(p => <article key={p.id}><small>{p.category}</small><h3>{p.name}</h3><p>£{p.priceGBP}</p></article>)}{!result.selected.length && <p>No mock products fit this budget.</p>}</div></section>}
    <footer><span>Built to be inspected.</span><span>Mock prices and products. Not affiliated with IKEA.</span></footer>
  </main>;
}
