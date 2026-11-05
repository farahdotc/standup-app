# Sprint Buddy

A one-page dashboard for running daily stand-up: sprint pulse, epic progress, Jira insights, carryover risks, and a daily icebreaker question with a random name picker.

Everything you type in Edit mode is saved in the browser (localStorage), so the dashboard looks the same the next time it's opened on that machine.

## Run it

```bash
npm install
npm run dev      # local dev server at http://localhost:5173
npm run build    # production build in dist/ (Netlify runs this)
npm run lint
```

## Project layout

| Path | What it holds |
| --- | --- |
| `src/components/StandupCommandCenter.jsx` | The dashboard and its sections |
| `src/data/dailyQuestions.js` | Icebreaker questions (one per day, rotates by date) |
| `src/data/trivia.js` | True/false trivia, parked for later |
| `src/features/useTeamFacts.js` | "Mystery fact" feature backed by Firestore, parked for later |
| `src/lib/utils.js` | Date math, shuffling, rich-text cleaning, safe saving |
| `seed.mjs` | Imports people and facts from Microsoft Forms exports into Firestore |

The team list for the name picker is `TEAM_MEMBERS` at the top of the component.

## Seeding team facts

Firebase settings live in `.env` (not committed):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Download the two Forms exports ("Mystery Fact Code Registration" and "One Thing You'd Never Guess About Me") to `~/Downloads`, then run:

```bash
npm run seed
# or point at another folder:
SEED_DIR=~/Desktop/forms npm run seed
```

The script only adds new people and facts, so it's safe to rerun.
