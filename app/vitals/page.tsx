'use client'
import AppNav from '../../components/AppNav'
import Footer from '../../components/Footer'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useVitals } from '../../lib/hooks/useVitals'
import { HeartPulse, Save, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Vital } from '../../lib/types'

const today = () => new Date().toISOString().slice(0, 10)

export default function Page() {
  const { vitals, status, error, reload, add, saving, saveError } = useVitals()
  const [form, setForm] = useState<Vital>({
    date: today(), bp: '120/80', hr: '72', spo2: '98', temp: '98.6', sugar: '95', weight: '65',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 1800)
    return () => clearTimeout(t)
  }, [saved])

  const u = (k: keyof Vital, v: string) => setForm({ ...form, [k]: v })
  const save = async () => { if (await add(form)) setSaved(true) }

  return (
    <>
      <AppNav />
      <main className="main">
        <div className="eyebrow">Health snapshot</div>
        <h1 className="h1">Vitals Vault</h1>
        <p className="sub">
          Enter a quick set of vitals and keep the latest values visible.
          This is not a medical decision tool.
        </p>

        <div className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card">
            <div className="icon-box"><HeartPulse size={20} /></div>
            <div className="section-head"><h2>New reading</h2></div>
            <div className="form">
              <div className="field">
                <label htmlFor="v-date">Date</label>
                <input id="v-date" type="date" value={form.date} onChange={e => u('date', e.target.value)} />
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="v-bp">Blood pressure</label>
                  <input id="v-bp" value={form.bp} onChange={e => u('bp', e.target.value)} placeholder="120/80" />
                </div>
                <div className="field">
                  <label htmlFor="v-hr">Heart rate (bpm)</label>
                  <input id="v-hr" value={form.hr} onChange={e => u('hr', e.target.value)} placeholder="72" />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="v-spo2">SpO₂ (%)</label>
                  <input id="v-spo2" value={form.spo2} onChange={e => u('spo2', e.target.value)} placeholder="98" />
                </div>
                <div className="field">
                  <label htmlFor="v-temp">Temperature (°F)</label>
                  <input id="v-temp" value={form.temp} onChange={e => u('temp', e.target.value)} placeholder="98.6" />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="v-sugar">Blood sugar (mg/dL)</label>
                  <input id="v-sugar" value={form.sugar} onChange={e => u('sugar', e.target.value)} placeholder="95" />
                </div>
                <div className="field">
                  <label htmlFor="v-weight">Weight (kg)</label>
                  <input id="v-weight" value={form.weight} onChange={e => u('weight', e.target.value)} placeholder="65" />
                </div>
              </div>
              {saveError && <div className="error-state" role="alert">{saveError}</div>}
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                <Save size={17} />
                {saving ? 'Saving…' : 'Save reading'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Latest vitals</div>
            <div className="muted" style={{ margin: '4px 0 14px' }}>Most recent readings first</div>
            {status === 'loading' && <LoadingState rows={4} />}
            {status === 'error' && <ErrorState message={error ?? 'Could not load your vitals.'} onRetry={reload} />}
            {status === 'success' && (vitals.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>BP</th><th>HR</th><th>SpO₂</th></tr>
                  </thead>
                  <tbody>
                    {vitals.map((r, i) => (
                      <tr key={r.id ?? `${r.date}-${i}`}>
                        <td>{r.date}</td><td>{r.bp}</td><td>{r.hr}</td><td>{r.spo2}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No readings yet. Save your first set on the left.</EmptyState>
            ))}
          </div>
        </div>

        {saved && <div className="toast" role="status">Vitals saved.</div>}

        <div className="card" style={{ marginTop: 18, background: 'var(--gold-soft)' }}>
          <b><Plus size={16} style={{ verticalAlign: '-3px' }} /> Note:</b>
          <span className="muted"> trends, timestamps and alerts will be added once the backend is connected.</span>
        </div>
        <Footer />
      </main>
    </>
  )
}
