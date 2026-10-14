// All amounts are pesos. Round each entry to centavos before summing.
export const EXPENDITURE_CLASSES = ['PS', 'MOOE', 'FINEX', 'CO'];
export const CLIMATE_EXPENDITURE_CLASSES = ['MOOE', 'CO'];
export const categoryCode = (value) => String(value || '').toUpperCase();
export const toCentavos = (value) => Math.round((Number(value) + Number.EPSILON) * 100);
export const validPesoAmount = (value) => ['string', 'number'].includes(typeof value)
  && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
  && Number.isSafeInteger(toCentavos(value)) && Math.abs(Number(value) * 100 - toCentavos(value)) < 0.0001;

export function computeBudgetLineItemTotals(items = []) {
  const sums = { psTotal: 0, mooeTotal: 0, finexTotal: 0, coTotal: 0, tagTotal: 0, climateTotal: 0, grandTotal: 0 };
  const keys = { PS: 'psTotal', MOOE: 'mooeTotal', FINEX: 'finexTotal', CO: 'coTotal', TAG: 'tagTotal' };
  for (const item of items) {
    const code = categoryCode(item.category);
    const amount = Number.isFinite(Number(item.amount)) ? toCentavos(item.amount) : 0;
    if (keys[code]) sums[keys[code]] += amount;
    // Legacy TAG entries remain monetary entries, unclassified until explicitly reviewed.
    sums.grandTotal += amount;
    if (CLIMATE_EXPENDITURE_CLASSES.includes(code) && validPesoAmount(item.climateAmount ?? 0)) sums.climateTotal += toCentavos(item.climateAmount ?? 0);
  }
  return { ...Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, value / 100])), legacyTagTotal: sums.tagTotal / 100 };
}

export function financialItemFromStored(item, categories = []) {
  return {
    name: item.bri_description || '',
    category: categories.find((category) => Number(category.bcat_id ?? category.id) === Number(item.bri_category_id))?.bcat_code || '',
    amount: item.bri_planned_amount,
    costStructure: item.bri_cost_structure,
    justification: item.bri_justification,
    climateAmount: item.bri_climate_amount ?? 0,
    climateTypology: item.bri_climate_typology || '',
    climateType: item.bri_climate_type || '',
    objectCode: item.bri_object_code || '',
  };
}

export function getLineItemErrors(item, { allowLegacy = false } = {}) {
  const errors = [];
  const code = categoryCode(item.category);
  if (!String(item.name || '').trim()) errors.push('Enter a line item description.');
  if (!EXPENDITURE_CLASSES.includes(code) && !(allowLegacy && code === 'TAG')) errors.push('Choose PS, MOOE, FinEx or CO for each line item.');
  if (!validPesoAmount(item.amount)) errors.push('Enter a non-negative peso amount with at most two decimal places.');
  if (!validPesoAmount(item.climateAmount === '' ? 0 : item.climateAmount ?? 0) || Number(item.climateAmount || 0) > Number(item.amount)) errors.push('Climate expenditure must be between zero and the line item amount.');
  if (Number(item.climateAmount) > 0) {
    if (!CLIMATE_EXPENDITURE_CLASSES.includes(code)) errors.push('BP 207 climate expenditure must belong to MOOE or CO.');
    if (!String(item.climateTypology || '').trim() || !['adaptation', 'mitigation'].includes(item.climateType)) errors.push('Enter the climate typology and choose adaptation or mitigation.');
  }
  return errors;
}
