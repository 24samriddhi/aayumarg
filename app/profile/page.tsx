'use client'
import AppNav from '../../components/AppNav'
import Footer from '../../components/Footer'
import { ErrorState, LoadingState } from '../../components/States'
import { useProfile } from '../../lib/hooks/useProfile'
import { useUser } from '@clerk/nextjs'
import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Profile } from '../../lib/types'

const blank: Profile = {
  name: '', age: '', gender: '', phone: '', emergency: '', address: '',
  type: 'Elderly', caregiverName: '', caregiverPhone: '',
}

export default function Page() {
  const { user } = useUser()
  const { profile, status, error, reload, save, saving, saveError } = useProfile()
  const [p, setP] = useState<Profile>(blank)
  const [saved, setSaved] = useState(false)

  // Fill the form once the profile has loaded (or default the name from Clerk).
  useEffect(() => {
    if (status !== 'success') return
    setP(profile ?? { ...blank, name: user?.fullName || user?.firstName || '' })
  }, [status, profile, user?.fullName, user?.firstName])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 1800)
    return () => clearTimeout(t)
  }, [saved])

  const update = (k: keyof Profile, v: string) => setP({ ...p, [k]: v })
  const onSave = async () => { if (await save(p)) setSaved(true) }

  return (
    <>
      <AppNav />
      <main className="main">
        <div className="eyebrow">Account &amp; care details</div>
        <h1 className="h1">User registration &amp; profile</h1>
        <p className="sub">
          Keep the essential information simple. Your details are stored through the AayuMarg
          service layer (demo mode keeps them in this browser only).
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          {status === 'loading' && <LoadingState rows={5} />}
          {status === 'error' && <ErrorState message={error ?? 'Could not load your profile.'} onRetry={reload} />}
          {status === 'success' && (
            <div className="form">
              <div className="row">
                <div className="field">
                  <label htmlFor="pf-name">Name</label>
                  <input id="pf-name" value={p.name} onChange={e => update('name', e.target.value)} placeholder="Full name" />
                </div>
                <div className="field">
                  <label htmlFor="pf-age">Age</label>
                  <input id="pf-age" type="number" value={p.age} onChange={e => update('age', e.target.value)} placeholder="Age" />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label htmlFor="pf-gender">Gender</label>
                  <select id="pf-gender" value={p.gender} onChange={e => update('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-phone">Phone</label>
                  <input id="pf-phone" value={p.phone} onChange={e => update('phone', e.target.value)} placeholder="Phone number" />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label htmlFor="pf-emergency">Emergency contact</label>
                  <input id="pf-emergency" value={p.emergency} onChange={e => update('emergency', e.target.value)} placeholder="Name + phone" />
                </div>
                <div className="field">
                  <label htmlFor="pf-type">User type</label>
                  <select id="pf-type" value={p.type} onChange={e => update('type', e.target.value as Profile['type'])}>
                    <option>Elderly</option>
                    <option>General Public</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="pf-address">Address</label>
                <textarea id="pf-address" value={p.address} onChange={e => update('address', e.target.value)} placeholder="Home address" />
              </div>

              {p.type === 'Elderly' && (
                <div className="card" style={{ background: 'var(--card-soft)' }}>
                  <div className="card-title">Elderly-specific</div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <div className="field">
                      <label htmlFor="pf-cg-name">Family / caregiver name</label>
                      <input id="pf-cg-name" value={p.caregiverName} onChange={e => update('caregiverName', e.target.value)} placeholder="Caregiver name" />
                    </div>
                    <div className="field">
                      <label htmlFor="pf-cg-phone">Family / caregiver phone</label>
                      <input id="pf-cg-phone" value={p.caregiverPhone} onChange={e => update('caregiverPhone', e.target.value)} placeholder="Caregiver phone" />
                    </div>
                  </div>
                </div>
              )}

              {saveError && <div className="error-state" role="alert">{saveError}</div>}

              <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                <Save size={17} />
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          )}
        </div>

        {saved && <div className="toast" role="status">Profile saved.</div>}
        <Footer />
      </main>
    </>
  )
}
