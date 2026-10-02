# ADR-0001 — GitHub como fonte canônica

- Status: homologated
- Data: 2026-10-01

## Contexto
Vários agentes e modelos serão usados para criação, revisão e testes. O projeto não pode depender do histórico de uma única conversa nem do editor do n8n.

## Decisão
O repositório GitHub é a fonte canônica de todo artefato versionável. Supabase representa estado operacional; n8n executa; agentes trabalham sobre os artefatos versionados.

## Consequências
- workflows n8n precisam de export JSON versionado;
- schemas e migrations acompanham mudanças de dados;
- pesquisas relevantes são persistidas;
- decisões estruturais ficam em ADR;
- produção não é a única cópia de qualquer lógica.
