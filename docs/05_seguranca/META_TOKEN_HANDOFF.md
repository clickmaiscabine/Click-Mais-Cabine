# Handoff do token Meta para testes n8n

Status: development  
Data: 2026-10-10

## Guarda atual e autorização

Regis informou que o token definitivo está sob guarda do Hermes. Seu valor não foi fornecido, acessado ou validado nesta atualização. A documentação registra opção de expiração “Nunca” e as permissões whatsapp_business_messaging, whatsapp_business_management e business_management.

Regis autoriza solicitar a instalação segura quando necessária aos testes: pode inserir a credencial diretamente no local indicado ou pedir ao Hermes que a instale. Esta autorização não inclui revelar o valor em conversa, relatório, commit, export de workflow ou log. Não há comprovação de canal direto com Hermes nesta sessão.

## Destino preferencial

Conforme SECURITY.md, credenciais de nodes ficam no Credential Store do n8n. Usar a credencial compatível com o node do workflow de laboratório existente, com nome sugerido **CMC Meta WhatsApp — TESTE**, e referenciá-la no node sem incorporar o valor ao JSON.

Se o workflow exigir configuração por ambiente, usar o secret store/ambiente privado da VPS com a variável já prevista em .env.example: `META_ACCESS_TOKEN`. Não preencher .env.example, não versionar .env e não usar variável pública de frontend. A escolha definitiva depende do workflow real.

## Procedimento de instalação

1. Identificar o workflow, node, tipo de credencial e quem tem acesso ao projeto n8n.
2. Informar a Regis ou ao Hermes o destino exato no Credential Store; não pedir o valor pelo chat.
3. Inserir o token diretamente no campo protegido. O Hermes deve confirmar apenas instalação, referência da credencial e resultado; omitir o segredo.
4. Associar a credencial ao node de testes e usar Test Phone Number ID 1350381714825884.
5. Validar autenticação e envio somente a destinatário de teste autorizado. Registrar evidência sem Authorization header.
6. Guardar referência não secreta da credencial e data da validação na documentação; não exportar seu conteúdo.

O token de acesso não é o App Secret nem o Verify Token do webhook. Estes valores também não entram no Git. A opção “Nunca” não impede revogação ou perda de permissões. Não reutilizar o token temporário compartilhado em conversa anterior; sua revogação não está comprovada.

Não habilitar produção, migrar número real, criar nova WABA ou ampliar acesso nesta etapa.

Registro do ambiente: [Meta WhatsApp teste](../integrations/META_WHATSAPP_TEST_SETUP.md).
