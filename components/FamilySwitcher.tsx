"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, UsersRound } from "lucide-react";
import { useFamily } from "@/lib/family/FamilyContext";

export default function FamilySwitcher() {
  const { members, active, setActive, addMember } = useFamily();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addMember(name, relation);
    setName(""); setRelation(""); setAdding(false); setOpen(false);
  }

  return (
    <div className="family-switcher" ref={ref}>
      <button
        type="button" className="family-trigger" aria-haspopup="listbox" aria-expanded={open}
        aria-label={`Family care: ${active.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <UsersRound size={15} />
        <span className="family-trigger-text">
          <small>Family care</small>
          <b>{active.name}</b>
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="family-menu glass" role="listbox" aria-label="Switch family member">
          {members.map((m) => (
            <button
              key={m.id} type="button" role="option" aria-selected={m.id === active.id}
              className={`family-option ${m.id === active.id ? "active" : ""}`}
              onClick={() => { setActive(m.id); setOpen(false); }}
            >
              <span className="family-avatar">{m.name.charAt(0).toUpperCase()}</span>
              <span className="family-option-text"><b>{m.name}</b><small>{m.relation}</small></span>
              {m.id === active.id && <Check size={15} />}
            </button>
          ))}

          {adding ? (
            <form className="family-add" onSubmit={submit}>
              <input autoFocus placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Family member name" />
              <input placeholder="Relation (e.g. Mother)" value={relation} onChange={(e) => setRelation(e.target.value)} aria-label="Relation" />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={!name.trim()}>Add</button>
                <button className="btn btn-secondary" type="button" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" className="family-option family-add-btn" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add family member
            </button>
          )}
        </div>
      )}
    </div>
  );
}
