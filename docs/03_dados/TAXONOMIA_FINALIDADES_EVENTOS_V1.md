# Taxonomia determinística de finalidades — Click Mais V1

**Status:** desenvolvimento isolado; não homologada; sem implantação no fluxo publicado  
**Versão:** `1.0.2` — 2026-10-16  
**Base:** PR #21 (Flow 1) e DEC-017 do PR #19, ambos ainda em revisão.

## Arquitetura

```text
WhatsApp → receptor Meta existente (não alterar) → Flow 1
  → snapshot Supabase (estado + pergunta pendente)
  → normalizador de serviço/data/localidade EXISTENTE
  → CLASSIFICADOR DE FINALIDADE (este módulo)
      → código operacional legado + grupo + subtipo + características + prova
      → se insuficiente: JEV existente [somente se pergunta pendente for finalidade]
      → se JEV < 0,80, resultado fora da lista, negação/conflito: esclarecer
  → Guard → RPC existente de persistência → roteador existente
```

Uma única base editável: `src/taxonomy/event-purpose-v1.json`; uma implementação pura: `src/functions/classify-event-purpose-v1.js`. A fonte do nó Code do n8n é gerada por `scripts/sync-event-purpose-taxonomy.mjs`, sem dependência de `require()` em execução do n8n. Nenhum novo webhook, serviço, credencial, custo recorrente ou processo concorrente.

## Dimensões independentes

- **Grupo comercial**: `aniversario_pessoal`, `matrimonial`, `empresarial_institucional`, `formatura`, `cultural_religioso`.
- **Subtipo**: expressão específica reconhecida, sem substituir o grupo ou o código operacional.
- **Características**: `surpresa`, `tematico`, `beneficente`, `virtual`, `religioso`, `cultural`; são atributos transversais, não finalidades.
- **Evidência**: `rule_id`, termos coincidentes, versão, método, nível `direct/contextual/conflict`, necessidade de confirmação e escolha JEV, quando houver.

A `certainty` determinística é **etiqueta metodológica**, não uma estimativa probabilística de 0 a 100%.

## Famílias e códigos

| Grupo | Subtipos destacados | Código operacional V1 |
|---|---|---|
| Pessoal | mesversário, 1 ano, infância, adolescência, 15 anos, 16 anos, marcos de idade, meio aniversário, centenário, póstumo, aniversário hebraico | `aniversario`; `debutante` para 15 anos |
| Matrimonial | casamento, noivado, bodas, aniversário de união, renovação de votos | `casamento` |
| Empresarial/institucional | aniversário da empresa, confraternização, escolar, acadêmico, feira, premiação, congresso, fundação | `empresarial` |
| Formatura | formatura, colação, baile, formandos | `formatura` |
| Cultural/religioso | Bar/Bat Mitzvah, Seijin-shiki, Vesak, onomástico, batismo, marcos religiosos | **nenhum código legado presumido**: manter natureza específica e esclarecer |

O mapeamento `empresarial` é operacional e **não significa** que uma festa escolar seja corporativa para efeitos de benefícios. Similarmente, Bar/Bat Mitzvah não são aniversários de nascimento. O subtipo não concede álbum ou promoção.

## Precedência

1. Confirmar que não há mensagem duplicada nem bloqueio humano. O Flow 1 existente cuida disso.
2. Interpretar um número de menu **somente** quando `pending_question=purpose`. Serviço tem menu próprio.
3. Normalizar maiúsculas, acentos, espaços e pontuação de forma determinística.
4. Buscar expressões compostas e classes específicas antes de termos genéricos.
5. Rejeitar evidência negada; reconhecer quando grupos incompatíveis aparecem em trechos não sobrepostos.
6. Se a expressão determinar grupo/subtipo, mas não houver código operacional seguro, manter `purpose` pendente e solicitar confirmação.
7. Chamar JEV apenas para necessidade semântica restante numa resposta à pergunta de finalidade; validar opção autorizada e limiar `>= 0,80`.
8. Caso haja conflito com a ficha, **não substituir** dados silenciosamente: usar `pending_conflicts` da RPC existente.

Exemplos: `aniversário de casamento` → matrimonial; `aniversário da empresa` → empresarial; `15 anos da minha filha` → debutante; `festa surpresa` → apenas característica. Mensagens só de data/localidade não acionam o JEV de finalidade.

## Persistência sem mudança destrutiva

A RPC `public.cm_quote_flow1_apply_v1` aceita `purpose` como texto e possui whitelist de campos. Não foram acrescentadas colunas nem alteradas RPCs de produção. No ramo candidato:

- `p_extracted.purpose` continua sendo o código legado, quando houver.
- `p_evidence.purpose` descreve grupo, subtipo, regra, termos e versão para uma classificação efetivamente escrita; a RPC grava essa evidência no histórico `business.event_facts.metadata`.
- `p_evidence.purpose_taxonomy` acompanha toda decisão comercial, inclusive sem código: a RPC guarda-a na carga registrada em `core.events`.
- A ficha canônica de finalidade só é preenchida quando houver `purpose` operacional válido; a informação cultural sem equivalente operacional **não é convertida artificialmente**.

Assim, a classificação determinística reconhecida é rastreável **quando a versão candidata for implantada**. Sem implantação, nada foi persistido a partir desta branch. Consulta facilitada de grupo/subtipo em colunas dedicadas, inclusive para casos sem código, é possível em migração aditiva futura aprovada; não é requisito para colocar essa base em revisão.

## Inclusões e exclusões

- Datas, localidades, pontos de referência e horários permanecem com normalizadores próprios; são apenas regressão cruzada neste projeto.
- Não aplicar nem sugerir brindes, descontos, preços, elegibilidades ou disponibilidade.
- Não modificar o número oficial, as credenciais, o webhook Meta, o receptor publicado ou o Supabase.
- O JEV semântico já existente permanece limitado às classes autorizadas e confiança mínima de 0,80.
- Erros comuns de grafia explicitamente cadastrados são reconhecidos; grafias desconhecidas não são inferidas por correspondência difusa arbitrária.

## Manutenção

1. Acrescentar subtipo/regra com identificador estável à base JSON.
2. Preservar o código operacional e priorizar compostos para evitar colisões.
3. Acrescentar exemplos positivos, negativos e conflitantes ao corpus.
4. Alterar `version` quando mudar a semântica.
5. Executar `node scripts/sync-event-purpose-taxonomy.mjs`.
6. Executar `node --test tests/event-purpose-v1.test.cjs tests/flow1-purpose-bridge.test.cjs`.
7. Revisar código gerado, diff da branch e resultados com aprovação humana antes de testar a candidata no n8n, e novamente antes da publicação no fluxo ativo.

A documentação `docs/06_testes/RELATORIO_TAXONOMIA_FINALIDADES_2026-10-16.md` registra o estado atual e os portões pendentes.
