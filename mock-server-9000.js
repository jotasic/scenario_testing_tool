const http = require('http');
const port = 9000;

const server = http.createServer((req, res) => {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log(`[Mock Server 9000] ${req.method} ${req.url}`);
    if (body) {
      console.log('Body:', body);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: 'Mock server response',
      timestamp: new Date().toISOString(),
      receivedData: body ? JSON.parse(body) : null
    }));
  });
});

server.listen(port, () => {
  console.log(`Mock Server running on http://localhost:${port}/mock/g1`);
});
