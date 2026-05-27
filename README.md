# Larder

The revenue desk for premium hospitality events.

This MVP manages inbound private dining and brand activation inquiries through proposal, follow-up, contract, payment, and event brief workflows.

## Run locally

```bash
node server.js
```

Then open:

```text
http://localhost:4174
```

## Files

- `index.html` - Larder web app
- `server.js` - local Node backend and API routes
- `package.json` - start script and Node version
- `data/` - local runtime data, generated on first run
- `uploads/` - local uploaded files, ignored by git

## Optional integrations

Set these environment variables when ready:

- `ANTHROPIC_API_KEY` for Claude generation
- `RESEND_API_KEY` or `SENDGRID_API_KEY` for email
- `STRIPE_SECRET_KEY` for payment collection
- `LARDER_FROM_EMAIL` for outbound email sender
