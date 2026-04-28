// ntfy.sh push helper for portal — fire-and-forget
type NotifyOptions = {
  title: string;
  body: string;
  tags?: string[];
  priority?: "min" | "low" | "default" | "high" | "urgent";
  click?: string;
  actions?: string;
};

export function notifyPush(opts: NotifyOptions): void {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  const headers: Record<string, string> = {
    Title: opts.title,
    Priority: opts.priority ?? "default",
  };
  if (opts.tags?.length) headers.Tags = opts.tags.join(",");
  if (opts.click) headers.Click = opts.click;
  if (opts.actions) headers.Actions = opts.actions;

  fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    body: opts.body,
    headers,
  }).catch(() => {});
}
