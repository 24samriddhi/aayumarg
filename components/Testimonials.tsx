import { Lock, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/testimonials";

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

interface Props {
  /** Show only the first N stories (e.g. 3 on the dashboard). */
  limit?: number;
  title?: string;
}

export default function Testimonials({ limit, title = "What families say about us" }: Props) {
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;

  return (
    <section aria-label={title}>
      <div className="section-head" style={{ marginTop: 40 }}>
        <div>
          <div className="eyebrow">Testimonials</div>
          <h2>{title}</h2>
        </div>
      </div>

      {/* 1 col phone -> 2 col tablet -> 3 col laptop */}
      <div className="testimonial-grid">
        {items.map((t) => (
          <figure key={t.id} className="testimonial-card glass">
            <div className="testimonial-stars" role="img" aria-label={`${t.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={15}
                  fill={n <= t.rating ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              ))}
            </div>

            <blockquote lang={t.lang}>{t.quote}</blockquote>

            <figcaption>
              <span className="testimonial-avatar" aria-hidden="true">
                {t.anonymous ? <Lock size={15} /> : initials(t.name)}
              </span>
              <span className="testimonial-who">
                <b lang={t.lang}>{t.name}</b>
                <small>{t.meta}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
