# PROD_REDIRECTOR

AUTHORIZED SECURITY DRILL USE ONLY — delete after testing.

Minimal Next.js app for testing a crawler's HTTP redirect handling. No auth by design.

- `GET /api/r?code=301&to=<encoded url>` — returns that status with a `Location` header; never follows the redirect itself. Accepts multi-encoded targets (up to ~6 decode rounds).
- `GET /api/chain?hops=302|https://a,301|https://b,TARGET` — returns a single nested entry-point URL.
- `GET /` — copy-paste curl commands and a test matrix.
- Every `/api/r` hit logs JSON (timestamp, IP, hop, target, status) to Vercel logs.

Deploy (Vercel CLI):

```bash
npm install
npx vercel --prod
```

Or via git:

```bash
git init && git add -A && git commit -m "redirect drill"
git remote add origin <your-repo-url> && git push -u origin main
# then import the repo at vercel.com/new
```
