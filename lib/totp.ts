import { TOTP } from "otplib";

const totp = new TOTP();

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return totp.verify({ token, secret });
  } catch {
    return false;
  }
}

export function generateTotpUri(secret: string, email: string): string {
  return `otpauth://totp/MindBuild%20Portal:${encodeURIComponent(email)}?secret=${secret}&issuer=MindBuild%20Portal&algorithm=SHA1&digits=6&period=30`;
}
