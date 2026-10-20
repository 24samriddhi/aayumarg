'use client'
import Link from 'next/link'
import AppNav from '../../components/AppNav'
import Footer from '../../components/Footer'
import Testimonials from '../../components/Testimonials'
import { useDocuments } from '../../lib/hooks/useDocuments'
import { useBooking } from '../../lib/hooks/useBooking'
import { useVitals } from '../../lib/hooks/useVitals'
import { CalendarDays, FileUp, HeartPulse, ShieldCheck, UserRound, ArrowRight } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import BookingCategories from '../../components/BookingCategories'
import { useFamily } from '../../lib/family/FamilyContext'
import { bookingLabel } from '../../lib/categories'

export default function Dashboard() {
  const { user } = useUser()
  const { documents, status: docStatus } = useDocuments()
  const { booking, book, saving, saveError, reload } = useBooking()
  const { active } = useFamily()
  const { vitals } = useVitals()

  const latest = vitals[0]
  const bookedText = booking
    ? `${bookingLabel(booking)}${booking.patientName ? ` for ${booking.patientName}` : ''} · ${booking.date} · ${booking.time}${booking.status === 'Awaiting payment' ? ' · payment pending' : booking.status === 'Payment submitted' ? ' · payment under verification' : ''}`
    : 'No upcoming booking'

  return (
    <>
      <AppNav />
      <main className="main">
        <div className="hero">
          <div>
            <div className="eyebrow">Your care workspace</div>
            <h1 className="h1">Good to see you, {user?.firstName || 'there'}.</h1>
            <p className="sub">
              Your AayuMarg space for family-led care: profile, health vitals, medical
              records and service booking in one calm place. Viewing care for <b>{active.name}</b>.
            </p>
          </div>
          <Link href="/booking" className="btn btn-primary">
            <CalendarDays size={17} />
            Book care
          </Link>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <div className="icon-box"><HeartPulse size={20} /></div>
            <div className="card-title" style={{ marginTop: 16 }}>Vitals Vault</div>
            <div className="muted">Latest reading</div>
            {latest ? (
              <div className="metric">{latest.bp} <small>mmHg</small></div>
            ) : (
              <div className="muted" style={{ marginTop: 14 }}>
                No readings yet — <Link href="/vitals" style={{ color: 'var(--primary)', fontWeight: 700 }}>add one</Link>
              </div>
            )}
          </div>

          <div className="card">
            <div className="icon-box"><FileUp size={20} /></div>
            <div className="card-title" style={{ marginTop: 16 }}>Medical Records</div>
            <div className="muted">Files saved</div>
            <div className="metric">
              {docStatus === 'success' ? documents.length : '–'}
              <small> documents</small>
            </div>
          </div>

          <div className="card">
            <div className="icon-box"><ShieldCheck size={20} /></div>
            <div className="card-title" style={{ marginTop: 16 }}>Care connection</div>
            <div className="muted">Authentication</div>
            <div className="metric" style={{ fontSize: 17, marginTop: 16 }}>Account Security: Active &amp; Verified</div>
          </div>
        </div>

        <div className="section-head">
          <h2>Book an OPD visit</h2>
        </div>
        <BookingCategories book={book} saving={saving} saveError={saveError} onBooked={reload} />

        <div className="section-head">
          <h2>Today&apos;s care overview</h2>
          <Link href="/profile" className="btn btn-secondary">
            Open profile <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Upcoming healthcare booking</div>
            <div className="muted" style={{ margin: '6px 0 16px' }}>{bookedText}</div>
            <Link href="/booking" className="btn btn-gold">Manage booking</Link>
          </div>

          <div className="card">
            <div className="card-title">Quick actions</div>
            <div className="list">
              <Link href="/vitals" className="list-item">
                <span><HeartPulse size={17} /> <b>Update vitals</b></span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/documents" className="list-item">
                <span><FileUp size={17} /> <b>Upload a medical record</b></span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/profile" className="list-item">
                <span><UserRound size={17} /> <b>Complete family details</b></span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <Testimonials limit={3} />

        <Footer />
      </main>
    </>
  )
}
