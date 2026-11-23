# Changelog do Projeto — Click Mais OS

## 2026-11-23 — Ponte Codex–Hermes

- DEC-021 concretiza área de interação IAs, caminhos privados de entrada/saída/recibos e disparos existentes.
- Área pública contém somente orientação; a branch privada do painel recebe os pacotes, isolada da main e dos arquivos do MVP.
- Sem novo cron, integração de runtime, credenciais ou alteração do SOUL.md; consumo Hermes e recebimento seguem dependentes de prova específica.


## 2026-11-23 — Máquina de moldes semanais de Marketing

- DEC-020 registra propósito do departamento e entrega do protótipo funcional: ficha padronizada, importador, arquivo versionado e visualizador de curvas semanais.
- Código sem dependências de interface/CDN, contrato JSON e exemplos fictícios; métricas reais ficam fora do repositório público.
- Dedupe, conflitos de revisão, contribuições de fontes, lacunas, isolamento demo/real e métricas não aditivas protegidos; testes finitos do motor/importador passaram.
- A abertura da tela para verificação visual foi bloqueada pelo ambiente. Integração Hermes/Painel e recibo deste novo pacote permanecem pendentes. Nenhum job, cartão ou campanha alterado.


## 2026-11-23 — Jornada de venda e recebimento

- DEC-019: cruzamento analítico entre Controle de Orçamentos, Logística 3.1 e Financeiro na revisão semanal existente.
- Adicionados ordem de execução, marcos com evidência/precisão, deduplicação por evento, coortes comparáveis e visualizações de tempo e caixa.
- journey.schema.json é contrato analítico separado; schemas/consumidores anteriores preservados. Dados reais e evidências de clientes permanecem privados.
- Inspeção de leitura não alterou cartões, contratos, pagamentos ou gatilhos. Cobertura parcial não é taxa integral da empresa.


## 2026-11-23 — Cadência e ingestão privada de Marketing

- Registrada DEC-018: vigilância diária de e-mails/avaliações e revisão semanal após as 12h de segunda; lembrete e alertas pertencem ao Hermes.
- Especificadas inbox/outbox privadas, dedupe por escopo, recibo específico e métricas do Perfil da Empresa/Controle de Orçamentos sem atribuição inventada.
- Schemas aceitam 1.1.0 e preservam 1.0.0; consumidor local deve ser atualizado antes de receber a nova versão. Matriz e evidências locais anteriores preservadas.
- Destino GitHub privado e novos aceites continuam pendentes; nenhuma métrica real adicionada ao repositório público.


## 2026-11-23 — Operação recorrente de Marketing

- Registrada DEC-017 e ADR-0007 em review, com gerente Hermes e executor Codex.
- Adicionados plano de implantação finita, contratos de pedido/relatório, intenção de jobs, matriz de aceite e primeira semana editorial da Cabine IA.
- Credenciais continuam no mecanismo autorizado; conectores desta conversa não são presumidos no Codex local.
- Sem alteração nos motores produtivos, contratos, pipeline, Trello ou software homologado da Cabine IA. Relatórios e dados reais permanecem privados.


## 2026-10-10 — Permissão do link OneDrive de entrega

- Registrada a decisão DEC-016: usar link padrão OneDrive “Anyone/qualquer pessoa com o link”, somente para visualização e com download permitido.
- O link será enviado ao cliente contratado pelo WhatsApp, sem exigir autenticação ou identificação por e-mail; o cliente pode repassá-lo, e qualquer pessoa que obtenha o link poderá acessar as fotos.
- A política de compartilhamento depende de a opção “Anyone” estar habilitada na conta OneDrive; o fluxo deverá reportar bloqueio de configuração, sem gerar um link com escopo diferente em silêncio.

## 2026-10-10 — Prazo da entrega pós-evento

- Registrada a decisão DEC-015: programar o envio do link canônico da pasta OneDrive para 12h do dia calendário seguinte à data da festa, no fuso America/Sao_Paulo.
- O envio depende de a pasta estar pronta e vinculada ao evento; publicação social permanece separada da entrega do cliente.
- A decisão detalha a ADR-0004 e deverá ser incorporada à especificação do CM-WF-140; ainda não representa workflow n8n executável.

## 2026-10-10 — Ambiente Meta / WhatsApp de teste

- Registrada configuração concluída conforme declaração de Regis e documento de 09/10/2026.
- Adicionados inventário, evidências relatadas, referência visual sanitizada e handoff seguro do token com Hermes.
- Atualizadas referências antigas de standby em README, PROJECT, ARCHITECTURE, manifesto e status das integrações.
- Sinalizadas divergência do Business Portfolio ID e contagem incompatível de destinatários/vagas.
- Nenhum segredo versionado; nenhuma mudança em Meta, n8n, Supabase ou número real; produção não homologada.

## 2026-10-05 — Baseline Funcional v1.1

### Adicionado
- estrutura documental numerada para a fase de Projeto Executivo;
- baseline funcional homologada;
- registro numerado de decisões;
- formalização da origem por landing pages;
- marco de qualificação do lead em orçamento enviado;
- novo pipeline Trello Comercial;
- separação explícita entre estado atual e coorte histórica;
- regra de remarketing baseada no Supabase;
- ADR-0006.

### Alterado
- Chatwoot deixa de ser opcional no caminho V1 e passa a ficar fora do projeto V1;
- criação de card Trello deixa de ocorrer no primeiro customer_event e passa a ocorrer após orçamento enviado;
- ordem comercial passa a ser:
  ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO;
- definição de “venda” é deslocada para o processo comercial posterior ao orçamento.

### Preservado
- Supabase como fonte de verdade;
- n8n como orquestrador/executor;
- Trello como cockpit humano;
- JEV limitado a choices autorizadas;
- regras determinísticas para preço e políticas;
- human lock/handoff;
- auditoria;
- separação Trello Comercial × Trello Logística.

