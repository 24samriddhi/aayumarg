'use client'
import AppNav from '../../components/AppNav'
import Footer from '../../components/Footer'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useDocuments } from '../../lib/hooks/useDocuments'
import { FileText, Upload, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Page() {
  const { documents, status, error, reload, upload, remove, busy, actionError } = useDocuments()
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 2200)
    return () => clearTimeout(t)
  }, [notice])

  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (await upload(files)) setNotice(`${files.length} file(s) added.`)
  }

  return (
    <>
      <AppNav />
      <main className="main">
        <div className="eyebrow">Medical records</div>
        <h1 className="h1">Document upload</h1>
        <p className="sub">
          Add PDF, JPG or PNG records. In demo mode only file names are kept (no OCR and no
          server upload yet).
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <label className="drop">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              onChange={add}
              disabled={busy}
              hidden
            />
            <Upload size={28} style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 800 }}>{busy ? 'Working…' : 'Upload document'}</div>
            <div className="muted">PDF · JPG · PNG</div>
          </label>

          {actionError && <div className="error-state" role="alert" style={{ marginTop: 14 }}>{actionError}</div>}

          <div className="list" style={{ marginTop: 18 }}>
            {status === 'loading' && <LoadingState rows={3} />}
            {status === 'error' && <ErrorState message={error ?? 'Could not load your documents.'} onRetry={reload} />}
            {status === 'success' && (documents.length ? (
              documents.map(d => (
                <div className="list-item" key={d.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-box"><FileText size={18} /></div>
                    <div>
                      <b>{d.name}</b>
                      <div className="muted">{(d.size / 1024).toFixed(0)} KB · {d.date}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => remove(d.id)}
                    disabled={busy}
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState>No documents yet. Upload a prescription, blood test or report.</EmptyState>
            ))}
          </div>
        </div>

        {notice && <div className="toast" role="status">{notice}</div>}
        <Footer />
      </main>
    </>
  )
}
