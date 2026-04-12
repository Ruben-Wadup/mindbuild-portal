import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, site, userMessage, assistantMessage, isFirst, firstMessage } = await req.json();

    if (!sessionId || !userMessage || !assistantMessage) {
      return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
    }

    // Upsert session
    if (isFirst) {
      await sql`
        INSERT INTO chat_sessions (session_id, site, first_message, message_count, last_message_at)
        VALUES (${sessionId}, ${site ?? "mindbuild.nl"}, ${firstMessage ?? userMessage}, 2, NOW())
        ON CONFLICT (session_id) DO UPDATE SET
          message_count   = chat_sessions.message_count + 2,
          last_message_at = NOW()
      `;
    } else {
      await sql`
        UPDATE chat_sessions
        SET message_count = message_count + 2, last_message_at = NOW()
        WHERE session_id = ${sessionId}
      `;
    }

    // Insert both messages
    await sql`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES
        (${sessionId}, 'user',      ${userMessage}),
        (${sessionId}, 'assistant', ${assistantMessage})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/chat]", err);
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}
