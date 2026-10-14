import PropTypes from 'prop-types';
import { getCycleFormCatalog } from '../../bp_forms/bp_form_catalog';
import { buildFormView } from '../../bp_forms/bp_form_fields';

// Read saved definitions rather than the live fiscal-year cycle, so submitted forms retain their labels and values.
export default function UnifiedRequestFormsSummary({ unified }) {
  if (!unified?.requiredForms?.length) return null;
  const catalog = getCycleFormCatalog({ custom_forms: unified.customForms, form_configs: unified.formConfigs });
  const context = { common: unified.common || {}, totals: unified.totalsAtGeneration || { psTotal: 0, mooeTotal: 0, coTotal: 0 }, lineItems: [], formValues: unified.formValues || {}, formConfigs: unified.formConfigs || {} };
  const forms = unified.requiredForms.flatMap((entry) => {
    const form = catalog.find((row) => row.id === entry.formId);
    const view = buildFormView(entry.formId, context);
    return form && view ? [{ form, view }] : [];
  });
  if (!forms.length) return null;
  return (
    <section className="card border rounded-3 p-4 mb-3">
      <h6 className="fw-bold">Completed BP forms</h6>
      {forms.map(({ form, view }) => (
        <details className="border rounded p-3 mb-2" key={form.id}>
          <summary className="fw-semibold">{form.code} - {form.name}</summary>
          <dl className="row small mt-3 mb-0">
            {view.fields.map((field) => (
              <div className="col-md-6 mb-3" key={field.key}>
                <dt>{field.label}</dt>
                <dd className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{typeof field.value === 'boolean' ? field.value ? 'Yes' : 'No' : String(field.value ?? '') || '-'}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </section>
  );
}

UnifiedRequestFormsSummary.propTypes = { unified: PropTypes.object };
