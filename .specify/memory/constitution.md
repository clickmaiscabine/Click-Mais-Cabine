# Constituição de trabalho — Click Mais OS

**Versão**: 1.0.0-draft  
**Status**: review  
**Natureza**: síntese de guardrails já definidos no repositório; não substitui Baseline, ADR, Registro de Decisões ou schemas.

## Princípios

1. **Preservar a hierarquia canônica**. Decisão humana homologada, ADR, Baseline Funcional, schemas/contratos, arquitetura, manifesto e implementação prevalecem nessa ordem. Uma especificação não altera silenciosamente regra homologada.
2. **Manter as fronteiras dos componentes**. GitHub guarda artefatos versionáveis; Supabase registra estado e histórico; n8n coordena integrações; Trello projeta trabalho para pessoas; Meta WhatsApp é o transporte oficial; Chatwoot permanece fora da V1.
3. **Separar fato, decisão, cálculo e linguagem**. Preços, datas, descontos, completude e guards são determinísticos e dependem de fonte aprovada. JEV escolhe apenas entre opções autorizadas. LLM pode compor linguagem, mas não inventa valor ou regra.
4. **Registrar estado com origem e histórico**. Preservar correlação, idempotência, versões, tentativas e auditoria. Um side effect externo não pode ser tratado como sucesso antes de existir evidência do provedor.
5. **Bloquear exceções sem autorização**. Dado ausente/conflitante, regra não homologada, human_lock e resultado externo ambíguo devem parar o caminho automático ou criar handoff; não presumir intenção nem exceção comercial.
6. **Desenvolver primeiro em ambiente isolado**. Workflows de teste permanecem inativos e sem segredos embutidos. Produção não recebe writes, mensagens, deploy ou mudança de credenciais durante uma especificação ou homologação LAB.
7. **Proteger credenciais e dados pessoais**. Nunca versionar token, chave, credencial, dump com PII ou conversa bruta. Usar fixtures sintéticas/anonimizadas e registrar o mínimo necessário para auditoria.
8. **Usar a menor mudança compatível**. Reaproveitar contratos e componentes existentes quando alinhados à autoridade vigente; revisar branches e PRs draft antes de reaproveitar; documentar migrations, impactos, testes e rollback.
9. **Não adicionar dependências operacionais sem decisão**. Preferir serviços já adotados e não criar custo recorrente ou novo canal de transporte sem avaliação e aprovação.

## Fontes existentes

- AGENTS.md
- PROJECT.md
- docs/00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md
- docs/00_governanca/REGISTRO_DE_DECISOES.md
- ARCHITECTURE.md
- MANIFEST.json
- docs/decisions/ADR-0003_click-mais-os-arquitetura-producao.md
- docs/decisions/ADR-0005_trello-cockpit-crm-v1.md
- docs/decisions/ADR-0006_origem-lead-pipeline-comercial-v1.md

Qualquer ajuste desta constituição precisa continuar alinhado às fontes acima e registrar a decisão quando alterar comportamento ou arquitetura.
