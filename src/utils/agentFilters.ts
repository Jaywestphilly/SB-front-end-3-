export const BLOCKED_HANDLES = new Set([
  'agent_ea09d4',
  'agent_49be6a',
  'agent_bc3d05',
  '8gon_mi_1789090245',
]);

export function publicHandle(a: any): string {
  return String(a?.handle || a?.authorUsername || a?.author?.handle || '')
    .toLowerCase()
    .trim();
}

/** Hex cold handles: agent_ea09d4, agent_49be6a, agent_538832, … */
export function isHexAgentHandle(handle: string): boolean {
  return /^agent_[0-9a-f]{4,}$/i.test(handle);
}

export function isPublicProbeAgent(a: any): boolean {
  if (!a) return true;
  if (a.isTestAgent === true) return true;

  const handle = publicHandle(a); // HANDLE only — do not use agentId (agent_auto_*)

  if (BLOCKED_HANDLES.has(handle)) return true;
  if (isHexAgentHandle(handle)) return true; // CRITICAL — must run before response

  if (/^(tictac_|status_check_|apitest_|8gon_|test_|probe_)/i.test(handle)) return true;
  if (handle.includes('probe') || /_probe(_|$)/i.test(handle)) return true;

  const desc = String(a.description || a.bio || a.summary || a.content || a.title || '').toLowerCase();
  const name = String(a.displayName || a.agentName || a.name || '').toLowerCase();
  if (/probe|ledger probe|paste a|cold register|onboarding probe|ephemeral|qa probe|post-deploy/.test(desc)) return true;
  if (/probe|ledger probe|paste a|cold register|onboarding probe|ephemeral|qa probe|post-deploy/.test(name)) return true;

  return false;
}

export function isProbeAgent(a: any): boolean {
  if (!a) return false;
  if (isPublicProbeAgent(a)) return true;
  const h = String(a?.handle || a?.username || a?.name || a?.operatorUsername || a?.displayName || a?.agentName || a?.authorUsername || a?.author?.handle || a?.authorName || a?.authorId || "").toLowerCase();
  const d = String(a?.description || a?.bio || a?.summary || a?.content || a?.title || "").toLowerCase();
  const id = String(a?.id || a?.agentId || "").toLowerCase();
  if (a?.isTestAgent === true || a?.author?.isTestAgent === true) return true;
  if (/^(tictac_|trb_verify_|test_|probe_|status_check_|scope_check_|apitest_|growth_audit|8gon_|backend_write)/.test(h)) return true;
  if (/_probe|_chk_|_acc_|_green_|_dep_|_cw_/.test(h)) return true;
  if (/ephemeral|qa probe|acceptance|post-deploy|green check|write.?chk|dep.?chk/.test(d) || /ephemeral|qa probe|acceptance|post-deploy|green check/.test(h)) return true;
  if (/tictac_|status_check_|apitest_|growth_audit|_probe|_chk_|_dep_|_cw_/.test(id)) return true;
  return false;
}

export function isTheaterLabel(s: string): boolean {
  const t = String(s || "");
  return /SEC\s*13F\s*VERIFIED|QUANT\s*MATRIX\s*AUDITED|13F\s*Whale|Whale\s*Whisperer|SEC\s*13F|QUANT\s*MATRIX/i.test(t);
}

export function scrubLabels(list: any[] | undefined): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => (typeof x === "string" ? x : x?.name || x?.label || ""))
    .map(String)
    .filter((s) => s && !isTheaterLabel(s));
}

export function scrubPublicTheaterLabels(a: any): any {
  if (!a) return a;
  return {
    ...a,
    badges: scrubLabels(a.badges || a.metrics?.badges),
    specialties: scrubLabels(a.specialties),
    modelType: isTheaterLabel(a.modelType) ? "Institutional Flow / Multi-Strat" : a.modelType
  };
}
