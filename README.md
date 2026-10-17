# fintrace-web

The web UI for fintrace: a single-page React app, served through the fintrace BFF.

React 19, TypeScript, Vite, React Router, TanStack Query, shadcn/ui over Tailwind 4.

```bash
./run.sh npm install
./run.sh dev            # http://localhost:5173
./run.sh npm run build
```

`run.sh` runs Node in Docker, so the host needs Docker only.
