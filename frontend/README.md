# Frontend

The frontend is the Vite + React application in this directory.

## Structure

- `src/App.tsx`: application shell, navigation, routing between views, and shared state.
- `src/components/`: feature views and reusable UI components.
- `src/context/`: API, theme, and language providers.
- `src/services/`: browser-side API and reporting clients.
- `src/utils/`: presentation and domain helpers.
- `src/index.css`: Tailwind theme tokens, base styles, and responsive foundations.
- `index.html` and `vite.config.ts`: Vite entry and build configuration.

The shared `package.json`, `tsconfig.json`, and `server.ts` remain at repository root because Express and the frontend build use the same Node toolchain. Vite emits the compiled SPA to the root `dist/` directory, which Express serves in production.
