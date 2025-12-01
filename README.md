# Portfolio-webpage

Professional portfolio web page with TailwindCSS, HTML and JS.

## Local development

```bash
npm install
npm run dev
```

This starts the Express backend on `http://localhost:3000`, serving both the public portfolio (`/`) and the new admin dashboard (`/admin.html`).  
All editable content lives in `data/content.json` and can be modified safely through the dashboard UI or via the REST API exposed under `/api/*`.
