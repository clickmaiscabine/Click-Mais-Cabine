# ADR-0003 — Arquitetura de produção do Click Mais OS

- Status: homologated
- Data: 2026-10-03

## Contexto

O atendimento da Click Mais precisa preservar estado fora da memória de uma LLM, evitar cálculo comercial probabilístico, permitir atendimento humano e reaproveitar as automações já existentes de contrato, pagamento, arte, logística e pós-evento.

A arquitetura deve continuar funcionando mesmo com troca de modelo, agente ou canal. Meta/WhatsApp e Chatwoot ainda aguardam credenciais; por isso seus adaptadores podem existir em `standby` sem bloquear a construção do núcleo.

## Decisão

A arquitetura canônica fica dividida assim:

| Camada | Componente | Autoridade |
|---|---|---|
| Transporte | Meta WhatsApp Cloud API | canal oficial de entrada/saída |
| Operação humana | Chatwoot Cloud | inbox, CRM visual, handoff e atendimento humano |
| Orquestração | n8n self-hosted / Hostinger | executa workflows e integrações |
| Memória operacional | Supabase | fonte de verdade do estado vivo |
| Estado | Event State Engine | fatos, ciclo de vida, completude e transições |
| Decisão semântica | JEV | escolhe somente entre classes/opções autorizadas |
| Regra inequívoca | código determinístico | preço, datas, promoções, combo, validações e completude |
| Linguagem | LLM compositor | redação, síntese e transformação; não decide preço nem autoridade |
| Segurança de ação | Guards | valida decisão e resposta antes do efeito externo |
| Auditoria | Supabase `audit` + eventos | explica execuções, transições e efeitos |
| Trabalho humano | Trello | projeção operacional, não fonte de verdade |
| Contratos | Autentique + workflows existentes | assinatura e status contratual |
| Artefatos de trabalho | Google Drive | briefing, referências e arte operacional |
| Entrega pós-evento | OneDrive | repositório canônico das pastas de mídia e link ao cliente |

## Fluxo canônico

```text
cliente
  ↓
WhatsApp / Meta Cloud API
  ↓
Chatwoot
  ↓ webhook
n8n / WF-00
  ↓
identidade + estado no Supabase
  ↓
extração de fatos
  ↓
regras determinísticas
  ↓
JEV somente se houver ambiguidade autorizada
  ↓
Action Guard
  ↓
módulo operacional
  ↓
LLM compositor quando houver texto ao cliente
  ↓
Response Guard
  ↓
audit
  ↓
Chatwoot / Meta / WhatsApp
```

## Regras vinculantes

1. O WhatsApp não é memória operacional.
2. Chatwoot não é fonte canônica do estado.
3. Trello não é fonte canônica do estado.
4. Supabase guarda o estado vivo; GitHub guarda a definição versionável.
5. JEV não calcula preços, não confirma pagamento e não cria opções fora das classes recebidas.
6. LLM não aplica promoção, não inventa disponibilidade e não substitui regras determinísticas.
7. Handoff humano ativo pausa a resposta comercial automática.
8. Um cliente pode ter vários eventos.
9. Um evento pode ter vários orçamentos; orçamento anterior não é sobrescrito.
10. Exceção humana é local à oportunidade até homologação explícita como nova regra.
11. Meta e Chatwoot ficam em `standby` enquanto faltarem credenciais, sem bloquear o restante da construção.
12. O número oficial da Click Mais só entra após homologação com número/teste da Meta.

## Consequências

- O n8n deve ser construído como conjunto de workflows pequenos e identificados.
- O Supabase precisa diferenciar sessão de conversa de evento comercial da empresa.
- Cada fato relevante deve registrar procedência.
- Efeitos externos devem ser auditáveis e idempotentes quando aplicável.
- Integrações pendentes devem constar em registro não secreto com `runtime_enabled=false`.
