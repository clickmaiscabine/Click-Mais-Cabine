# Changelog do Projeto — Click Mais OS

## 2026-11-26 — Atlas Operacional registrado para rastreabilidade

- Registrado o Atlas Operacional Click Mais v1.0 (snapshot `CM-ATLAS-812448a3834c`), ferramenta local que consolida os dez blueprints de departamento em mapa navegável de exploração, análise e desenho.
- Os artefatos (ferramenta HTML, base estruturada, manual, provas de homologação, registro de entregas e pacotes de trabalho) ficam no repositório privado `clickmaiscabine/atlas-operacional`; o repositório público mantém apenas este registro, sem valores financeiros, lacunas ou responsabilidades por setor.
- O Atlas é retrato documental da edição de 21–24/11/2026, não monitoramento ao vivo, e não aciona sistema, mensagem, pagamento ou job.
- Entregas aos perfis `cm-bi` e `cm-co` seguem o fluxo: pacote gerado pelo dono → leitura pela ordem do pacote → devolução com fonte, cobertura, prova, decisão, responsável e prazo.
- Regra de manutenção: base nova só por edição documental gerada pelo dono; arquivos do pacote não são editados à mão.

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
