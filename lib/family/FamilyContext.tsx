"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mockRead, mockWrite } from "@/lib/services/mockStore";
import type { FamilyMember } from "@/lib/types";

const SELF: FamilyMember = { id: "self", name: "Myself", relation: "Account holder" };

interface Ctx {
  members: FamilyMember[];
  active: FamilyMember;
  setActive: (id: string) => void;
  addMember: (name: string, relation: string) => void;
}

const FamilyCtx = createContext<Ctx | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [others, setOthers] = useState<FamilyMember[]>([]);
  const [activeId, setActiveId] = useState("self");

  useEffect(() => {
    setOthers(mockRead<FamilyMember[]>("family", []));
    setActiveId(mockRead<string>("family_active", "self"));
  }, []);

  const members = useMemo(() => [SELF, ...others], [others]);
  const active = members.find((m) => m.id === activeId) ?? SELF;

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    mockWrite("family_active", id);
  }, []);

  const addMember = useCallback((name: string, relation: string) => {
    const m: FamilyMember = { id: crypto.randomUUID(), name: name.trim(), relation: relation.trim() || "Family" };
    setOthers((prev) => {
      const next = [...prev, m];
      mockWrite("family", next);
      return next;
    });
    setActiveId(m.id);
    mockWrite("family_active", m.id);
  }, []);

  return <FamilyCtx.Provider value={{ members, active, setActive, addMember }}>{children}</FamilyCtx.Provider>;
}

export function useFamily() {
  const c = useContext(FamilyCtx);
  if (!c) throw new Error("useFamily must be used inside <FamilyProvider>");
  return c;
}
