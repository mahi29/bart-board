# BART Commute Dashboard

Minimal personal commute dashboard built with React and Vite.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local Vite URL shown in the terminal.

Create `.env.local` with:

```bash
VITE_BART_API_KEY=your_bart_api_key_here
```

## Notes

- Auto-refreshes every 30 seconds
- Shows the next 2 matching departures for:
  - West Dublin -> Daly City
  - Montgomery St -> Dublin/Pleasanton
- Weather uses Open-Meteo with San Ramon, CA coordinates as the home-weather default
