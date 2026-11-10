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

### Push notifications on iPhone and other devices

Push alerts for new bookings and chat messages require the backend and ngrok tunnel to
remain online. On iPhone/iPad, use iOS/iPadOS 16.4 or newer, open the site in Safari,
choose **Share → Add to Home Screen**, launch the installed FixMatch app, sign in, and
tap the bell in the header to allow notifications. Keep notification sounds enabled
for FixMatch in iOS Settings; iOS chooses the notification sound and does not allow a
website to select a custom sound.

Configure VAPID keys in the backend before enabling Push:

```powershell
cd ..\backend
.\venv\Scripts\python.exe scripts\generate_vapid_keys.py
```

Copy the printed `VAPID_PUBLIC_KEY` into `backend/.env`, and add:

```dotenv
VAPID_PRIVATE_KEY_PATH=secrets/vapid_private.pem
VAPID_SUBJECT=mailto:your-email@example.com
PUSH_APP_URL=https://6730611007-ctrl.github.io/FixMatch/
```

Keep `backend/secrets/vapid_private.pem` private and do not commit it. Install backend
dependencies with `.\venv\Scripts\python.exe -m pip install -r requirements.txt`, then
restart Uvicorn and ngrok. The technician and customer must each enable notifications
on their own device/account.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).
