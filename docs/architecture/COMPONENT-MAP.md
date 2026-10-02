# Mapa de componentes

| Componente | Responsabilidade | Fonte canônica |
|---|---|---|
| GitHub | código, JSONs, regras, prompts, pesquisa, migrations, testes | repositório |
| Supabase core | sessão, eventos e transições | migrations + banco |
| Supabase audit | execuções de agentes/workflows | migrations + banco |
| n8n | executar orquestrações | JSON versionado + instância |
| Meta/WhatsApp | canal de entrada/saída | configuração externa + adapters |
| LLMs/agentes | interpretação, geração e revisão | prompts/contratos |
| VPS | hospedar runtime | deploy/documentação |

## Regra
Dados vivos ficam no runtime; definições reproduzíveis ficam no GitHub. Se algo precisar ser reconstruído após perda da VPS, sua definição deve estar versionada.
