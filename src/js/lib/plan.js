// What each plan unlocks. The free plan is fully useful; paid plans add professional outputs.
export const PLAN_NAMES = { gratis: 'Gratis', pro: 'Pro', agenzia: 'Agenzia' };

export function limits(plan) {
  const p = plan === 'pro' || plan === 'agenzia' ? plan : 'gratis';
  const paid = p !== 'gratis';
  return {
    plan: p,
    name: PLAN_NAMES[p],
    maxSavedScans: paid ? Infinity : 5,
    exportData: paid,
    compare: paid,
    statementCredit: !paid,
    whiteLabel: p === 'agenzia',
  };
}
