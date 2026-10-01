/**
 * System Name: Budget Management System
 * Module Name: Dashboard
 *
 * Purpose of this file:
 * Sample data for the enhanced Budget Execution Monitoring sections.
 */

// Placeholder figures until the API returns projections, alerts and planning insight
export const SAMPLE_INSIGHTS = {
  projectedYearEnd: 4_800_000,
  projectedVariance: 536_000,
  expenditure: {
    labels: ['FY 21', 'FY 22', 'FY 23', 'FY 24', 'FY 25', 'FY 26', 'FY 27', 'FY 28'],
    todayIndex: 5,
    values: [2.2, 2.9, 3.4, 4.1, 5.9, 6.4, 7.1, 8.1].map((dblBillions) => dblBillions * 1e9),
    subtitle: 'FY 2021 – 2028 (₱ Billion)',
    yTicks: [0, 3e9, 6e9, 10e9],
  },
  alerts: [
    { key: 'rnd',      level: 'danger',  title: 'R&D',      message: 'Projected expenditure is expected to exceed the current allocation by ₱48M.' },
    { key: 'mooe',     level: 'warning', title: 'MOOE',     message: '92% of the available annual budget has already been utilised.' },
    { key: 'training', level: 'notice',  title: 'Training', message: 'Only 31% of the annual allocation has been utilised.' },
  ],
  planningYear: 2027,
  planning: [
    {
      key: 'rnd', title: 'R&D', allocation: '₱100M', projected: '₱148M', projectedTone: 'danger',
      suggested: '₱150M ↑ 50%', suggestedTone: 'info', insightTone: 'info',
      insight: 'R&D expenditure is projected to exceed its 2026 allocation. An increased allocation may be required.',
    },
    {
      key: 'mooe', title: 'MOOE', allocation: '₱50M', projected: '₱46M', projectedTone: 'ok',
      suggested: '₱48M ↑ 4%', suggestedTone: 'info', insightTone: 'ok',
      insight: 'MOOE utilisation is within expected range. A modest increase aligned with projected spending is suggested.',
    },
    {
      key: 'training', title: 'Training', allocation: '₱20M', projected: '₱6.2M', projectedTone: 'warning',
      suggested: '₱15M ↓ 25%', suggestedTone: 'danger', insightTone: 'warning',
      insight: 'Training budget is significantly under-utilised. A reduced allocation may be appropriate unless new programmes are planned.',
    },
  ],
};
