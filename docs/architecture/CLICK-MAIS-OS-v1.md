# Click Mais OS — Blueprint funcional v1

Status: homologated  
Data: 2026-10-03

## 1. Princípio

A Click Mais não está construindo um único "bot". Está construindo um sistema operacional de atendimento e operação comercial.

```text
OFICIAL NO TRANSPORTE
Meta Cloud API

DETERMINÍSTICO NO NEGÓCIO
código + regras homologadas

DECISÃO SEMÂNTICA
JEV com choices autorizadas

LINGUAGEM
LLM compositor

MEMÓRIA OPERACIONAL
Supabase / Event State Engine

EXECUÇÃO
n8n self-hosted

OPERAÇÃO HUMANA
Chatwoot

ENTREGA DE MÍDIA
OneDrive
```

## 2. Três níveis

### Nível 1 — Relacionamento

```text
Cliente
  ↕
WhatsApp
  ↕
Meta Cloud API
  ↕
Chatwoot
  ↕
Humano / webhook para n8n
```

Chatwoot é cockpit humano: inbox, atribuição, labels, segmentos e handoff. Ele não substitui o Supabase como fonte do estado.

### Nível 2 — Cérebro operacional

```text
                 n8n / WF-00
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Supabase      JEV        Audit
    estado       choices     trilha
        │          │          │
        └──────┬───┴──────────┘
               ▼
             Guards
               ▼
       módulo autorizado
               ▼
       LLM se houver texto
```

- **Supabase sabe**: identidade, evento, fatos, ciclo de vida, módulos e histórico.
- **n8n faz**: chama serviços, persiste, agenda, dispara e coordena.
- **JEV decide quando necessário**: somente dentro de classes permitidas.
- **Código calcula**: preço, data, antecedência, combo, completude e validações inequívocas.
- **LLM escreve**: resposta curta e contextual.
- **Guard impede**: ação/saída incompatível com estado, autoridade ou regra.
- **Audit explica**: qual evento disparou qual workflow/agent/transição.

### Nível 3 — Operação da empresa

```text
Lead → orçamento → decisão → contrato → pagamento
                                  ↓
                               catálogo
                                  ↓
                                 arte
                                  ↓
                              logística
                                  ↓
                              pré-evento
                                  ↓
                                evento
                                  ↓
                      OneDrive / entrega
                                  ↓
                              pós-venda
                                  ↓
                       relacionamento / CRM
```

## 3. Estado: sessão não é evento comercial

O núcleo distingue:

- `core.sessions`: contexto transitório do canal/conversa;
- `business.contacts`: pessoa/entidade identificada;
- `business.customer_events`: oportunidade/evento da Click Mais;
- `core.events`: fatos de execução/mensageria;
- `business.event_stage_transitions`: histórico do ciclo de vida do evento.

Uma pessoa pode ter vários eventos sem perder histórico.

## 4. Fatos e procedência

`business.event_facts` guarda fatos sem sobrescrever silenciosamente o histórico.

Estados permitidos:

- `known`: informado/obtido diretamente;
- `derived`: calculado por regra;
- `verified`: confirmado por fonte/autoridade;
- `conflict`: conflito que precisa de resolução.

Cada fato registra fonte, referência, confiança opcional e o fato anterior que foi substituído.

## 5. Completude

`business.module_states` registra por evento:

- módulo;
- status;
- percentual de completude;
- `ready`;
- bloqueadores.

Percentual não autoriza ação sozinho. O campo `ready` depende dos requisitos bloqueantes do módulo.

## 6. Domínios persistidos

| Domínio | Tabela principal | Função |
|---|---|---|
| Contato | `business.contacts` | identidade e tipo de relação |
| Evento/oportunidade | `business.customer_events` | ciclo de vida comercial/operacional |
| Serviços | `business.event_services` | serviços desejados/cotados/contratados |
| Fatos | `business.event_facts` | valores com procedência/histórico |
| Completude | `business.module_states` | prontidão e bloqueadores |
| Orçamento | `business.quotes` | versões imutáveis de propostas |
| Contrato | `business.contracts` | status e referência Autentique |
| Pagamento | `business.payments` | leitura, comparação e confirmação humana |
| Arte | `business.art_jobs` | briefing, prévia, aprovação e final |
| Logística | `business.logistics` | checagem e prontidão operacional |
| Entrega | `business.deliveries` | OneDrive e status de envio |
| Consentimento | `business.publication_consents` | autorização separada por canal |
| Campanhas | `business.campaigns` | ofertas aprovadas/segmentadas |
| Follow-up | `business.followups` | ações futuras agendadas |
| Handoff | `business.human_handoffs` | trava humana real |
| Integrações | `integrations.registry` | prontidão sem guardar segredo |

## 7. Handoff

Quando existe `human_handoffs.active=true` para o evento/sessão:

- o bot continua podendo registrar a mensagem;
- não envia resposta comercial automática;
- o humano assume no Chatwoot;
- a retomada exige liberação explícita.

## 8. Integrações pendentes

Meta e Chatwoot podem ser modelados agora sem credencial.

```text
adapter definido
+ status no registry
+ runtime_enabled = false
= STANDBY
```

Quando as credenciais forem entregues pelo cofre:

```text
configurar credencial
→ testar endpoint
→ atualizar registry
→ habilitar runtime
```

Nenhuma mudança de schema é necessária para isso.

## 9. Estado atual

Já implementado no Supabase:

- núcleo de sessões/eventos/transições/auditoria;
- contatos e eventos de negócio;
- fatos com procedência;
- histórico de ciclo de vida;
- módulos operacionais;
- orçamento, contrato, pagamento, arte, logística e entrega;
- CRM básico de campanhas/follow-up/handoff;
- registro de integrações;
- OneDrive marcado como entrega canônica;
- Meta e Chatwoot em standby.

Ainda não implementado nesta etapa:

- workflows n8n executáveis;
- pricing engine com regras finais homologadas;
- adaptadores Meta/Chatwoot ativos;
- JEV runtime;
- compositor LLM e guards executáveis;
- sincronização Chatwoot;
- automações finais dos módulos.

Esses elementos entram em workflows posteriores e devem usar este modelo como contrato.
