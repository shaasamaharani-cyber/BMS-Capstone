# BMS Capstone - Budget Management System expansion (P611)

QUT capstone project IFB398/IFB399, Team T214, for the Philippines Department of Science and Technology (DOST).
The project extends the Budget Management System (BMS) first built by Team 27: a guided budget request with the DBM
BP forms, and role-based dashboards for budget execution.

## What is in this repo

| Folder | What it is |
|---|---|
| `dost-bms-web/` | The React front end and a local mock API (SQLite). This is what runs today. |
| `dost-bms-web/docs/` | Working notes: what is built, design rules, the dashboard plan by role, and open questions for DOST. Start with `dashboard_role_plan.md`. |

DOST wants the production system in PHP Laravel. The mock API in `dost-bms-web/mock/` is shaped like that future API so the
front end can switch over later. Any Laravel back end will be added to this repo next to `dost-bms-web/`.

## Run it locally

Needs Node.js 22 or newer (the mock API uses the built-in `node:sqlite`).

```bash
cd dost-bms-web
npm install
npm run dev:mock
```

Open http://localhost:5173. The mock API starts on port 4000 and creates its own database (`mock/mock.sqlite`, not committed) the first time.
On Windows PowerShell use `npm.cmd` instead of `npm` if scripts are blocked.

Test accounts (password `Test12345`):

| Role | Email |
|---|---|
| Requester (per unit) | `requester.ncr@dost.gov.ph`, `requester.co@dost.gov.ph`, `requester.car@dost.gov.ph` |
| Budget officer | `tech.staff@dost.gov.ph` |
| Finance director | `finance.director@dost.gov.ph` |
| Planning director | `planning.director@dost.gov.ph` |
| Main administrator | `main.admin@dost.gov.ph` |
| Technical administrator | `tech.admin@dost.gov.ph` |

Restart the mock API after changing anything under `dost-bms-web/mock/`. To reset the data, delete `dost-bms-web/mock/mock.sqlite`
and start again.

## Team workflow

- Work on a branch and open a pull request into `main`. Do not commit straight to `main`.
- Keep the original Team 27 look: same layout, tokens (`src/styles/tokens.css`) and UI components (`src/components/ui`).
- The browser and the mock API are not trusted. Every validation and scoping rule must be repeated on the Laravel server.
