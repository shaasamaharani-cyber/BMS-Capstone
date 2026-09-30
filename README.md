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

### 1. Before you start

- **Node.js 22.13 or newer.** Check with `node -v` in a terminal. If it is older or the command is not found, install the current LTS from https://nodejs.org and open a **new** terminal window. The mock API uses Node's built-in `node:sqlite`, which older versions do not have.

The commands below can be copied exactly as they are. There is no path to fill in. The `npm` commands must run **inside the `dost-bms-web` folder**, not the top-level repo folder (the top level has no `package.json`); the steps below take you there.

### 2. Windows (PowerShell)

PowerShell often blocks `npm` with "running scripts is disabled on this system". Use `npm.cmd` (it always works).

**With Git installed** (https://git-scm.com). This puts the code in a new `BMS-Capstone` folder inside your user folder:

```powershell
cd $HOME
git clone https://github.com/shaasamaharani-cyber/BMS-Capstone
cd BMS-Capstone\dost-bms-web
npm.cmd install
npm.cmd run dev:mock
```

**Without Git** (ZIP download):
1. On the repo page choose **Code -> Download ZIP**, then right-click the ZIP and **Extract All**.
2. In File Explorer open the extracted folders until you are inside **`dost-bms-web`**. You should see `package.json` in the list.
3. Click the address bar at the top of File Explorer, type `powershell` and press **Enter**. A terminal opens already inside that folder.
4. Run:

```powershell
npm.cmd install
npm.cmd run dev:mock
```

You can also use **Command Prompt** (`cmd`) instead of PowerShell, with plain `npm install` and `npm run dev:mock`.

### 3. Mac (Terminal)

**With Git:**

```bash
cd ~
git clone https://github.com/shaasamaharani-cyber/BMS-Capstone
cd BMS-Capstone/dost-bms-web
npm install
npm run dev:mock
```

**Without Git** (ZIP download): unzip it, open Terminal, type `cd ` (with a space after it), drag the **`dost-bms-web`** folder from Finder into the Terminal window and press **Return**. Then run:

```bash
npm install
npm run dev:mock
```

### 4. Open it

Wait until the terminal shows both `SQLite mock API ready` and `Local: http://localhost:5173/`, then open that address (normally http://localhost:5173) and sign in with a test account below. The mock API runs on port 4000 and creates its own database (`mock/mock.sqlite`, not committed) the first time. Stop everything with `Ctrl + C` in the terminal.

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

### If it does not work

| What you see | Cause and fix |
|---|---|
| `running scripts is disabled on this system` (PowerShell) | Use `npm.cmd` instead of `npm`, or use Command Prompt. |
| `Could not read package.json` or `ENOENT ... package.json` | You are in the wrong folder. `cd` into `dost-bms-web` first. |
| `No such built-in module: node:sqlite`, or errors mentioning `node:sqlite` | Node is too old. Run `node -v`; install 22.13 or newer. |
| `'npm' is not recognized` / `command not found: npm` | Node is not installed, or the terminal was open before installing it. Install Node, then open a new terminal. |
| `EADDRINUSE` / `address already in use` | Another copy is still running (port 4000 or 5173). Stop it with `Ctrl + C` in its terminal, or use other ports (below). |
| The page opens but login fails or lists are empty | The mock API is not running. Scroll up in the terminal for the `[sqlite-api]` error. Usually the port problem above. |

To run a second copy at the same time, give its API another port and tell the site where that API is, then start as usual. Vite picks the next free site port by itself (5174, 5175, ...): open the address it prints after `Local:`.

```powershell
# Windows PowerShell
$env:MOCK_API_PORT = "4100"; $env:VITE_API_URL = "http://localhost:4100/api/v1"
npm.cmd run dev:mock
```

```bash
# Mac
MOCK_API_PORT=4100 VITE_API_URL=http://localhost:4100/api/v1 npm run dev:mock
```

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
