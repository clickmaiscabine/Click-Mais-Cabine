import { normalizeIngress, planIntake, buildJevRequest, mapJevResponse } from '../../functions/intake/intake.mjs';

// db.query must use bound parameters. Works with pg and the isolated PGlite harness.
export async function processMessage(db, normalized, decide = null) {
  if (!normalized.accepted) return planIntake(normalized);
  for (let attempt = 0; attempt < 3; attempt++) {
    const snapshot = (await db.query('select business.get_quote_intake_context($1::jsonb) as snapshot', [JSON.stringify(normalized.message_context)])).rows[0].snapshot;
    let plan = planIntake(normalized, snapshot);
    if (plan.requires_jev && decide) {
      const context = buildJevRequest(normalized.message_context,snapshot);
      try { plan = planIntake(normalized,snapshot,mapJevResponse(await decide(context.request),context)); }
      catch { plan.semantic_provider_failed = true; }
    }
    try {
      const result = (await db.query('select business.commit_quote_intake_plan($1::jsonb) as result', [JSON.stringify(plan)])).rows[0].result;
      return { ...plan, persistence: result, route: result.route ?? plan.route, effects:result.effects,
        proposed_response:result.proposed_response??null,ready_for_quote_checks:result.ready_for_quote_checks===true };
    } catch (error) {
      if (error.code !== '40001' || attempt === 2) throw error;
    }
  }
}
export async function processPayload(db,payload,decide=null) {
  const results = [];
  // Array order is preserved. Separate concurrent executions retry against persisted versions.
  for (const message of normalizeIngress(payload)) results.push(await processMessage(db,message,decide));
  return results;
}
