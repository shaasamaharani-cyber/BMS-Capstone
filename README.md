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

## Live demo (free hosting on Render)

`render.yaml` at the top of this repo describes a free demo host: one web service that serves the site and the mock API together, so there is one link to share. It is for showing the system, not the production setup.

To publish it (once, by anyone on the team with a free Render account):
1. On https://render.com choose **New -> Blueprint** and connect this GitHub repo.
2. Render reads `render.yaml`. Confirm, and wait for the first build (a few minutes).
3. Copy the service address (like `https://bms-t214-demo.onrender.com`), then put it in the repo's **About -> Website** box so it shows on the front page, and add it here.

Good to know:
- The free plan sleeps when idle, so the first visit after a quiet period takes about 30 seconds.
- The data resets to the seed data whenever the service restarts or redeploys.
- The mock API does **not check passwords**: anyone who can open the link can log in as any test account, including admins. It holds only mock data. Do not put real DOST data in it. If the link should not be public, use a private repo or add a login in front (ask before sharing it outside the team).
- It redeploys by itself each time `main` changes.

## Team workflow

- Work on a branch and open a pull request into `main`. Do not commit straight to `main`.
- Keep the original Team 27 look: same layout, tokens (`src/styles/tokens.css`) and UI components (`src/components/ui`).
- The browser and the mock API are not trusted. Every validation and scoping rule must be repeated on the Laravel server.
