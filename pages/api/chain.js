// AUTHORIZED SECURITY DRILL USE ONLY — delete this project after testing.
//
// GET /api/chain?hops=<spec>
//   spec: comma-separated hops, each "CODE|TARGET"
//   The LAST hop's target is the terminal destination; each earlier hop's
//   target is the next /api/r URL, nested and URL-encoded one level deeper
//   each time (so %25-style double encoding works for chains up to ~6 hops).
//
// Output: text/plain, a single ready-to-fetch entry-point URL that crawlers
// / curl -sIL can follow hop by hop to the end.
//
// Example:
//   /api/chain?hops=302|https://a.example,301|https://b.example,302|https://real-target
// =>
//   <origin>/api/r?code=302&to=<enc(/api/r?code=301&to=<enc(/api/r?code=302&to=<enc(real-target)>)>)>

function escapeParam(s) {
  // encodeURIComponent leaves ! ' ( ) * alone; escape those too so every
  // byte inside a query value is safe to nest repeatedly.
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export default async function handler(req, res) {
  const raw = req.query.hops;
  if (typeof raw !== 'string' || !raw.trim()) {
    res.status(400).type('text/plain').send('Missing "hops" query parameter');
    return;
  }

  const hops = raw.split(',').map((h) => {
    const i = h.indexOf('|');
    return { code: h.slice(0, i), to: h.slice(i + 1) };
  });
  if (hops.length < 1 || hops.length > 20) {
    res.status(400).type('text/plain').send('hops: need 1..20 hops');
    return;
  }

  // Build from the inside out: innermost hop targets the terminal URL;
  // each outer hop targets the /api/r URL of the hop inside it.
  let inner = hops[hops.length - 1].to;
  for (let i = hops.length - 2; i >= 0; i--) {
    inner = escapeParam(`/api/r?code=${hops[i + 1].code}&hop=${i + 1}&to=${inner}`);
    inner = `/api/r?code=${hops[i].code}&hop=${i}&to=${inner}`;
  }
  const origin = `https://${req.headers.host || 'your-app.vercel.app'}`;
  const url = `${origin}${inner}`;

  res
    .status(200)
    .type('text/plain')
    .send(url + '\n');
}
