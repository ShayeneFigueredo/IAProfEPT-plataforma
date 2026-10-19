const http = require('http');
const { performance } = require('perf_hooks');

const ENDPOINTS = [
  { path: '/api/health', method: 'GET' },
  { path: '/api/laboratorio/parametros-curriculares', method: 'GET' },
  { path: '/api/repositorio/praticas', method: 'GET' },
  { path: '/api/formativo/trilhas', method: 'GET' },
  { path: '/api/laboratorio/circuit-breaker-status', method: 'GET' },
  { path: '/api/laboratorio/telemetria-status', method: 'GET' }
];

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 3001;

const DURATION_SECONDS = 30; // duração do teste
const CONCURRENCY = 50; // dezenas de professores concorrentes

let totalRequests = 0;
let successRequests = 0;
let errorRequests = 0;
const latencies = [];

// Função para medir memória do servidor (chamando o health endpoint, se suportar, mas o health route na verdade não expõe memoria)
// Vamos medir as latencias
const agent = new http.Agent({ keepAlive: false, maxSockets: CONCURRENCY });

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const start = performance.now();
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: endpoint.path,
      method: endpoint.method,
      agent: agent,
      headers: {}
    };

    let payloadStr = '';
    if (endpoint.method === 'POST') {
      payloadStr = JSON.stringify(endpoint.body || {});
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const req = http.request(options, (res) => {
      res.on('data', () => {}); // consome os dados
      res.on('end', () => {
        const latency = performance.now() - start;
        latencies.push(latency);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequests++;
        } else {
          errorRequests++;
        }
        totalRequests++;
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`Request Error: ${err.message}`);
      errorRequests++;
      totalRequests++;
      resolve();
    });

    if (endpoint.method === 'POST') {
      req.write(payloadStr);
    }
    req.end();
  });
}

async function worker(endTime) {
  while (Date.now() < endTime) {
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    await makeRequest(endpoint);
  }
}

async function runLoadTest() {
  console.log('================================================================');
  console.log(`🚀 INICIANDO TESTE DE CARGA E CONCORRÊNCIA - PILOTO RFEPCT`);
  console.log(`- Concorrência simulada: ${CONCURRENCY} docentes simultâneos`);
  console.log(`- Duração do Teste: ${DURATION_SECONDS} segundos`);
  console.log(`- Alvo: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log('================================================================\n');

  const startTime = Date.now();
  const endTime = startTime + (DURATION_SECONDS * 1000);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(endTime));
  }

  await Promise.all(workers);

  const testDuration = (Date.now() - startTime) / 1000;
  const reqPerSec = totalRequests / testDuration;
  const successRate = (successRequests / totalRequests) * 100;
  
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;

  console.log(`📊 RESULTADOS DO TESTE DE CARGA:`);
  console.log(`- Total de Requisições: ${totalRequests}`);
  console.log(`- Sucessos (HTTP 2xx):  ${successRequests}`);
  console.log(`- Falhas (Erros):       ${errorRequests}`);
  console.log(`- Taxa de Sucesso:      ${successRate.toFixed(2)}% (Critério: >= 99.5%)`);
  console.log(`- Requisições por seg:  ${reqPerSec.toFixed(2)} req/s\n`);

  console.log(`⏱️ LATÊNCIAS (Fila de Conexões e Processamento):`);
  console.log(`- Média: ${avg.toFixed(2)} ms`);
  console.log(`- P95:   ${p95.toFixed(2)} ms`);
  console.log(`- P99:   ${p99.toFixed(2)} ms\n`);

  // Critério de Aceite
  if (successRate >= 99.5) {
    console.log(`✅ CRITÉRIO DE ACEITE ATENDIDO: O sistema sustentou a carga esperada sem quedas.`);
  } else {
    console.log(`❌ CRITÉRIO NÃO ATENDIDO: A taxa de sucesso ficou abaixo de 99.5%.`);
  }
}

runLoadTest();
