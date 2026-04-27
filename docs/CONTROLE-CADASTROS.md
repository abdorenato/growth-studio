# Controle de cadastros

Permite **fechar/reabrir cadastros novos** sem afetar usuários já existentes.

## O que é bloqueado quando "fechado"

| Ação | Estado |
|---|---|
| `POST /api/users/register` (cadastro pela home) | ❌ retorna 403 |
| `POST /api/chat/session` com email **novo** | ❌ retorna 403 |
| `POST /api/users/login` com email existente | ✅ funciona normal |
| `POST /api/chat/session` com email **existente** | ✅ funciona normal |
| Qualquer ação dentro da plataforma (módulos, geração) | ✅ funciona normal |
| Painel admin `/admin` | ✅ funciona normal |
| Keepalive `/api/health/keepalive` | ✅ funciona normal |

## Como FECHAR

No Vercel:

1. **Settings → Environment Variables**
2. Adicionar:
   - **Key:** `REGISTRATION_CLOSED`
   - **Value:** `true`
   - **Environments:** `Production` (e/ou `Preview` se quiser)
3. Salvar
4. **Deployments → último → ⋯ → Redeploy** (env vars precisam de redeploy pra valer)

Tempo total: ~2 minutos.

Após o redeploy:
- Quem entrar com email novo na home vê **"🔒 Cadastros temporariamente fechados"**
- Quem entrar no chat com email novo recebe **"Cadastros fechados. Use o email já cadastrado."**
- Quem já tem conta entra normalmente

## Como REABRIR

No Vercel:

1. **Settings → Environment Variables**
2. Encontrar `REGISTRATION_CLOSED`
3. Apagar (ou trocar valor pra `false`)
4. **Redeploy** o último deploy

## Como verificar o estado

```bash
curl https://growth-studio.vercel.app/api/config
# {"registrationClosed":true}  ou false
```

## UX dos cenários

### Cenário A: novo visitante na home
1. Vê tela de login
2. Digita email novo
3. Login retorna 404 → frontend mostra toast: *"Email não encontrado e cadastros estão fechados no momento."*
4. Ele não consegue avançar.

### Cenário B: novo visitante no /chat
1. Tela de entrada (email + nome + @)
2. Submete
3. Backend retorna 403 → toast: *"Cadastros fechados. Use o email já cadastrado pra continuar."*
4. Ele não consegue avançar.

### Cenário C: aluno existente na home
1. Tela de login
2. Digita email cadastrado
3. Login OK → redirect pra `/dashboard`
4. Tudo funciona normal.

### Cenário D: aluno existente no /chat
1. Tela de entrada
2. Submete email
3. Backend acha o User → cria sessão → entra no chat normal.
4. iAbdo funciona com modo leitura inclusive.

## Como funciona internamente

- **Env var:** `REGISTRATION_CLOSED=true`
- **Helper:** `lib/admin/registration.ts`
- **Endpoint público:** `GET /api/config` retorna `{ registrationClosed: boolean }` (cache 60s na CDN)
- **Frontend:** home e chat consultam `/api/config` no mount e adaptam UI

## Não cobre

- Bloquear LEITURA dos dados (RLS aberto continua aberto — ver `ARQUITETURA.md` §6)
- Encerrar sessões já ativas — quem está logado continua até dar logout
- Bloquear o uso da plataforma por usuários existentes (use Opção B do plano de fechamento se precisar disso)

Pra fechar TUDO (não só cadastros novos), troca pelo **modo manutenção via middleware** — não foi implementado ainda.
