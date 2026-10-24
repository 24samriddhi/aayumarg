"use client";

import { useEffect, useRef, useState } from "react";

const ENDPOINT =
  "https://astrosam.app.n8n.cloud/webhook/aayumarg-chat";

type Msg = {
  role: "user" | "bot";
  text: string;
};

function renderText(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (match && /^(tel:|https?:)/i.test(match[2])) {
      return (
        <a
          key={index}
          href={match[2]}
          target={match[2].startsWith("http") ? "_blank" : undefined}
          rel={match[2].startsWith("http") ? "noopener noreferrer" : undefined}
          style={{
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          {match[1].replace(/\*\*/g, "")}
        </a>
      );
    }

    return (
      <span key={index}>
        {part.replace(/\*\*/g, "")}
      </span>
    );
  });
}

export default function CareCompanion() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "नमस्ते! मैं आपका Aayumarg Care Companion हूँ। आप मुझसे हिंदी, English या Hinglish में सवाल पूछ सकते हैं।",
    },
  ]);

  const sessionId = useRef("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem("aayumarg_chat_session");

      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("aayumarg_chat_session", id);
      }

      sessionId.current = id;
    } catch {
      sessionId.current = crypto.randomUUID();
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const message = input.trim();

    if (!message || busy) return;

    if (message.length > 2000) {
      setMsgs((current) => [
        ...current,
        {
          role: "bot",
          text: "Please keep your message under 2,000 characters. कृपया अपना संदेश छोटा करें।",
        },
      ]);
      return;
    }

    setInput("");
    setMsgs((current) => [...current, { role: "user", text: message }]);
    setBusy(true);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data: { reply?: unknown } = await res.json();

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Invalid chat response");
      }

      setMsgs((current) => [
        ...current,
        { role: "bot", text: data.reply as string },
      ]);
    } catch {
      setMsgs((current) => [
        ...current,
        {
          role: "bot",
          text: "I'm having trouble connecting right now. Please try again, or contact Aayumarg support at 7000698030 or info@aayumarg.com.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1000,
        fontFamily: "inherit",
      }}
    >
      {open && (
        <section
          role="dialog"
          aria-label="Aayumarg Care Companion chat"
          style={{
            width: 350,
            maxWidth: "calc(100vw - 32px)",
            height: 480,
            maxHeight: "min(70dvh, 600px)",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 30px rgba(0,0,0,.18)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 14,
              background: "#0f766e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>
                Aayumarg Care Companion
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Hindi · English · Hinglish
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "transparent",
                color: "#fff",
                border: 0,
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div
            aria-live="polite"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {msgs.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  background:
                    msg.role === "user" ? "#0f766e" : "#f1f5f4",
                  color: msg.role === "user" ? "#fff" : "#111",
                  padding: "10px 12px",
                  borderRadius: 12,
                  maxWidth: "88%",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {msg.role === "bot" ? renderText(msg.text) : msg.text}
              </div>
            ))}

            {busy && (
              <div role="status" style={{ fontSize: 13, color: "#666" }}>
                Thinking… / जवाब तैयार हो रहा है…
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="यहाँ लिखें / Type here"
              aria-label="Type your message"
              maxLength={2000}
              disabled={busy}
              style={{
                flex: 1,
                minWidth: 0,
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 9,
                fontSize: 14,
                color: "#111",
              }}
            />

            <button
              type="submit"
              disabled={busy || !input.trim()}
              style={{
                padding: "8px 14px",
                background: "#0f766e",
                color: "#fff",
                border: 0,
                borderRadius: 9,
                cursor: busy ? "wait" : "pointer",
                opacity: busy || !input.trim() ? 0.65 : 1,
              }}
            >
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close Care Companion" : "Open Care Companion"}
        style={{
          display: "block",
          marginLeft: "auto",
          padding: "13px 18px",
          background: "#0f766e",
          color: "#fff",
          border: 0,
          borderRadius: 999,
          boxShadow: "0 4px 14px rgba(0,0,0,.2)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {open ? "Close chat" : "Chat / बात करें"}
      </button>
    </div>
  );
}
