# Snapshot de fonte oficial — BR-002

Status: review

`localidades-precos.approved.md` é a cópia integral da revisão do Drive identificada em
`localidades-precos.provenance.json`. Serve para verificar o catálogo recebido pelo motor;
não é uma tabela de preços editável nem uma fonte comercial independente.

Não editar preços/localidades aqui. Uma revisão nova exige leitura da fonte oficial,
reconciliação humana/técnica, atualização da proveniência e dos testes. O gerador verifica
o SHA-256 antes de extrair a coluna Pix unitário e as localidades/aliases.

O orçamento corporativo registra arquivo, revisão, hash e source_version do catálogo
consultado. O motor bloqueia preços divergentes, overrides de faixa e revisões não
reconciliadas. O orquestrador deve obter o catálogo do Supabase e conferir a revisão
operacional da fonte antes de fornecê-la ao motor; a LLM não fornece preços ou proveniência.
