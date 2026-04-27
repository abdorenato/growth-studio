import { redirect } from "next/navigation";

// A home apenas redireciona — o middleware decide entre /login (deslogado)
// ou /dashboard (logado+aprovado) ou /pending /blocked conforme o status.
export default function HomePage() {
  redirect("/login");
}
