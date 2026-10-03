# Pesquisa de leads — WhatsApp

Status: review  
Última consolidação: 2026-10-02

Esta pasta reúne somente material **curado e seguro** derivado da análise histórica do atendimento da Click Mais Cabine.

## Finalidade

Dar aos agentes autorizados evidências para revisar e propor:
- persona e tom do atendimento;
- intenções do cliente;
- objeções;
- etapas do funil;
- regras de follow-up;
- pontos de transferência para atendimento humano;
- requisitos futuros de CRM, prompts e workflows.

## Regra de governança

O conteúdo desta pasta é evidência de pesquisa, não regra automática de produção.

Fluxo correto:

```
research/leads
    ↓ revisão humana
knowledge + docs/business-rules
    ↓ implementação
prompts + schemas + n8n
```

Nenhum agente deve promover uma hipótese desta pasta diretamente para produção.

## Conteúdo disponível

- `METHODOLOGY.md` — escopo, método e limitações;
- `reports/2026-10-02_persona-atendimento-curada.md` — relatório consolidado;
- `findings/INTENT-CATALOG.md` — intenções candidatas;
- `findings/OBJECTIONS.md` — objeções e barreiras;
- `findings/LANGUAGE-PATTERNS.md` — padrões linguísticos;
- `findings/FUNNEL-AND-FOLLOWUP.md` — funil e follow-up;
- `reviews/2026-10-02_pendencias.md` — pontos que ainda exigem decisão.

## Material deliberadamente excluído

Não versionar:
- backup do WhatsApp;
- banco decriptado;
- corpus de conversas;
- chaves;
- mapa reversível de PII;
- falas literais de clientes;
- nomes, telefones, e-mails, documentos ou endereços;
- preços históricos tratados como preço atual;
- scripts locais de decriptografia/publicação que não sejam necessários ao produto.

A fonte bruta permanece fora do GitHub.
