# Figma high-fidelity prototype

A Figma copy of the BMS web app (`dost-bms-web/`), taken from the running app so layout, colours, text, icons and charts match it.

- `plugin/` builds the prototype in Figma: 29 screens across the five roles, with clickable links between them.
- `tools/` captures the screens from the running app and regenerates the plugin.

## Build the prototype in Figma

You need the Figma desktop app; development plugins do not run in the browser.

1. Open the design file you want the prototype in (for example "DOST BMS - High Fidelity Prototype").
2. Choose **Plugins -> Development -> Import plugin from manifest...** and pick `design/figma-prototype/plugin/manifest.json`.
3. Run **Plugins -> Development -> DOST BMS Prototype Builder**. It takes about a minute. When it finishes it shows "Built 29 screens and ... prototype links".

The plugin builds into the current page. If a screen with the same name already exists there, the plugin replaces it, so running it again is safe.

## What you get

| Section | Screens |
|---|---|
| Sign in | Login |
| Requester | Dashboard, Budget Requests, Request Detail, Spending Monitoring |
| Requester - New budget request wizard | Steps 1-5 (Request details, Questions, Required forms, Pre-filled forms, Review & submit) |
| Budget & Finance Division | Dashboard, Budget Review, Review Detail, Budget Consolidation, Consolidation Detail, Spending Monitoring, Reports, Forms |
| Finance Director | Dashboard, Budget Consolidation, Consolidation Detail, Spending Monitoring, Reports, Forms |
| Administrator | Dashboard, Users & Roles, Budget Cycles, Forms, Settings |

Every layer is editable: frames keep the CSS class names, text is live Inter text, and icons and charts are vectors.

The prototype links work like the app:
- The sidebar menu goes to each page for that role.
- Table rows and Review / View / Actions buttons open the detail page.
- Back and Close return to the list.
- **+ New Request** opens the wizard. In the wizard, Next, Back and the step headers move between steps.
- LOGIN signs in as the requester.
- The user menu in the top bar goes back to Login.

The sidebar stays fixed while a page scrolls.

To try it, press **Present** (the play button). There are flow starting points for Sign in and for each role's dashboard. For the best result, set the prototype device to **Desktop** at 1440 wide.

## Refresh it after the app changes

1. Start the app as described in the top-level README (`npm run dev:mock` in `dost-bms-web`).
2. Run these from this folder (`design/figma-prototype`):

```bash
cd tools
node capture.cjs screens.json out      # signs in as each test account and captures every screen
python3 gen_plugin.py ../plugin        # rebuilds plugin/code.js from tools/out
```

Then run the plugin again in Figma. To add a screen, add it to `tools/screens.json` (id, name, test account, route) and to `ROWS` in `tools/gen_plugin.py`.
