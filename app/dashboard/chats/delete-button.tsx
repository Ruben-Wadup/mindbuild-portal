"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteChatButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Dit gesprek verwijderen? Dit kan niet ongedaan worden.")) return;
    setBusy(true);
    await fetch(`/api/chats/${sessionId}`, { method: "DELETE" });
    router.push("/dashboard/chats");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Gesprek verwijderen"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
