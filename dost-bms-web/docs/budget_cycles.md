# Fiscal-year BP form configuration

Administrators manage forms on **Budget Cycles**. Select an open fiscal year and click **Edit** beside any built-in or custom form, or use **Add BP form** to create one. Closed fiscal years are read-only; reopening a year is available in Settings.

The editor has two sections:

- **Conditional requirements:** keep the existing rules, always require the form, make it optional, or require it when conditions match. Conditions include Tier 1/Tier 2, funding sources, proposal answers and budget amounts. Choose whether any or all enabled conditions must match. Individual conditions and the whole condition set can be paused without deleting them.
- **Form fields:** add, edit, remove and reorder fields. Supported input types are text, long text, number, date, dropdown and checkbox. Mark requester fields as required and enter dropdown choices one per line. Fields can instead be filled automatically from request information or calculated totals.

**Request-level** forms are filled by requesters. **Agency-level** forms remain the responsibility of the completing office at consolidation. Changing a form's level is part of its fiscal-year configuration.

Saving a form immediately saves its fields, requirements and pending changes for the chosen year. Availability switches on the page are saved with **Save FY…**. Configuring an existing form does not change its definitions in other fiscal years. Existing generated line-item tables remain on their forms.

In the requester wizard, the year's enabled forms are selected using the saved conditions. Requesters fill the configured fields online and can save and reopen drafts with their answers intact. **Print / Save as PDF** produces the completed form for signing. The API validates required fields and conditional requirements from the administrator's saved definitions. Signed copies are required for request-level forms; changing the fields invalidates a signed copy made from the earlier definition.

Submitted requests and their version snapshots retain the definitions and answers that were submitted. These appear under **Completed BP forms** on the attached-forms and version tabs, and are included in the version PDF.

Run the focused API and interactive UI regression tests with `npm run test:budget-cycles` from `dost-bms-web`.
