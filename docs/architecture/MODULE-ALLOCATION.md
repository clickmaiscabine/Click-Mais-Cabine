# Mapa de alocações — Click Mais OS

Status: homologated  
Data: 2026-10-03

| Capacidade | Fonte canônica | Executor | Decide | Interface/integração | Observação |
|---|---|---|---|---|---|
| Identidade do contato | Supabase `business.contacts` | n8n | regra determinística | Meta/WhatsApp | telefone/IDs são correlação, não memória da LLM |
| Ciclo de vida do evento | Supabase `customer_events` + transitions | n8n | regra + JEV quando ambíguo | Trello | transição usa versão |
| Fatos do atendimento | `business.event_facts` | n8n | extração + validação | WhatsApp/integrações | cada fato tem origem |
| Completude | `business.module_states` | código | determinístico | Trello/painel | percentual não substitui bloqueadores |
| Preço/localidade/promoção | regras homologadas + quote snapshot | n8n/código | determinístico | WhatsApp | nunca decidido por LLM |
| Intenção ambígua | audit + estado | JEV | choices autorizadas | n8n | não inventa classes |
| Redação | prompt/contrato versionado | LLM | não decide negócio | WhatsApp | ação + fatos + template |
| Guard de ação | regra versionada | n8n/código | determinístico | antes de side effect | bloqueia ação incompatível |
| Guard de resposta | regra versionada | n8n/código | determinístico | antes do envio | valida preço, disponibilidade e human lock |
| Handoff humano | `business.human_handoffs` | n8n | regra/JEV autorizado | **Trello** | fila/coluna humana pode ativar lock |
| Contrato | `business.contracts` | n8n | determinístico | microsite + Autentique | status no Supabase |
| Pagamento | `business.payments` | n8n | IA lê; código compara; humano confirma | WhatsApp/Trello | humano é autoridade final |
| Arte | `business.art_jobs` | n8n | layout determinístico; JEV só em ambiguidade | Drive + designer | pode acionar human lock |
| Logística | `business.logistics` | n8n | regras/operador | Trello | evento ao vivo pode exigir humano |
| Entrega | `business.deliveries` | n8n | determinístico | OneDrive | canônico |
| Publicação social | `publication_consents` | skill/humano | consentimento obrigatório | Facebook | separado da entrega |
| **CRM/segmentação** | **Supabase** | **n8n** | **regras explícitas** | **Trello** | **Trello é cockpit, não banco mestre** |
| Follow-up | `business.followups` | n8n | política homologada | WhatsApp + Trello | cancelar quando estado muda |
| Remarketing | `campaigns` + segmentos | n8n | campanha aprovada | **Trello + WhatsApp** | útil para datas ociosas |
| Auditoria | `core.events`, `audit.*` | n8n/agentes | — | logs/painel | correlação por IDs |
| Código e contratos | GitHub | agentes autorizados | humano/ADR | GitHub | fonte canônica |

## Trello bidirecional

```text
Supabase → n8n → Trello        (projeção)
Trello → n8n → Guard → Supabase → Audit
```

Movimento manual não reescreve o banco diretamente.

## Regra de autoridade

```text
decisão humana homologada
→ ADR / business rule
→ schema / contrato
→ código determinístico
→ JEV dentro de choices autorizadas
→ LLM
```
