# BR-002 — Turno 2: integração do Quote Engine em LAB

Status: review
Data: 18/10/2026, America/Sao_Paulo (execuções após 00h UTC de 19/10).
Branch: `feat/corporate-quote-lab-integration-20261018`.

## Resultado

O CM-WF-030 existente calcula BR-002 ou mantém o cálculo social conforme a seleção
determinística da entrada. O kernel foi aplicado e executado no n8n LAB com seis casos,
incluindo dados reais do catálogo lidos por SELECT. Não está publicado e não foi conectado
ao F1 neste turno. O percurso WhatsApp completo continua reservado aos Turnos 3–5.

## Condições de entrada confirmadas

- HEAD inicial desta branch: `48c1d173fe15fd938222f45300f2a81281741dac`.
- PR #23 permanece draft, HEAD `c913e7e51fc6ddcfc700b05b01fc198b92bf0e92`.
- main conferida antes da alteração: `047297d54d26620c73076d68ade3e55dcf29977b`.
- CM-WF-030 inicial: `34bd8b75-6366-42e9-8d17-4650438b9fe0`, inativo, dois nós.
- Fonte de preços: arquivo Drive `1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH`, revisão atual
  `0B6VWt3lEydcWUFVOSTYrS0RESm9NRERaUUpBNzNMUm9IcG4wPQ`, novamente conferida.
- Lidas as instruções AGENTS, baseline, DEC-017, manifesto, regra BR-002 e contratos relacionados.

## Alterações e menor impacto

1. Recuperação seletiva dos dez arquivos F2 e testes existentes do commit
   `9c17bcb226a30706ed5d2094452431592850597f`, sem merge dessa branch. Todos os dez arquivos
   foram comparados byte a byte com a origem. O módulo corporativo homologado permaneceu intacto.
2. `src/adapters/quote-social.mjs`: adapter social extraído do kernel anterior, mantendo
   entradas, saída, promoções, combo, brinde e arredondamento.
3. `src/adapters/quote-engine.mjs`: seleção por código `empresarial` ou
   `GRUPO_CORPORATIVO`; BR-002 chama exclusivamente `calcularOrcamentoCorporativo`.
   Não passa pela promoção ou acréscimo de cartão social. Não autoriza brinde corporativo.
4. Validação de dias/períodos, consistência de intervalo ou lista de datas, serviço único
   cadastrado, localidade e faixa. Preço divergente, override de faixa ou fonte não
   reconciliada retorna bloqueio/humano sem valor. Combinações corporativas sem regra
   específica também seguem ao humano, sem criar política nova.
5. Snapshot integral da revisão oficial e proveniência com hash em `knowledge/sources/`.
   É cópia auditável da fonte, não tabela editável independente. O gerador deriva as oito
   bases Pix, 233 localidades precificadas e uma localidade de atendimento humano.
6. `scripts/build-quote-engine.mjs`: incorpora as fontes no kernel e no export do workflow.
   `--check` detecta divergência do snapshot/hash, kernel ou export. Sem dependências novas.
7. Mesmo workflow `3LlqxQwA5JZBoaZd`, mesmo nome, dois nós e mesma conexão. Somente código
   e descrição foram atualizados. Nenhuma credencial, banco ou workflow foi criado.
8. Actions atualizado para verificar geração, regressão e evidência do n8n.

O contrato detalhado de entrada/saída está em `src/adapters/README.md`. A saída conserva
`quote_result.customerVisible.pix/card` e acrescenta valores corporativos, schedule e
proveniência. `ready` é prontidão do cálculo: disponibilidade permanece `not_checked`,
com `claim_authorized=false`; a apresentação corporativa continua pendente do Turno 5.

## Verificação automatizada

Comandos executados:

```bash
python scripts/validate_repository.py
node scripts/build-quote-engine.mjs --check
node --test src/functions/*.test.cjs tests/f2/*.test.mjs tests/f4/*.test.mjs tests/quote-engine/*.test.mjs
node scripts/verify-quote-engine-lab.mjs
```

**242 testes aprovados, zero falhas:** 44 do módulo BR-002 original, 47 da biblioteca F2,
13 do adapter F4 anterior e 138 da integração. Os 138 incluem matriz corporativa de oito
faixas × três períodos × um/três dias e 49 comparações integrais da saída social com o
kernel anterior, incluindo promoções, combo e janelas de datas.

Teste de sandbox executa o kernel sem require/import/module. Configuração do Code node
e workflow de dois nós foram validados pelo n8n. A leitura posterior confirmou igualdade
integral entre kernel local e jsCode instalado e preservação da conexão existente.

## Execução real do kernel em n8n LAB

Execução final **7443**, status **success**. Versão testada:
`e3738c86-c58b-4301-8edf-689fa0656ce6`.

Somente a entrada Receive Quote Context foi fixada; Run F2 Quote Kernel executou de verdade.
As entradas foram montadas com catálogo Supabase lido no turno. Nenhum nó de I/O existe
nesse workflow. Inputs/outputs sanitizados estão em `BR002_TURNO2_EVIDENCIAS.json` e são
verificados automaticamente contra o código versionado.

| Cenário | Resultado |
|---|---|
| Suzano, 3 dias × 2 períodos de 4h | Cartão R$ 6.255,00; à vista R$ 5.129,10; sinal/saldo R$ 2.564,55 |
| Mogi, 1 dia × 3 períodos de 4h | Cartão R$ 2.380,00; à vista R$ 1.951,60; sinal/saldo R$ 975,80 |
| Social Suzano, janela promocional | Pix R$ 1.200,00; cartão R$ 1.420,00; saída integral igual à anterior |
| Quatro períodos | human_required; nenhum valor |
| Dias e intervalo inconsistentes | blocked; nenhum valor |
| Preço recebido diferente do oficial | human_required; nenhum valor |

O exemplo hipotético da base R$ 1.200 é validado no módulo matemático original, mas não é
aceito como faixa corporativa oficial. Arredondamento e limites monetários continuam no
módulo homologado, sem reprodução da fórmula no adapter ou nos prompts.

## Preservação e pendências

- Sem alteração na main, no PR #23, no F1 ativo, no dispatcher ou nas reservas reais.
- Supabase somente SELECT; nenhum envio WhatsApp, nenhuma ação Trello, nenhum merge.
- O motor LAB permanece inativo/não publicado. `active=false` não impediu o teste manual
  isolado; não foi necessária publicação ou nova mensagem do telefone autorizado.
- Esta entrega conclui **somente o Turno 2**. Ainda faltam qualificação corporativa/F1,
  persistência dos novos fatos, consulta de todas as datas com frescor, apresentação,
  conexão à fila e E2E Meta TEST. Os testes do motor não homologam esses componentes.

Próxima ação recomendada: Turno 3, conectando a taxonomia e a coleta de dados faltantes ao
F1 e ao contrato deste motor, mantendo os fatos já conhecidos e o protocolo comercial.
