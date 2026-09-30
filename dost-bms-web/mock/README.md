# Frontend Mock Data

This folder contains local mock data for `dost-bms-web`.

## Files

- `db.json`: editable seed data and generic JSON Server database.
- `mock.sqlite`: generated SQLite database. It is ignored by git and can be recreated.
- `seed-sqlite.mjs`: recreates `mock.sqlite` from `db.json`.
- `sqlite-api-server.mjs`: local API server backed by SQLite and shaped like the Laravel API.

SQLite data persists across server restarts. The server seeds from `db.json` only when `mock.sqlite` does not exist. To intentionally wipe and recreate the SQLite database, run `npm run mock:reset`.

Relationship seed data is normalized in `db.json`: rows store key fields such as `usr_role_id`, `usr_requesting_unit_id`, `br_requesting_unit_id`, and `br_fiscal_year_id`. The mock API maps those keys back to response objects like `role`, `requesting_unit`, and `fiscal_year` at the route/service layer.

Requester accounts can be bound to a single requesting unit via `usr_requesting_unit_id` (see `requester.co@dost.gov.ph`, `requester.ncr@dost.gov.ph`, `requester.car@dost.gov.ph` in `db.json`). Login and `/auth/me` return the nested `requesting_unit` object; budget request list queries auto-scope to that unit for requester users unless `requesting_unit_id` is passed explicitly.

## Commands

Run the frontend and SQLite mock API together:

```bash
npm run dev:mock
```

That command starts both processes in one terminal:

- SQLite mock API at `http://127.0.0.1:4000/api/v1`
- Vite frontend using `.env.mock`

If Vite's default port is busy, it will automatically choose the next available port and print it in the terminal.

Other commands:

```bash
npm run mock:seed
npm run mock:reset
npm run mock:sync -- requesting-units
npm run mock:api
npm run mock:json
```

`npm run mock:json` starts JSON Server at `http://localhost:4001` for quick CRUD inspection of `db.json`.

## Reset Data

Edit `db.json`, then run this only when you intentionally want to reset SQLite data:

```bash
npm run mock:reset
```

To sync one resource from `db.json` into SQLite without resetting the rest of the database:

```bash
npm run mock:sync -- requesting-units
```
