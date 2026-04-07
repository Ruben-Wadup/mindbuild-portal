import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal_session");
  const secret = process.env.PORTAL_SESSION_SECRET;
  return session?.value === secret && !!secret;
}
