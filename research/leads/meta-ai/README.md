# Auditoria do treinamento Meta AI

Status: review  
Data: 2026-10-02

Esta pasta registra somente o **resultado curado** da auditoria do pacote de treinamento/exportação da Meta AI usado pela Click Mais Cabine.

## Fonte analisada

Pacote local exportado com:
- `settings.txt`;
- 52 arquivos de conversas;
- 73 entradas de FAQ/configuração.

O pacote bruto mistura:
- atendimento comercial;
- operação pré-evento, evento e pós-evento;
- mensagens não comerciais;
- mensagens automáticas/terceiros;
- exemplos de treinamento;
- respostas produzidas pela própria Meta AI.

Por isso, ele **não é fonte canônica direta**.

## Regra de uso

O que aparece aqui pode:
- apoiar revisão da persona;
- revelar perguntas reais;
- revelar falhas de roteamento;
- sugerir intents, estados e FAQs;
- mostrar respostas que funcionaram ou falharam.

O que aparece aqui **não pode**, sozinho:
- criar preço;
- definir disponibilidade;
- autorizar desconto;
- alterar política;
- substituir a planilha/base operacional vigente;
- promover uma resposta da Meta IA a regra oficial.

## Arquivos

- `reports/2026-10-02_meta-ai-training-audit.md` — relatório consolidado;
- `findings/META-AI-ANTI-PATTERNS.md` — comportamentos a eliminar;
- `findings/FAQ-CANDIDATES.md` — conhecimento útil classificado em candidate/verify/conflict/deprecated/runtime;
- `findings/LIFECYCLE-ROUTING.md` — estados/jornadas candidatos;
- `reviews/2026-10-02_meta-ai_items-to-homologate.md` — fatos e políticas que precisam de confirmação.

## Material excluído

Não versionado:
- conversas brutas;
- nomes e dados pessoais;
- conversas familiares/pessoais;
- endereços residenciais;
- chaves/dados bancários;
- números de telefone;
- exemplos com clientes identificáveis;
- respostas com preços históricos fixos;
- exportação integral da Meta AI.

O repositório continua público, então somente derivados agregados e sanitizados podem entrar.
