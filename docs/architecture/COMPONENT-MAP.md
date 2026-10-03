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
| **Trello** | **cockpit humano, CRM visual, filas, filtros, campanhas e handoff da V1** | projeção do Supabase + configuração externa |
| Meta/WhatsApp | canal oficial de entrada/saída | configuração externa + adapter |
| Chatwoot | opcional/futuro; inbox compartilhado se necessário | configuração externa futura |
| Autentique | assinatura de contratos | integração + estado espelhado |
| Google Drive | artefatos operacionais | integração + referências |
| OneDrive | mídia pós-evento e link canônico ao cliente | integração + `business.deliveries` |
| VPS | hospedar runtime | deploy/documentação |

## Regras

1. Dados vivos ficam no runtime; definições reproduzíveis ficam no GitHub.
2. Supabase é a fonte de verdade do CRM/estado.
3. Trello projeta estado para humanos; não substitui o Supabase.
4. Uma ação humana no Trello passa por n8n + Guard antes de virar estado canônico.
5. Um cartão Trello representa preferencialmente um `business.customer_event`.
6. JEV decide apenas dentro do contrato recebido.
7. LLM escreve; código/regra decide o que for inequívoco.
8. OneDrive é a entrega canônica de mídia; publicação social é separada.
9. Chatwoot não bloqueia a V1.

Ver também:
- `CLICK-MAIS-OS-v1.md`
- `TRELLO-CRM-V1.md`
- `MODULE-ALLOCATION.md`
- `../decisions/ADR-0005_trello-cockpit-crm-v1.md`
