// Versioned defaults from existing request data. Missing historical values stay missing.
// Explicitly saved arrays, including an intentionally empty array, always win.
export function applyRecordSources(definition, values, context) {
  const result = { ...values };
  const items = (context.lineItems || []).filter((item) => String(item.name || '').trim() && item.amount !== '' && item.amount != null && Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0);
  const tier = context.answers?.proposalTier;
  for (const field of definition.fields) {
    if (values[field.key] !== undefined || !items.length) continue;
    if (field.recordSource === 'pap-requirements-v1') {
      const groups = new Map();
      for (const item of items.filter((item) => ['PS', 'MOOE', 'FINEX', 'CO'].includes(item.category))) {
        const key = item.category;
        const row = groups.get(key) || { col_A: `${context.common?.programPap || context.common?.projectName || 'P/A/P awaiting confirmation'} / ${key}`, col_B: tier === 'tier1' ? 0 : tier === 'tier2' ? 0 : null, col_C: tier === 'tier2' ? 0 : tier === 'tier1' ? 0 : null, col_E: '', col_F: '' };
        const target = tier === 'tier1' ? 'col_B' : tier === 'tier2' ? 'col_C' : null;
        if (target) row[target] = (Math.round(Number(row[target] || 0) * 100) + Math.round(Number(item.amount) * 100)) / 100;
        groups.set(key, row);
      }
      result[field.key] = [...groups.values()];
    }
    if (field.recordSource === 'climate-proposed-v1') result[field.key] = items.filter((item) => ['MOOE', 'CO'].includes(item.category) && Number(item.climateAmount) > 0).map((item) => {
      const mooe = item.category === 'MOOE' ? Number(item.climateAmount) : 0;
      const co = item.category === 'CO' ? Number(item.climateAmount) : 0;
      return { col_A: item.name, col_B: context.common?.prexcCode || '', col_C: item.climateTypology || '', col_D: tier === 'tier1' ? mooe : tier === 'tier2' ? 0 : null, col_E: tier === 'tier1' ? co : tier === 'tier2' ? 0 : null, col_G: tier === 'tier2' ? mooe : tier === 'tier1' ? 0 : null, col_H: tier === 'tier2' ? co : tier === 'tier1' ? 0 : null };
    });
    if (field.recordSource === 'climate-summary-v1') {
      const groups = new Map();
      for (const item of items.filter((item) => ['MOOE', 'CO'].includes(item.category) && Number(item.climateAmount) > 0)) {
        const label = ({ adaptation: 'Adaptation', mitigation: 'Mitigation' })[item.climateType] || 'Climate classification awaiting confirmation';
        const row = groups.get(label) || { col_A: label, col_B: 0, col_C: 0 };
        const key = item.category === 'MOOE' ? 'col_B' : 'col_C';
        row[key] = (Math.round(row[key] * 100) + Math.round(Number(item.climateAmount) * 100)) / 100;
        groups.set(label, row);
      }
      result[field.key] = [...groups.values()];
    }
  }
  return result;
}
