// Liga/desliga cadastro de novos usuarios via env var.
//
// Uso: REGISTRATION_CLOSED=true no Vercel (Settings → Environment Variables)
//
// Quando true:
//   - POST /api/users/register retorna 403
//   - POST /api/chat/session com email novo (que nao existe em users) retorna 403
//   - Login e uso pra usuarios existentes continua normal
//
// Pra ligar: vercel env add REGISTRATION_CLOSED → "true" → redeploy
// Pra desligar: remove a env var (ou seta "false") → redeploy

export function isRegistrationClosed(): boolean {
  const val = process.env.REGISTRATION_CLOSED;
  return val === "true" || val === "1";
}

export const REGISTRATION_CLOSED_MSG =
  "Cadastros temporariamente fechados. Se você já tem conta, faça login com seu email.";
