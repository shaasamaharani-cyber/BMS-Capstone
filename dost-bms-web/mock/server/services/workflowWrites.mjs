// Snapshot generation awaits file I/O. Keep workflow mutations for a database
// in order so another submission cannot reserve the same version ID or decide
// an approval before the preceding submission has finished capturing its forms.
const writes = new WeakMap();
export function serializeWorkflowWrite(db, operation) {
  const previous = writes.get(db) || Promise.resolve();
  const current = previous.then(operation);
  writes.set(db, current.catch(() => {}));
  return current;
}
