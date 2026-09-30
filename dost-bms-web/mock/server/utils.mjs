export function activeFilter(items, params, key) {
  if (!params.has(key)) return items;
  return items.filter((item) => String(item[key]) === String(params.get(key)));
}

export function sortItems(items, params, fieldMap = {}) {
  const sortBy = params.get('sort_by');
  if (!sortBy) return items;

  const sortDir = String(params.get('sort_dir') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const resolver = fieldMap[sortBy] || ((item) => item?.[sortBy]);

  return [...items].sort((left, right) => {
    const a = resolver(left);
    const b = resolver(right);
    const aTime = Date.parse(a);
    const bTime = Date.parse(b);
    const bothDates = !Number.isNaN(aTime) && !Number.isNaN(bTime);
    const result = bothDates
      ? aTime - bTime
      : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });

    return sortDir === 'desc' ? -result : result;
  });
}

export function money(value) {
  return `₱ ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

export function timestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
