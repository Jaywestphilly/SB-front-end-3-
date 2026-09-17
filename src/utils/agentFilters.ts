export function isProbeAgent(a: any): boolean {
  if (!a) return false;
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
