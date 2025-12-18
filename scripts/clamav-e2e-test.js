import net from 'node:net';

const EICAR =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

async function scanBuffer(buf, host='127.0.0.1', port=3310) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host, port }, () => {
      s.write('zINSTREAM\0');
      s.write(u32(buf.length));
      s.write(buf);
      s.write(u32(0)); // end stream
    });
    let data = '';
    s.on('data', (chunk) => (data += chunk.toString('utf8')));
    s.on('error', reject);
    s.on('end', () => resolve(data.trim()));
  });
}

const clean = Buffer.from('hello world');
const eicar = Buffer.from(EICAR, 'utf8');

const host = process.env.RUNESSE_CLAMAV_HOST || '127.0.0.1';
const port = Number(process.env.RUNESSE_CLAMAV_PORT || 3310);

console.log('Scanning clean buffer...');
console.log(await scanBuffer(clean, host, port));   // expect: OK

console.log('Scanning EICAR test buffer...');
console.log(await scanBuffer(eicar, host, port));   // expect: FOUND
