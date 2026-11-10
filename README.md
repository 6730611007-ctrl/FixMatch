# webAppAI (webapp)

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Start the app in development mode (HMR, error reporting, etc.)

```bash
quasar dev
```

### Format & Lint the files

```bash
pnpm run lint
# or: yarn/npm/bun run lint
```

...or just check formatting & linting:

```bash
pnpm run lint:check
# or: yarn/npm/bun run lint:check
```

### Build the app for production

```bash
quasar build
```

### Backend images and GitHub Pages deployment

Run the backend on port `8000` and expose it with the configured ngrok domain:

```bash
ngrok http --domain=disorder-mobilize-exile.ngrok-free.dev 8000
```

The frontend API and uploaded technician images use `https://disorder-mobilize-exile.ngrok-free.dev`.
Pushing the frontend to the `main` branch runs the GitHub Actions workflow and publishes
the Quasar build to the `gh-pages` branch. In the repository's Pages settings, select
deployment from the `gh-pages` branch and the root folder.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).
