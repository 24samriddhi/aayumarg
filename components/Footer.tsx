import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { SITE, phoneHref } from "@/lib/site";

/** lucide-react v1 no longer ships brand icons, so Instagram is an inline SVG. */
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const tel = phoneHref(SITE.phone);

  return (
    <footer className="site-footer">
      {/* 1 column on phones -> 2 on tablets -> 3 on laptops (see .footer-grid) */}
      <div className="footer-grid">
        <div className="footer-col footer-about">
          <b className="footer-title">{SITE.name}</b>
          <p>
            A calm digital space for families to book OPD consultations and keep
            profiles, health vitals and medical records in one place.
          </p>
        </div>

        <nav className="footer-col" aria-label="Footer">
          <b className="footer-title">Quick links</b>
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/booking">Healthcare Booking</Link>
        </nav>

        <div className="footer-col" id="contact">
          <b className="footer-title">Contact us</b>

          {tel ? (
            <a href={tel}>
              <Phone size={16} /> {SITE.phone}
            </a>
          ) : (
            <span className="footer-line">
              <Phone size={16} /> {SITE.phone}
            </span>
          )}

          <a href={`mailto:${SITE.email}`}>
            <Mail size={16} /> {SITE.email}
          </a>

          <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
            <InstagramIcon /> Instagram {SITE.instagramHandle}
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} {SITE.name} · {SITE.tagline}
      </div>
    </footer>
  );
}
