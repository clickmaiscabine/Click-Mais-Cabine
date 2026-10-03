# ADR-0004 — OneDrive como entrega canônica e publicação social separada

- Status: homologated
- Data: 2026-10-03

## Contexto

As festas da Click Mais são armazenadas no OneDrive, que possui capacidade adequada para a operação. O cliente recebe, após o evento, o link da pasta correspondente ao seu evento/data.

A publicação em rede social não é autorizada por todos os clientes e não deve ser tratada como parte obrigatória da entrega.

## Decisão

1. **OneDrive é o repositório canônico da mídia pós-evento entregue ao cliente.**
2. `business.deliveries.provider` usa `onedrive` como padrão.
3. O link da pasta do evento é registrado na entrega e enviado ao cliente pelo fluxo pós-evento.
4. Google Drive continua como apoio para artefatos operacionais, briefing, referências e outros arquivos de trabalho; não substitui o OneDrive nesta função.
5. Publicação no Facebook ou outra rede social é um fluxo separado.
6. Publicação social só pode ocorrer com consentimento registrado para o canal correspondente.
7. A publicação pode ser executada manualmente ou por skill/agente autorizado, mas nunca bloqueia a entrega do OneDrive.

## Estado mínimo

```text
evento concluído
  ↓
pasta OneDrive pronta
  ↓
delivery = ready
  ↓
link enviado
  ↓
delivery = sent
  ↓
cliente confirma / segue fluxo pós-venda

em paralelo, se houver consentimento:
  publicação social opcional
```

## Consequências

- Consentimento de publicação fica separado do estado da entrega.
- A ausência de autorização social não cria erro nem pendência de entrega.
- O link público/social nunca substitui o link canônico da pasta OneDrive.
