"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  Home,
  Menu,
  Moon,
  Plus,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import FamilySwitcher from "./FamilySwitcher";

const items = [
  ["/dashboard", "Dashboard", Home],
  ["/profile", "Profile", UserRound],
  ["/vitals", "Vitals Vault", HeartPulse],
  ["/documents", "Medical Records", FileText],
  ["/booking", "Healthcare Booking", CalendarDays],
] as const;

export default function AppNav() {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile / tablet drawer

  useEffect(() => {
    const savedTheme = localStorage.getItem("ayumarg-theme");

    if (savedTheme === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // close the drawer after navigating to another page
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // while the drawer is open: Esc closes it, and the page behind can't scroll
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  // rotating a tablet / resizing to desktop width: drawer is no longer needed
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMenuOpen(false);

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    const next = !dark;

    setDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ayumarg-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ayumarg-theme", "light");
    }
  }

  return (
    <>
      {/* TOP BAR */}

      <header className="topbar">
        <div className="topbar-left">
          {/* HAMBURGER — visible below lg (1024px) only */}
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
          >
            <Menu size={20} />
          </button>

          <Link href="/dashboard" className="brand" aria-label="AayuMarg – go to dashboard">
            <Image
              src="/assets/ayumarg-logo.png"
              alt=""
              width={52}
              height={52}
              quality={100}
              className="brand-logo glow-logo"
            />
            <span className="brand-text">
              <span className="brand-name">AayuMarg</span>
              <span className="brand-tag">We care</span>
            </span>
          </Link>
        </div>

        <div className="top-actions">
          <FamilySwitcher />

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* 44px tap area around the Clerk avatar */}
          <UserButton
            appearance={{
              elements: {
                userButtonTrigger: {
                  minWidth: 44,
                  minHeight: 44,
                  display: "grid",
                  placeItems: "center",
                },
              },
            }}
          />
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}

      <aside className="sidebar">
        <div className="nav-label">Care space</div>

        <nav className="nav-list">
          {items.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${
                path?.startsWith(href) ? "active" : ""
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* CARE TOOLKIT */}

        <div className="care-toolkit">
          <div className="toolkit-icon">
            <Plus size={18} />
          </div>

          <div className="toolkit-title">Care Toolkit</div>

          <div className="toolkit-text">
            Keep health information, records and care services together.
          </div>

          <Link href="/booking" className="toolkit-button">
            Book healthcare
            <CalendarDays size={14} />
          </Link>
        </div>

        {/* MEDICAL CROSS */}

        <div className="medical-cross-box">
          <span className="cross-horizontal" />
          <span className="cross-vertical" />
        </div>
      </aside>

      {/* MOBILE / TABLET DRAWER (below lg) */}

      <div
        className={`drawer-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-drawer"
        className={`drawer ${menuOpen ? "open" : ""}`}
        aria-label="Navigation menu"
      >
        <div className="drawer-head">
          <div className="nav-label" style={{ padding: 0 }}>
            Care space
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list">
          {items.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path?.startsWith(href) ? "active" : ""}`}
              aria-current={path?.startsWith(href) ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* theme toggle (tiny phones only; topbar has no room for it) */}
        <button type="button" className="btn btn-secondary drawer-theme" onClick={toggleTheme}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {dark ? "Switch to light mode" : "Switch to dark mode"}
        </button>

        <Link href="/booking" className="toolkit-button">
          Book healthcare
          <CalendarDays size={14} />
        </Link>
      </aside>
    </>
  );
}
