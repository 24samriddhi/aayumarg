'use client'
import AppNav from '../../components/AppNav'
import Footer from '../../components/Footer'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useBooking } from '../../lib/hooks/useBooking'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BookingCategories from '../../components/BookingCategories'
import UpiPayPanel from '../../components/UpiPayPanel'
import { useFamily } from '../../lib/family/FamilyContext'
import { bookingLabel } from '../../lib/categories'
import type { Booking, CategoryId } from '../../lib/types'

const initial = (): Booking => ({
  service: 'Doctor Consultation',
  date: new Date().toISOString().slice(0, 10),
  time: '10:00',
  reason: 'Routine checkup',
  status: 'Confirmed',
})

const CAT_IDS: CategoryId[] = ['elderly', 'second-opinion', 'mental-health', 'sexual-health']

function BookingPage() {
  const params = useSearchParams()
  const q = params.get('category') as CategoryId | null
  const initialCategory = q && CAT_IDS.includes(q) ? q : null
  const { active } = useFamily()
  const { booking, status, error, reload, book, saving, saveError } = useBooking()
  const [b, setB] = useState<Booking>(initial)
  const [saved, setSaved] = useState(false)
  const [showPay, setShowPay] = useState(false)

  useEffect(() => {
    if (status === 'success' && booking) setB(booking)
  }, [status, booking])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2200)
    return () => clearTimeout(t)
  }, [saved])

  const u = (k: keyof Booking, v: string) => setB({ ...b, [k]: v })
  const save = async () => {
    const created = await book({ ...b, patientId: active.id, patientName: active.name })
    if (!created) return
    if (created.paymentStatus === 'unpaid') setShowPay(true)
    else setSaved(true)
  }

  return (
    <>
      <AppNav />
      <main className="main">
        <div className="eyebrow">Care services</div>
        <h1 className="h1">Healthcare Booking</h1>
        <p className="sub">
          Choose a care category to book an OPD visit, or use the quick form below.
        </p>

        <div style={{ marginTop: 24 }}>
          <BookingCategories book={book} saving={saving} saveError={saveError} initialCategory={initialCategory} onBooked={reload} />
        </div>

        <div className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card">
            <div className="icon-box"><CalendarDays size={20} /></div>
            <div className="section-head"><h2>Book healthcare service</h2></div>
            <div className="form">
              <div className="field">
                <label htmlFor="b-service">Select service</label>
                <select id="b-service" value={b.service} onChange={e => u('service', e.target.value)}>
                  <option>Doctor Consultation</option>
                  <option>Nurse Visit</option>
                  <option>Healthcare Assistant</option>
                  <option>Routine Checkup</option>
                </select>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="b-date">Date</label>
                  <input id="b-date" type="date" value={b.date} onChange={e => u('date', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="b-time">Time</label>
                  <input id="b-time" type="time" value={b.time} onChange={e => u('time', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="b-reason">Reason</label>
                <textarea id="b-reason" value={b.reason} onChange={e => u('reason', e.target.value)} placeholder="Reason for visit" />
              </div>
              {saveError && <div className="error-state" role="alert">{saveError}</div>}
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Booking…' : 'Book now'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Your latest booking</div>
            <div style={{ marginTop: 18 }}>
              {status === 'loading' && <LoadingState rows={4} />}
              {status === 'error' && <ErrorState message={error ?? 'Could not load your booking.'} onRetry={reload} />}
              {status === 'success' && (booking ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <CheckCircle2 color={booking.status === 'Confirmed' ? 'var(--success)' : 'var(--muted)'} aria-hidden="true" />
                  <div>
                    <b>{booking.status === 'Confirmed' ? 'Booking confirmed' : booking.paymentStatus === 'submitted' ? 'Payment under verification' : 'Payment pending'}</b>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {booking.ref && <>Ref: {booking.ref}<br /></>}
                      Service: {bookingLabel(booking)}<br />
                      {booking.patientName && <>For: {booking.patientName}<br /></>}
                      Date: {booking.date}<br />
                      Time: {booking.time}<br />
                      {booking.amount ? <>Fee: ₹{booking.amount}<br /></> : null}
                      Status: {booking.status}
                    </div>
                    {booking.paymentStatus === 'unpaid' && (showPay ? (
                      <div style={{ marginTop: 14 }}>
                        <UpiPayPanel booking={booking} onSubmitted={() => { setShowPay(false); reload() }} />
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowPay(true)}>
                        {`Pay ₹${booking.amount ?? ''} now`}
                      </button>
                    ))}
                    {booking.paymentStatus === 'submitted' && (
                      <div className="muted" style={{ marginTop: 10 }}>We have your payment details. The doctor will confirm shortly.</div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState>No booking yet. Fill the form and press “Book now”.</EmptyState>
              ))}
            </div>
          </div>
        </div>

        {saved && <div className="toast" role="status">Booking confirmed.</div>}
        <Footer />
      </main>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookingPage />
    </Suspense>
  )
}
