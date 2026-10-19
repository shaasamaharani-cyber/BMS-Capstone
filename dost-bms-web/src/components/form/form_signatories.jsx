import PropTypes from 'prop-types';

export default function FormSignatories({ signatories, values = {} }) {
  if (!signatories?.length) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(values.approvalDate || '') ? values.approvalDate.split('-').reverse().join('/') : values.approvalDate || '____ / ____ / ________';
  return <div className="mt-4" aria-label="Prepared by and approved by">
    <p className="small text-muted">Printed names are metadata. Blank signature lines and typed names do not record certification or approval in this system.</p>
    <div className="row g-4">{signatories.map((signer) => <div className="col-sm-4" key={signer.key}>
      <strong>{signer.label}</strong><div>{values[signer.key] || '____________________________'}</div>
      <div className="mt-3">Signature: ____________________</div>
    </div>)}</div>
    <p className="mt-3">Date (day / month / year): {date}</p>
  </div>;
}
FormSignatories.propTypes = { signatories: PropTypes.array, values: PropTypes.object };
