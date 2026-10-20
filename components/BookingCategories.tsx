"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, FileUp, Lock, X, CalendarDays } from "lucide-react";
import { CATEGORIES, type CareCategory } from "@/lib/categories";
import { useFamily } from "@/lib/family/FamilyContext";
import { uploadDocuments } from "@/lib/services/documents.service";
import { getFees } from "@/lib/services/pricing.service";
import UpiPayPanel from "@/components/UpiPayPanel";
import type { Booking, CategoryId } from "@/lib/types";

const MAX_BYTES = 4 * 1024 * 1024; // matches the server limit (Vercel rejects bigger uploads)
const OK_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface Props {
  book: (b: Booking) => Promise<Booking | null>;
  saving: boolean;
  saveError: string | null;
  /** Open a category on mount (e.g. from ?category=). */
  initialCategory?: CategoryId | null;
  onBooked?: () => void;
}

export default function BookingCategories({ book, saving, saveError, initialCategory, onBooked }: Props) {
  const [open, setOpen] = useState<CareCategory | null>(null);

  useEffect(() => {
    if (initialCategory) setOpen(CATEGORIES.find((c) => c.id === initialCategory) ?? null);
  }, [initialCategory]);

  return (
    <>
      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="category-card glass" onClick={() => setOpen(c)}>
            <span className="category-photo">
              <Image src={c.image} alt="" fill sizes="(max-width: 559px) 100vw, (max-width: 1279px) 50vw, 25vw" style={{ objectFit: "cover", objectPosition: c.position }} />
              {c.badge && <span className="category-badge"><Lock size={11} /> {c.badge}</span>}
            </span>
            <span className="category-body">
              <b>{c.title}</b>
              <span className="muted">{c.blurb}</span>
              <span className="category-cta"><CalendarDays size={14} /> Book OPD</span>
            </span>
          </button>
        ))}
      </div>

      {open && (
        <OpdModal
          category={open} book={book} saving={saving} saveError={saveError}
          onClose={() => setOpen(null)} onBooked={onBooked}
        />
      )}
    </>
  );
}

function OpdModal({
  category, book, saving, saveError, onClose, onBooked,
}: { category: CareCategory; book: Props["book"]; saving: boolean; saveError: string | null; onClose: () => void; onBooked?: () => void }) {
  const { active } = useFamily();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [payBooking, setPayBooking] = useState<Booking | null>(null);
  const [awaitingDoctor, setAwaitingDoctor] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null); // rupees; null = free / unknown / mock mode
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    getFees().then((f) => { if (alive) setFee(f[category.id] ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [category.id]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: File[] = [];
    let err: string | null = null;
    for (const f of Array.from(list)) {
      if (!OK_TYPES.includes(f.type)) err = `“${f.name}” is not a PDF, JPG, PNG or WebP file.`;
      else if (f.size > MAX_BYTES) err = `“${f.name}” is larger than 4 MB.`;
      else next.push(f);
    }
    setFileError(err);
    setFiles((prev) => [...prev, ...next].slice(0, 6));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      if (files.length) await uploadDocuments(files);
    } catch (err) {
      setLocalError((err as Error).message || "Could not upload your files. Please try again.");
      return;
    }
    const created = await book({
      service: category.service, category: category.id,
      date, time, reason: reason.trim() || "OPD consultation", status: "Confirmed",
      patientId: active.id, patientName: active.name,
      attachments: files.map((f) => f.name),
    });
    if (created) {
      if (created.paymentStatus === "unpaid" && created.id) setPayBooking(created);
      else setDone(true);
      onBooked?.();
    }
  }

  const err = localError || saveError;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-labelledby="opd-title" tabIndex={-1} ref={dialogRef}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">OPD booking</div>
            <h2 id="opd-title" style={{ margin: "6px 0 0" }}>{category.title}</h2>
            {category.badge && <span className="category-badge inline"><Lock size={11} /> {category.badge}</span>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {payBooking ? (
          <UpiPayPanel booking={payBooking} onSubmitted={() => { setPayBooking(null); setAwaitingDoctor(true); setDone(true); onBooked?.(); }} />
        ) : done ? (
          <div className="modal-done">
            <b>{awaitingDoctor ? `Payment submitted for ${active.name}.` : `Booking confirmed for ${active.name}.`}</b>
            <p className="muted">
              {awaitingDoctor ? "The doctor will confirm your booking once the payment is seen." : category.confidential ? "It appears as a confidential consultation on your dashboard." : `${category.service} on ${date} at ${time}.`}
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="form" onSubmit={submit}>
            <p className="muted" style={{ margin: 0 }}>Booking for <b>{active.name}</b>. Change the family member from the top bar.</p>
            <div className="row">
              <div className="field">
                <label htmlFor="o-date">Date</label>
                <input id="o-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="o-time">Time</label>
                <input id="o-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="o-reason">What would you like help with?</label>
              <textarea id="o-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional — a short note for the doctor" />
            </div>

            <div className="field">
              <label>Reports or photos (optional)</label>
              <div className="upload-actions">
                <label className="btn btn-secondary upload-btn">
                  <FileUp size={15} /> Upload files
                  <input type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" hidden
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                <label className="btn btn-secondary upload-btn">
                  <Camera size={15} /> Take photo
                  <input type="file" accept="image/*" capture="environment" hidden
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              </div>
              {fileError && <div className="muted" role="alert" style={{ color: "var(--error)" }}>{fileError}</div>}
              {files.length > 0 && (
                <ul className="file-chips">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      <span>{f.name}</span>
                      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={13} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <small className="muted">PDF, JPG, PNG or WebP · up to 4 MB each · max 6 files</small>
            </div>

            {err && <div className="error-state" role="alert">{err}</div>}
            {fee ? (
              <small className="muted">Consultation fee ₹{fee}. You pay by UPI on the next step.</small>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Please wait…" : fee ? `Continue to pay ₹${fee}` : "Confirm booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
