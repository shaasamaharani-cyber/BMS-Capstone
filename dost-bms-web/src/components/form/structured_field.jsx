import PropTypes from 'prop-types';
import GuidedFieldInput from './guided_field_input';

export default function StructuredField({ field, value, onChange, context }) {
  return <GuidedFieldInput field={{ ...field, type: field.type || 'table' }} value={value} onChange={onChange} context={context} />;
}
StructuredField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.array, onChange: PropTypes.func, context: PropTypes.object };
