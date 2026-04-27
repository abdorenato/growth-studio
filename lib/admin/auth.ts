// Auth simples por email — admin lista vem de env var ADMIN_EMAILS (CSV)
// + default hardcoded pra renatocamarotta@gmail.com (criador do app).

const DEFAULT_ADMINS = ["renatocamarotta@gmail.com"];

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Junta defaults + env (sem duplicatas)
  return Array.from(new Set([...DEFAULT_ADMINS, ...fromEnv]));
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase().trim());
}

/**
 * Valida o request: olha header x-admin-email e checa contra lista.
 * Retorna true se autorizado, false caso contrario.
 */
export function checkAdminAuth(req: Request): boolean {
  const email = req.headers.get("x-admin-email");
  return isAdmin(email);
}
