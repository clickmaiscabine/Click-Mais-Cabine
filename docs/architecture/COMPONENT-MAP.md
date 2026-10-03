# Mapa de componentes

| Componente | Responsabilidade | Fonte canônica |
|---|---|---|
| GitHub | código, JSONs, regras, prompts, pesquisas, migrations e testes | repositório |
| Supabase `core` | sessão, eventos de runtime e estado transitório | migrations + banco |
| Supabase `business` | contatos, eventos comerciais, fatos, módulos e CRM operacional | migrations + banco |
| Supabase `audit` | execuções de agentes/workflows | migrations + banco |
| Supabase `integrations` | prontidão não secreta das integrações | migrations + banco |
| n8n | executar orquestrações e side effects | JSON versionado + instância |
| JEV | escolher entre decisões/classes autorizadas | contratos + prompts + audit |
| Código determinístico | preço, data, combo, promoção, validação e Guards | business rules + src |
| LLM compositor | redação e síntese sem autoridade de negócio | prompts/contratos |
| Chatwoot | cockpit humano, inbox, CRM visual e handoff | configuração externa + adapter |
| Meta/WhatsApp | canal oficial de entrada/saída | configuração externa + adapter |
| Trello | projeção de trabalho humano | configuração externa + adapter |
| Autentique | assinatura de contratos | integração + estado espelhado |
| Google Drive | artefatos operacionais | integração + referências |
| OneDrive | mídia pós-evento e link canônico ao cliente | integração + `business.deliveries` |
| VPS | hospedar runtime | deploy/documentação |

## Regras

1. Dados vivos ficam no runtime; definições reproduzíveis ficam no GitHub.
2. Se algo precisar ser reconstruído após perda da VPS, sua definição deve estar versionada.
3. Chatwoot e Trello projetam estado para humanos; não substituem o Supabase.
4. JEV decide apenas dentro do contrato recebido.
5. LLM escreve; código/regra decide o que for inequívoco.
6. OneDrive é a entrega canônica de mídia; publicação social é separada e consent-gated.

Ver também:

- `CLICK-MAIS-OS-v1.md`
- `MODULE-ALLOCATION.md`
- `../decisions/ADR-0003_click-mais-os-arquitetura-producao.md`
- `../decisions/ADR-0004_onedrive-entrega-canonica-e-publicacao-social.md`
