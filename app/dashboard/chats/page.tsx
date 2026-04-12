export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import { MessageCircle } from "lucide-react";

type Session = {
  id: string;
  session_id: string;
  site: string;
  first_message: string | null;
  message_count: number;
  started_at: Date;
  last_message_at: Date;
};

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
};

function fmt(d: Date) {
  return new Date(d).toLocaleString("nl-NL", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: activeSession } = await searchParams;

  const sessions = await sql<Session[]>`
    SELECT * FROM chat_sessions ORDER BY last_message_at DESC LIMIT 100
  `;

  let messages: ChatMessage[] = [];
  let activeData: Session | undefined;

  if (activeSession) {
    messages = await sql<ChatMessage[]>`
      SELECT * FROM chat_messages WHERE session_id = ${activeSession} ORDER BY created_at ASC
    `;
    activeData = sessions.find((s) => s.session_id === activeSession);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold tracking-[3px] uppercase text-[#00D4AA] mb-1">
          Mindo · AI Chatbot
        </p>
        <h1 className="text-2xl font-extrabold text-white">Gesprekken</h1>
        <p className="text-sm text-white/40 mt-1">{sessions.length} sessies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Session list */}
        <div className="space-y-2">
          {sessions.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">Nog geen gesprekken</p>
            </div>
          )}
          {sessions.map((s) => (
            <a
              key={s.session_id}
              href={`/dashboard/chats?session=${s.session_id}`}
              className={`block rounded-xl border p-4 transition-colors ${
                activeSession === s.session_id
                  ? "border-[#00D4AA] bg-[rgba(0,212,170,0.08)]"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-white/30">{s.site}</span>
                <span className="text-[10px] text-white/30">{fmt(s.last_message_at)}</span>
              </div>
              <p className="text-sm text-white/80 line-clamp-2 leading-snug">
                {s.first_message ?? "—"}
              </p>
              <p className="text-[11px] text-white/30 mt-1">{s.message_count} berichten</p>
            </a>
          ))}
        </div>

        {/* Conversation view */}
        <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col min-h-[500px]">
          {!activeSession || !activeData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">Selecteer een gesprek</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{activeData.first_message}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {activeData.site} · gestart {fmt(activeData.started_at)} · {activeData.message_count} berichten
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap"
                      style={{
                        background: m.role === "user" ? "#00D4AA" : "rgba(255,255,255,0.08)",
                        color: m.role === "user" ? "#0f2027" : "rgba(255,255,255,0.8)",
                        borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontWeight: m.role === "user" ? 500 : 400,
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
