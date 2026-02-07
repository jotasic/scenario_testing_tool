const http = require('http');

// Mock server for port 9000 (srv_mock_server)
const server9000 = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log(`[9000] ${req.method} ${req.url}`);
    if (body) console.log(`  Body: ${body.substring(0, 200)}...`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Mock response from 9000' }));
  });
});

// Mock server for port 8000 (srv_api_server)
const server8000 = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log(`[8000] ${req.method} ${req.url}`);
    if (body) console.log(`  Body: ${body.substring(0, 200)}...`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Mock response from 8000' }));
  });
});

server9000.listen(9000, () => console.log('Mock server running on port 9000'));
server8000.listen(8000, () => console.log('Mock server running on port 8000'));
