import { TOTP } from "otplib";

const totp = new TOTP();

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await totp.verify({ token, secret });
    return result === true;
  } catch {
    return false;
  }
}

export function generateTotpUri(secret: string, email: string): string {
  return `otpauth://totp/MindBuild%20Portal:${encodeURIComponent(email)}?secret=${secret}&issuer=MindBuild%20Portal&algorithm=SHA1&digits=6&period=30`;
}
