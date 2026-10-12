# Localidades atendidas — mapeamento homologado

Status: homologated  
Decisão: DEC-017, 2026-10-11

A correspondência **localidade canônica + aliases autorizados → faixa de preço** está na base comercial aprovada em 11/10/2026, armazenada em área restrita (Biblioteca do ChatGPT) e anexada ao [projeto Notion](https://app.notion.com/p/3eb9fb22b1fa81bcbbbeff9a92ad140d). Consulte `knowledge/pricing.md` para o SHA-256 de origem e as regras de uso.

- 234 localidades mapeadas; 233 OK e 1 REVISAR.
- `raposo tavares`: **REVISAR**; não emitir preço automático, exigir localização precisa e handoff humano.
- Normalizar acentos, caixa, espaços e aliases expressos na base; não aceitar substring solta dentro de nomes diferentes nem inferir preço só por semelhança textual incerta.
- Se não encontrar cidade/bairro: esclarecer uma vez; permanecendo sem correspondência, handoff.
- Atender apenas às regiões e localidades explicitamente permitidas na planilha. Não aplicar automaticamente os cortes de distância historicamente propostos a localidades inéditas.
- Jamais declarar disponibilidade do evento apenas com base na tabela de localidades.
- Não copiar o XLSX/YAML integral para este GitHub público; importar a versão aprovada em armazenamento operacional protegido, com testes de paridade e rastreabilidade.
