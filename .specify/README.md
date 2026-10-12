# GitHub Spec Kit — Click Mais OS

- Fonte upstream: [github/spec-kit](https://github.com/github/spec-kit), versão fixada em `v1.1.3`.
- Integração: Codex CLI no formato nativo de skills, conforme o gerador oficial do Spec Kit.
- Skills: `.agents/skills/speckit-<comando>/SKILL.md`.
- Invocação: `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-implement` e demais comandos.
- Templates e scripts compartilhados: `.specify/templates/` e `.specify/scripts/bash/`.
- Specs: `specs/NNN-nome-da-feature/`.

Esta configuração acrescenta o fluxo Spec-Driven Development sem substituir a governança nem os componentes do Click Mais OS. Os scripts são ferramentas de desenvolvimento, não dependências do n8n, Supabase ou produção. A versão upstream e sua licença estão registradas neste diretório.

Para instalar a CLI localmente na mesma versão, em um ambiente de desenvolvimento com acesso ao GitHub:

```sh
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.1.3
```

Esta feature usa `specs/001-envio-orcamento-whatsapp/`. O caminho ativo do Spec Kit é estado local e fica ignorado pelo Git; ao executar comandos que dependem da feature, defina `SPECIFY_FEATURE_DIRECTORY=specs/001-envio-orcamento-whatsapp`.

Antes de atualizar arquivos upstream, revisar as diferenças e as decisões do projeto em uma branch de trabalho.
