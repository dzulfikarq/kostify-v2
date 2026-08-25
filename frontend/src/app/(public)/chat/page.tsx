"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/api/extras";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "@tailgrids/icons";

export default function ChatPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const convs = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => chatApi.list(),
    enabled: !!me,
    refetchInterval: 10000,
  });

  const thread = useQuery({
    queryKey: ["chat-messages", active],
    queryFn: () => chatApi.messages(active!),
    enabled: !!me && !!active,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.length]);

  if (!me) {
    return (
      <div className="container section" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>Login dulu untuk melihat chat</p>
        <Link href="/login?next=/chat" className="btn-outline btn-outline--sm">Masuk</Link>
      </div>
    );
  }

  const send = () => {
    if (!draft.trim() || !active) return;
    chatApi.send(active, draft.trim()).then(() => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["chat-messages", active] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    });
  };

  const activeConv = convs.data?.find((c) => c.id === active);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 64, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {active && (
          <button onClick={() => setActive(null)} aria-label="Kembali" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)" }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{active ? activeConv?.other_name || "Chat" : "Pesan"}</h1>
      </div>

      {!active ? (
        /* List percakapan */
        convs.isLoading ? (
          <Skeleton />
        ) : !convs.data?.length ? (
          <Card className="card--static" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
            <p style={{ margin: 0 }}>Belum ada percakapan. Mulai chat dari halaman detail kost/kamar.</p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convs.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className="card card--static"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, textAlign: "left", cursor: "pointer", width: "100%", border: "1px solid var(--color-paper-2)" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(133, 80, 230, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "var(--color-amber)",
                    flexShrink: 0,
                  }}
                >
                  {c.other_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "var(--color-ink-2)" }}>{c.other_name}</span>
                    <span style={{ fontSize: 12, color: "var(--color-muted)", flexShrink: 0 }}>
                      {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.last_message || "Belum ada pesan"}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8550e6] px-1.5 text-[11px] font-bold text-white">
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        /* Thread pesan */
        <Card className="card--static" style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {thread.data?.map((m) => {
              const mine = m.sender_id === me.id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                      background: mine ? "var(--color-amber)" : "var(--color-paper-2)",
                      color: mine ? "#fff" : "var(--color-text)",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.body}
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                      {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--color-paper-2)" }}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tulis pesan..."
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button className="btn-primary" onClick={send} disabled={!draft.trim()} style={{ whiteSpace: "nowrap" }}>
              Kirim
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card card--static" style={{ height: 72, background: "var(--color-paper-2)" }} />
      ))}
    </div>
  );
}
