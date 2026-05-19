# Consolidação dos artefatos declamatórios da fundação

> Documento de decisão. A fundação (Voz, Posicionamento, Território) gera
> hoje 5 frases-conceito. Algumas colidem por design. Este doc mapeia as
> colisões e apresenta as opções pra você decidir. Nada foi implementado.

---

## O mapa dos 5 artefatos

| Artefato | Módulo | Como o prompt o define hoje |
|---|---|---|
| Frase de essência | Voz | "manifesto pessoal, 1ª pessoa, curta e poderosa" |
| Frase de impacto | Voz | "frase que o usuário diria publicamente **como bandeira**, direta e memorável" |
| Tagline (frase de posicionamento) | Posicionamento | fórmula "Eu ajudo X a Y através de Z" — declaração funcional |
| Tese (manifesto) | Território | "1 frase contraintuitiva — **É a bandeira pública**" |
| Âncora mental | Território | "1-3 palavras, metafórica, **NÃO descreve o que a marca faz**" |

Dois têm papel limpo e sem conflito: **essência** (motivação) e **tagline** (o serviço). Os outros três têm problema — e os problemas são de naturezas **diferentes**.

---

## Achado A — colisão real: Frase de impacto × Tese

Não é interpretação. Os dois prompts dizem, com essas palavras:

- `lib/voz/prompt.ts` → frase de impacto = *"como **bandeira**"*
- `lib/prompts/territorio.ts` → tese = *"**É a bandeira pública**"*

**Dois artefatos, gerados em módulos isolados, ambos se autodefinem como "a bandeira pública".** Uma pessoa tem UMA bandeira. O sistema pede duas. Elas vão colidir sempre — não é falha de preenchimento, é design.

### Opções

**A1 — Cortar a frase de impacto como bandeira.**
A Voz para de gerar bandeira. Fica com essência + tom + palavras (papéis limpos). A bandeira passa a ser exclusiva do Território (a tese). Conceitualmente correto: "o que eu defendo publicamente" é tema de Território, não de Voz.
- *Quebra:* campo `frase_impacto` já existe em todas as fundações. Precisa depreciar (manter no banco, parar de exibir/usar) ou migrar.
- *Esforço:* baixo no prompt da Voz; médio no resto (o Digital ID e outros lugares que leem `frase_impacto`).

**A2 — Manter as duas, redefinir o papel da frase de impacto.**
A frase de impacto deixa de ser "bandeira" e vira "frase que demonstra o TOM" — um exemplo de como a marca soa, não do que defende. A tese continua sendo a bandeira ideológica.
- *Quebra:* nada no banco. Só reescreve o prompt da Voz.
- *Risco:* "frase que demonstra tom" é um papel mais vago — pode não justificar a existência do campo. Talvez vire decorativo.

**A3 — Voz não gera bandeira; o Território a deriva.**
A Voz entrega só essência + tom. Quando o Território é criado, ele recebe a essência e gera a bandeira (tese) a partir dela + do domínio. Uma bandeira só, com fonte única.
- *Quebra:* igual A1 (depreciar `frase_impacto`).
- *Vantagem:* fonte única de verdade pra bandeira.

**Recomendação:** A1 ou A3 — uma bandeira só, no Território. A2 é o caminho de menor esforço mas deixa um campo meio órfão. Entre A1 e A3, A3 é mais elegante (fonte única) mas A1 é mais simples.

---

## Achado B — Âncora mental: papel certo, guard-rail furado

Aqui minha análise anterior estava imprecisa. A âncora **tem** papel definido — e bem distinto. O prompt (`territorio.ts`) é rigoroso:

> "1 a 3 palavras / NÃO descreve o que a marca faz / máximo 4 palavras / use verbos, metáforas, paradoxos."
> Exemplos: *"Vender é leitura"*, *"Marca é verbo"*, *"Corpo é casa"*.

Uma âncora **conforme essa regra não colide com a tagline** — são coisas diferentes (espaço mental metafórico × declaração de serviço).

**O problema real:** a âncora salva na sua fundação é *"Encontro e resolvo o que trava sua empresa"* — 7 palavras, descritiva, diz o que você faz. Ela **viola todas as regras do próprio prompt**. Virou uma tagline disfarçada. Foi a IA que furou na geração, ou foi editada manualmente depois sem validação.

Ou seja: a redundância tagline×âncora que perseguimos não é colisão de design da âncora — é uma âncora **mal preenchida** que ninguém barrou.

Dois problemas menores acompanham:
- **B1:** a âncora mental não está no `CONCEITOS.md` (a tabela das 3 dimensões do Território lista só Tema, Lente, Manifesto, Fronteiras). Defasagem de documentação.
- **B2:** não há validação no input da âncora — dá pra salvar qualquer texto, inclusive um que viola a regra.

### Opções

**B-fix — Manter a âncora, adicionar enforcement.**
A âncora tem papel legítimo; só falta guard-rail. Adicionar validação no submit do Território: máximo 4 palavras, e talvez um aviso se a frase for descritiva. Atualizar o `CONCEITOS.md` pra incluir a âncora nas dimensões. E corrigir a sua âncora atual (regerar pra algo como "O invisível que trava" / "Empresa destravada" — curto, metafórico).
- *Quebra:* nada. Só adiciona validação.

**B-cut — Cortar a âncora mental.**
Se na prática ela não está sendo usada conforme o conceito, talvez não valha o campo. Território fica com Tema + Lente + Tese + Fronteiras (que é exatamente o que o `CONCEITOS.md` já define).
- *Quebra:* depreciar `ancora_mental`.

**Recomendação:** B-fix. A âncora curta/metafórica tem valor real (vira bio, abre conversa) — o problema é falta de guard-rail, não o conceito. Cortar seria jogar fora um artefato bom por causa de um preenchimento ruim.

---

## Resumo das decisões a tomar

1. **Bandeira (Achado A):** A1 (cortar frase de impacto), A2 (redefinir como tom) ou A3 (Território deriva)?
2. **Âncora (Achado B):** B-fix (enforcement + corrigir) ou B-cut (remover)?

Definido isso, eu implemento na base (prompts + validação + migração de campo + atualização do `CONCEITOS.md`). O Digital ID já não depende mais disso — a checagem de redundância foi removida dele.
