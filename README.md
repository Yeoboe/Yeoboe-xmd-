# Yeoboe-xmd

A lightweight WhatsApp session generator with pairing-code and QR-code flows, refreshed for **Yeoboe-xmd Tech** with an ocean-teal and coral visual system.

## Run locally

```bash
npm install
npm start
```

The server listens on `http://localhost:8000` by default. Available pages are `/`, `/pair`, and `/qr-page`.

## Notes

The pairing and QR endpoints use Baileys and create short-lived authentication state under `temp/`. Keep that directory private and do not commit generated credentials. Configure any required database connection through environment variables supported by the runtime.

## Developer

**Yeoboe-xmd Tech**
