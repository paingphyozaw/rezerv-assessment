# Rezerv Frontend Engineering Assessment

Two independent parts, each with its own README, dependencies, and deployment.

| Part | Folder | Live site |
|---|---|---|
| 1 — UI Animation Challenge | [`part-1-ui-animation-challenge/`](part-1-ui-animation-challenge/) | _TBD_ |
| 2 — Component Engineering Challenge | [`part-2-component-engineering-challenge/`](part-2-component-engineering-challenge/) | _TBD_ |

## Running a part

Requires Node 22.18+. Each part installs and runs on its own:

```sh
cd part-1-ui-animation-challenge
npm install
npm run dev
```

See each part's README for its scripts, approach, and assumptions.

## Deployment

Each part is a separate Vercel project that imports this repository, with **Root Directory** set to that part's folder.
