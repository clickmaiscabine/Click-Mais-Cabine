# ADR-0003 — Arquitetura de produção do Click Mais OS

- Status: homologated
- Data: 2026-10-03
- Nota de evolução:
  - operação humana via Chatwoot foi supersedida pela ADR-0005;
  - classificação de Chatwoot como optional_future e regras iniciais de Trello foram refinadas pela ADR-0006.

## Contexto

O atendimento da Click Mais precisa preservar estado fora da memória de uma LLM, evitar cálculo comercial probabilístico, permitir atendimento humano e reaproveitar automações de contrato, pagamento, arte, logística e pós-evento.

## Decisão preservada

| Camada | Componente |
|---|---|
| Transporte | Meta WhatsApp Cloud API |
| Orquestração | n8n self-hosted / Hostinger |
| Memória operacional | Supabase |
| Estado | Event State Engine |
| Decisão semântica | JEV |
| Regra inequívoca | código determinístico |
| Linguagem | LLM compositor |
| Segurança de ação | Guards |
| Auditoria | Supabase `audit` + eventos |
| Contratos | Autentique + workflows |
| Artefatos de trabalho | Google Drive |
| Entrega pós-evento | OneDrive |

## Evolução da operação humana

A versão original colocava Chatwoot como cockpit humano.

Decisões posteriores:

```text
ADR-0005
Trello = cockpit humano / CRM visual da V1
Supabase = fonte canônica

ADR-0006
Chatwoot = fora do projeto V1
Card Trello Comercial = somente após orçamento enviado
Pipeline = ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS
           → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO
           → GANHO/PERDIDO
```

## Regras que permanecem vinculantes

1. WhatsApp não é memória operacional.
2. Supabase guarda o estado vivo; GitHub guarda a definição versionável.
3. JEV não calcula preços, não confirma pagamento e não cria opções fora das classes recebidas.
4. LLM não aplica promoção, não inventa disponibilidade e não substitui regras determinísticas.
5. Handoff humano ativo pausa resposta comercial automática.
6. Um cliente pode ter vários eventos.
7. Um evento pode ter vários orçamentos.
8. Exceção humana é local à oportunidade até homologação como regra.
9. O número oficial só entra após homologação com número/teste da Meta.

Ver ADR-0005 e ADR-0006 para CRM/handoff humano e pipeline comercial da V1.
