# Kirana Shop

Local Vite React application for the shop.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env.local` file if needed.
3. Start the development server:
   ```bash
   npm run dev
   ```

## Notes

- This project now runs as a local Vite React app.
- `@` imports are resolved from `src/` via Vite config.
- The app now runs as a standalone local website and does not require Base44 integration.

## Environment variables

If your app uses Base44 backend auth or API features, add:

```bash
VITE_BASE44_APP_ID=<your_app_id>
VITE_BASE44_API_URL=https://base44.app
```

Otherwise, use your own backend configuration and replace Base44 usage as needed.
