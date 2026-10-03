# Mapa de alocações — Click Mais OS

Status: homologated  
Data: 2026-10-03

| Capacidade | Fonte canônica | Executor | Decide | Interface/integração | Observação |
|---|---|---|---|---|---|
| Identidade do contato | Supabase `business.contacts` | n8n | regra determinística | Chatwoot/Meta | telefone/IDs são chaves de correlação, não memória da LLM |
| Ciclo de vida do evento | Supabase `customer_events` + transitions | n8n | regra + JEV quando ambíguo | Chatwoot | transição usa versão para evitar corrida |
| Fatos do atendimento | `business.event_facts` | n8n | extração + validação | WhatsApp/integrações | cada fato tem origem e histórico |
| Completude | `business.module_states` | código | determinístico | CRM/painel | percentual não substitui bloqueadores |
| Preço/localidade/promoção | regras homologadas + snapshots de quote | n8n/código | determinístico | WhatsApp | nunca decidido por LLM |
| Intenção ambígua | audit + estado | JEV | JEV dentro de choices | n8n | não inventa classes |
| Redação | prompt/contrato versionado | LLM | não decide negócio | WhatsApp | recebe ação + fatos + template |
| Guard de ação | regra versionada | n8n/código | determinístico | antes de side effect | bloqueia ação incompatível |
| Guard de resposta | regra versionada | n8n/código | determinístico | antes do envio | valida preço, disponibilidade, repetição, human lock |
| Handoff humano | `business.human_handoffs` | n8n | regra/JEV autorizado | Chatwoot | `active=true` pausa bot comercial |
| Contrato | `business.contracts` | n8n | determinístico | microsite + Autentique | status espelhado no Supabase |
| Pagamento | `business.payments` | n8n | IA lê; código compara; humano confirma | WhatsApp/Trello | `human_status=verified` é autoridade final |
| Arte | `business.art_jobs` | n8n | layout determinístico; JEV só em ambiguidade | Drive + designer | alteração relevante pode acionar human lock |
| Logística | `business.logistics` | n8n | regras/operador | Trello | evento ao vivo pode exigir humano |
| Entrega | `business.deliveries` | n8n | determinístico | OneDrive | OneDrive é canônico |
| Publicação social | `publication_consents` | skill/humano | consentimento obrigatório | Facebook | separado da entrega |
| CRM/segmentação | Supabase | n8n | regras explícitas | Chatwoot | Chatwoot é cockpit, não banco mestre |
| Follow-up | `business.followups` | n8n | política homologada | WhatsApp | cancelar quando estado muda/opt-out |
| Remarketing | `campaigns` + segmentos | n8n | campanha aprovada | Chatwoot/WhatsApp | promoção antiga não vira regra |
| Auditoria | `core.events`, `audit.*` | n8n/agentes | — | painel/logs | correlação por session/event/workflow |
| Código e contratos | GitHub | agentes autorizados | humano/ADR | GitHub | fonte canônica versionada |

## Regra de autoridade

```text
decisão humana homologada
→ ADR / business rule
→ schema / contrato
→ código determinístico
→ JEV dentro de escolhas autorizadas
→ LLM de linguagem
```

Um componente inferior nunca pode aumentar sua própria autoridade.
