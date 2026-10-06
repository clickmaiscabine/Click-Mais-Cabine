# Phase 1 — Integration Status v1.2.1

- Canonical spec: Click Mais OS Fase 0 v1.2.1
- Branch: feat/phase1-integration-v1.2.1
- Status: review
- Runtime: LAB only
- Production activation: prohibited
- Observed n8n credentials: 0
- Observed LAB canonical workflows: 25
- Active LAB canonical workflows: 0

## Purpose

This branch reunifies the independently reviewable implementation branches without merging any draft PR into production.

A Git topology split existed because:
- F3 branched from F1;
- F2/F4+ evolved on a parallel stack.

The integration branch keeps each module unchanged and only reunites versioned artifacts/manifests.

## Canonical workflow coverage

25/25 canonical workflows have LAB snapshots:

- CM-WF-000 Ingress Orchestrator
- CM-WF-010 Identity & Event Context
- CM-WF-015 Acquisition Attribution
- CM-WF-020 Fact Extraction & Commit
- CM-WF-030 Quote Engine
- CM-WF-031 Quote Presentation
- CM-WF-040 Commercial Decision Router
- CM-WF-050 Human Handoff
- CM-WF-060 Response Composer
- CM-WF-061 Response Guard & Shadow
- CM-WF-070 Trello Commercial Projection
- CM-WF-071 Trello Human Actions
- CM-WF-080 Follow-up Controller
- CM-WF-090 Closing Intake
- CM-WF-100 Contract Lifecycle
- CM-WF-110 Payment Intake & Verification
- CM-WF-120 Win & Operations Handoff
- CM-WF-130 Art Lifecycle
- CM-WF-140 Logistics & Pre-event
- CM-WF-150 Event Execution Closure
- CM-WF-160 Delivery
- CM-WF-170 Post-sale
- CM-WF-180 Campaign & Remarketing
- CM-WF-900 Audit Watchdog
- CM-WF-910 Replay & Shadow Evaluator

Every observed n8n workflow:
- is under Click Mais OS - LAB;
- active=false;
- has zero production trigger publication;
- remains independently reviewable.

## PR review stack

Draft PRs:
- #7 F1 schema/migrations
- #8 F2 deterministic library
- #9 F3 runtime ingress
- #10 F4 quote engine/presentation
- #11 F5 decision/handoff/composer/guard
- #12 F6 Trello/follow-up
- #13 F7 closing/contract/payment/win
- #14 F8 art/logistics/event
- #15 F9 delivery/post-sale
- #16 F10 campaign/remarketing
- #17 F11 audit/replay

No PR was merged by this integration step.

## Live-system protections still in force

- Supabase remains canonical.
- Trello remains projection/cockpit.
- Trello Comercial live migration not executed.
- 3.1 - LOGISTICA structure not modified.
- WhatsApp/Meta send not connected.
- Autentique write not connected.
- OneDrive delivery adapter not connected.
- JEV/LLM credentials not connected in n8n LAB.
- n8n LAB credential inventory observed empty.
- SEND_ENABLED remains false by implementation.
- CAMPAIGN_SEND_ENABLED remains false by implementation.

## What is complete

Implementation kernels and isolated tests now exist for:
- data/schema;
- deterministic rules;
- ingress/context/facts;
- quote;
- decision/handoff/response guard;
- Trello/follow-up;
- closing/contract/payment/win;
- art/logistics/event execution;
- delivery/post-sale;
- campaign/remarketing;
- audit/watchdog/replay.

## What is NOT yet homologated

Kernel existence is not production homologation.

Remaining integration gates:
1. review and approve the draft PR stack;
2. connect n8n to canonical Supabase/Postgres credentials;
3. implement/query persistence adapters against real DEV data;
4. connect JEV/LLM with closed contracts;
5. connect Meta inbound/outbound while keeping sends disabled;
6. connect Autentique in shadow/test mode;
7. connect OneDrive lookup in shadow/test mode;
8. produce audited Trello Comercial migration plan and execute only after approval;
9. run complete historical replay corpus through CM-WF-910;
10. run integrated shadow vertical slices with audit assertions;
11. homologate CM-WF-900/910;
12. only then consider cutover flags.

## Integration invariant

The integration branch must contain exactly the same 25 canonical workflow IDs in:
- MANIFEST.json workflow registry;
- n8n/WORKFLOW-MANIFEST.json.

Every registered snapshot must:
- exist;
- identify the same canonical ID;
- identify the same LAB workflow ID;
- have active=false;
- have runtime_enabled=false.

This invariant is enforced by CI:
`.github/workflows/phase1-integration.yml`.

## Gate

Phase 1 kernel integration = **review**.

Do not enable production writes or sends from this branch.
