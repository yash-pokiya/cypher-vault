# VAULT — Zero-Knowledge Encrypted Photo Storage

VAULT is a full-stack web application designed for secure, zero-knowledge encrypted photo storage.

## Project Structure

```
vault/
├── client/          # Vite + React Frontend (Configured for Vercel)
├── server/          # Express + Node.js Backend (Configured for Render)
├── render.yaml      # Render Blueprint deployment configuration
└── package.json     # Monorepo scripts
```

## Setup & Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB

### Running Locally

From the root directory:

```bash
# Run client (Vite dev server)
npm run dev:client

# Run server (Express backend)
npm run dev:server
```

## Deployment

- **Frontend (Vercel)**: Deploy from the `client/` directory. SPA routing is pre-configured via `client/vercel.json`.
- **Backend (Render)**: Deploy as a Web Service from the `server/` directory using `render.yaml` blueprint.
