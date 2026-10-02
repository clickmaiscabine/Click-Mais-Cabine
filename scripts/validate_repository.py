#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {"draft","development","review","homologated","production","deprecated","archived"}
errors = []

def err(msg):
    errors.append(msg)

def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"JSON inválido: {path.relative_to(ROOT)}: {exc}")
        return None

manifest_path = ROOT / "MANIFEST.json"
manifest = load_json(manifest_path)
if isinstance(manifest, dict):
    if manifest.get("project") != "click-mais-cabine":
        err("MANIFEST.json: project inesperado")
    values = set(manifest.get("artifact_status_values", []))
    if values != ALLOWED:
        err("MANIFEST.json: artifact_status_values diverge da lista canônica")
    registries = manifest.get("registries", {})
    seen_ids = set()
    for registry_name, items in registries.items():
        if not isinstance(items, list):
            err(f"MANIFEST.json: registry {registry_name} não é lista")
            continue
        for item in items:
            if not isinstance(item, dict):
                err(f"MANIFEST.json: item inválido em {registry_name}")
                continue
            artifact_id = item.get("id") or item.get("version")
            if artifact_id:
                key=(registry_name,str(artifact_id))
                if key in seen_ids:
                    err(f"MANIFEST.json: ID duplicado {key}")
                seen_ids.add(key)
            status=item.get("status")
            if status and status not in ALLOWED:
                err(f"MANIFEST.json: status inválido {status} em {registry_name}")
            path=item.get("path")
            if path and not (ROOT/path).exists():
                err(f"MANIFEST.json: caminho inexistente {path}")

for folder in ["schemas","n8n/workflows","n8n/subflows","n8n/fixtures"]:
    base=ROOT/folder
    if base.exists():
        for p in base.rglob("*.json"):
            load_json(p)

patterns=[
    ("n8n/workflows", re.compile(r"^CM-WF-\d{3}_[a-z0-9][a-z0-9-]*\.json$")),
    ("n8n/subflows", re.compile(r"^CM-SF-\d{3}_[a-z0-9][a-z0-9-]*\.json$")),
]
for folder,pat in patterns:
    base=ROOT/folder
    if base.exists():
        for p in base.glob("*.json"):
            if not pat.match(p.name):
                err(f"Nome fora do padrão: {p.relative_to(ROOT)}")

required=[
    "README.md","AGENTS.md","PROJECT.md","ARCHITECTURE.md",
    "MANIFEST.json","SECURITY.md","CONTRIBUTING.md",".env.example"
]
for rel in required:
    if not (ROOT/rel).exists():
        err(f"Arquivo obrigatório ausente: {rel}")

if errors:
    print("VALIDAÇÃO FALHOU")
    for e in errors:
        print(f"- {e}")
    sys.exit(1)

print("VALIDAÇÃO OK")
print("Manifest, caminhos e JSONs canônicos estão consistentes.")
