# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- Lightweight: No heavy UI frameworks - uses only vanilla CSS and React
- Modern UI: Clean, responsive design with KAVIA brand styling
- Fast: Minimal dependencies for quick loading times
- Simple: Easy to understand and modify

## Getting Started (local Node)

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open http://localhost:3000 to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Run with Docker Compose (recommended for full stack)

The repo root includes a `docker-compose.yml` that runs:
- RoleMappingService (Node) on 4000
- Backend (FastAPI) on 3001
- This frontend (React) on 3000

Steps:
1. From the repo root, copy `.env.example` to `.env` and adjust variables:
   - `FRONTEND_API_URL` — base URL to the backend API (default: `http://localhost:3001/api/v1`)
2. Start services:
   ```bash
   docker compose up -d mapping backend frontend
   ```
3. Open the app at http://localhost:3000

Notes:
- The compose file passes `REACT_APP_API_URL=${FRONTEND_API_URL}` so the frontend will call the backend correctly from the browser.
- The backend depends on the Node mapping service for role adjacency features.

## Fixing “Invalid Host header” (proxy/preview environments)

When running Create React App behind a proxy, cloud IDE preview URL, or tunneling service, the dev server may reject requests with:
“Invalid Host header”.

This project’s `npm start` is preconfigured to allow non-localhost hosts safely for development:

- It binds to all interfaces: `HOST=0.0.0.0`
- It disables the strict host check only in development: `DANGEROUSLY_DISABLE_HOST_CHECK=true`

You can see these in `package.json`:
- `start`: uses `cross-env HOST=0.0.0.0 DANGEROUSLY_DISABLE_HOST_CHECK=true react-scripts start`
- `start:strict`: runs the default CRA dev server with host check enabled

If your environment requires HTTPS or a specific port:
- Set `PORT=3000` (or another port) in your `.env` or command
- Optionally set `HTTPS=true` (requires certs; see CRA docs)

If you maintain a custom dev server configuration (e.g., ejected or custom tooling), set:
- `allowedHosts: 'all'` in your `devServer` config

After changing these settings, restart the dev server to apply them.

## Environment configuration

- Copy `CareerPlatformWebFrontend/.env.example` to `.env` (or `.env.development.local`) and adjust values to your environment.
- Backend API base (the frontend supports multiple env names; use one of the following):
  - `REACT_APP_API_URL` (preferred), or
  - `REACT_APP_API_BASE`, or
  - `REACT_APP_BACKEND_URL`
  - Example: `http://localhost:3001`
- Base URL normalization (to avoid double-prefixing):
  - The frontend will ensure all requests hit the versioned API by appending `/api/v1` if it's not present.
  - If your env var already ends with `/api/v1`, it will not be appended again.
  - If no env var is set, it will default to the relative base `/api/v1`, which works with CRA proxy in development.
- Development defaults:
  - CRA will proxy API requests to the backend using the `"proxy"` field in `package.json` (currently `http://localhost:3001`).
  - In dev, you can omit env vars entirely and rely on the proxy (the frontend will call relative `/api/v1/...`).
- Production guidance:
  - Set `REACT_APP_API_URL` to the backend origin (either with or without `/api/v1`, both are accepted by the app).
  - Examples:
    - `REACT_APP_API_URL=http://backend.example.com` → app will call `http://backend.example.com/api/v1/...`
    - `REACT_APP_API_URL=https://api.example.com/api/v1` → app will call `https://api.example.com/api/v1/...`

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
