import PropTypes from 'prop-types';
import StructuredField from './structured_field';
import FormSignatories from './form_signatories';
import { getCycleFormCatalog } from '../../bp_forms/bp_form_catalog';
import { buildFormView } from '../../bp_forms/bp_form_fields';
import { isRepeatingField } from '../../bp_forms/form_schema';

// Read saved definitions rather than the live fiscal-year cycle, so submitted forms retain their labels and values.
export default function UnifiedRequestFormsSummary({ unified }) {
  if (!unified?.requiredForms?.length) return null;
  const catalog = unified.formCatalog || getCycleFormCatalog({ custom_forms: unified.customForms, form_configs: unified.formConfigs });
  const context = { common: unified.common || {}, answers: unified.answers || {}, totals: unified.totalsAtGeneration || { psTotal: 0, mooeTotal: 0, coTotal: 0 }, lineItems: unified.lineItems || [], formDefinitions: unified.formDefinitions, formValues: unified.formValues || {}, formConfigs: unified.formConfigs || {} };
  const forms = unified.requiredForms.flatMap((entry) => {
    const form = catalog.find((row) => row.id === entry.formId);
    const view = buildFormView(entry.formId, context);
    return form && view ? [{ form, view }] : [];
  });
  if (!forms.length) return null;
  return (
    <section className="card border rounded-3 p-4 mb-3">
      <h6 className="fw-bold">Submitted BP working schedules</h6><p className="small text-muted">Financial amounts are in pesos; performance targets use indicator units. Official DBM templates and office certification remain required.</p>
      {forms.map(({ form, view }) => (
        <details className="border rounded p-3 mb-2" key={form.id}>
          <summary className="fw-semibold">{form.code} - {form.name}</summary>
          <dl className="row small mt-3 mb-0">
            {view.fields.map((field) => (
              <div className="col-md-6 mb-3" key={field.key}>
                <dt>{field.label}</dt>
                <dd className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{isRepeatingField(field) ? <StructuredField field={field} value={field.value} context={context} /> : typeof field.value === 'boolean' ? field.value ? 'Yes' : 'No' : field.type === 'attachment' ? field.value?.name || '-' : String(field.value ?? '') || '-'}</dd>
              </div>
            ))}
          </dl>
          {view.table && <div className="table-responsive"><table className="table table-sm small"><thead><tr>{view.table.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{view.table.rows.map((row, index) => <tr key={index}>{view.table.columns.map((column) => <td key={column.key}>{row[column.key] ?? 'Awaiting data'}</td>)}</tr>)}</tbody></table></div>}
          <FormSignatories signatories={view.signatories} values={unified.formValues?.[form.id]} />
        </details>
      ))}
    </section>
  );
}

UnifiedRequestFormsSummary.propTypes = { unified: PropTypes.object };
