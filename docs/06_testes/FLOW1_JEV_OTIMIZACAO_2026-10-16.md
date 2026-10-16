# Otimização Flow 1 — reduzir JEV redundante

Data: 2026-10-16
Estado: publicado no laboratório; sem respostas automáticas de WhatsApp.

## Objetivo

Reservar JEV à compreensão de texto livre realmente ambíguo. **Escolhas numeradas são valores fixos, nunca decisões de LLM.** O pipeline já extrai todos os campos conhecidos numa mesma mensagem e a ficha mantém estado em Supabase.

## Regras implantadas

### Menu de serviço

Quando `core.sessions.context.pending_question = "service"`:

| Resposta | Valor |
|---|---|
| 1 | `cabine_fotos` |
| 2 | `totem_fotos` |
| 3 | `plataforma_360` |
| 4 | `set_fotografico` |
| 5 | `fotografo` |

Este menu contém cinco serviços oficiais já presentes no fluxo; **nenhum foi removido**. Uma resposta numérica só pode representar um serviço quando a pergunta anterior solicitou serviço. Nunca inferir serviço de número sem contexto.

### Menu de finalidade

Quando `core.sessions.context.pending_question = "purpose"`:

| Resposta | Valor provisório da ficha |
|---|---|
| 1 | `casamento` |
| 2 | `aniversario` |
| 3 | `debutante` |
| 4 | `empresarial` |

O texto da pergunta agora apresenta esses números. A opção `debutante` permanece código próprio do esquema atual, a ser agrupado sob aniversário na próxima proposta de taxonomia, com subtipo preservado. O agrupamento futuro **não** autoriza brinde automaticamente.

### Decisão semântica

JEV **não** é chamado quando o texto já produziu fatos determinísticos como finalidade explícita, data, localidade ou serviço conhecido; nem quando é resposta numérica de menu, saudação, duplicidade, conflito pendente ou bloqueio humano.

JEV pode ser chamado uma vez no Flow 1 quando:

- `semantic_target=service`: nenhum serviço determinado, mas texto contém uma descrição semanticamente relevante de aparelho, foto, vídeo etc.
- `semantic_target=purpose`: o serviço já é conhecido, a pergunta pendente é finalidade, a resposta é texto livre que não coincide com nenhuma classe inequívoca.

O prompt do JEV restringe as classes possíveis e inclui `outro_indefinido`. Uma escolha só vira fato persistido se confidence >= 0,80 e corresponder a uma opção admissível. Caso contrário, a finalidade permanece pendente e o sistema solicita esclarecimento. Probabilidades do modelo são **estimativas para classificação**, não certezas.

### Eliminação da duplicidade no receptor Meta

No receptor `iIAtpaRgvtssABsB`, o ramo legado JEV passou a exigir `phone_number_id != 1350381714825884` (sandbox). O número teste usa apenas o JEV com contexto completo do subfluxo `3RAuwFaHIaZvOMjU`; tráfego fora do sandbox preserva o ramo anterior. Gatilho Meta único e envio externo desligado.

## Evidência de regressão

| Execução n8n | Resultado |
|---|---|
| #225 | Diagnóstico em lote: 5 respostas determinísticas sem JEV; 2 ambiguidades com target semântico correto; teste em lote do nó JEV pinado não é suportado nesse cenário |
| #226 | Execução de cinco testes determinísticos com sucesso: `4` serviço, `4` finalidade, casamento escrito, data escrita, cidade escrita; **zero chamadas JEV** |
| #227 | Texto: festa só para alegrar avô; JEV real escolheu `outro_indefinido` com confiança 1; nenhum propósito inventado |
| #228 | Texto de aparelho fotográfico desconhecido; JEV real escolheu cabine com confiança 0,77; **rejeitado pelo limiar de 0,80**, menu permanecendo disponível |
| #229 | Receptor Meta em execução simulada: chamou subfluxo e **não executou JEV legado** |
 
Ambos os workflows foram publicados após os testes. IDs atuais da versão publicada: Flow 1 `73e49c2d-f0c1-4ef0-a075-73cdff7e43c7`; receptor Meta `dd6be36b-1e5d-4424-9a93-43ec789b4bf5`.

## Taxonomia de finalidades — proposta futura, **não aplicada**

Separar **grupo comercial** e **subtipo detalhado**, para preservar particularidades e evitar brindes indevidos:

- Grupo aniversário pessoal: aniversário infantil/adulto, debutante, bar mitzvah (convenção comercial proposta), entre outros.
- Grupo casamento/família matrimonial: casamento, bodas, aniversário de casamento, renovação/confirmação de votos, noivado (se aprovado).
- Grupo empresarial/institucional: confraternização corporativa, aniversário da empresa, premiação, feira, simpósio, eventos escolares/institucionais (conforme regras aprovadas).
- Outros/indefinidos: encontros afetivos sem motivo comemorativo informado, aniversários genéricos sem público identificado etc.

Os exemplos ainda não foram homologados como regras de negócio; **nenhuma oferta de álbum, desconto ou outra vantagem é calculada ou prometida** nesta alteração. A próxima etapa deverá formalizar a tabela de sinônimos/subtipos, precedência e negações, e testar casos sensíveis como **aniversário de casamento** versus **aniversário pessoal** e **aniversário de empresa** versus **festa particular**.

## Artefatos

- `src/functions/flow1-intake.n8n.js`
- `src/functions/flow1-jev-request.n8n.js`
- `src/functions/flow1-jev-guard.n8n.js`
- `n8n/quote-flow1-orchestrator.workflow-sdk.js`
- `n8n/quote-flow1-integrated.as-built.n8n.json`
- `n8n/whatsapp-meta-lab-bridge.draft.n8n.json`

Nenhum workflow de produção comercial foi ativado, nenhum orçamento foi calculado e nenhum WhatsApp foi enviado.
