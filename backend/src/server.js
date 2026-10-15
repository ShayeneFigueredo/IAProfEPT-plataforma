import dotenv from 'dotenv';
import app from './app.js';
import { closePool } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Inicialização do servidor HTTP
const server = app.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(`🚀 SERVIDOR BACKEND IAProfEPT ATIVO NA PORTA ${PORT}`);
  console.log(`   - Ambiente:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - Healthcheck:  http://localhost:${PORT}/api/health`);
  console.log(`   - Documentação: http://localhost:${PORT}/api`);
  console.log(`   - Banco Host:   ${process.env.PGHOST || 'localhost'}`);
  console.log('================================================================');
});

// Tratamento de encerramento gracioso (Graceful Shutdown)
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
  server.close(async () => {
    console.log('✔ Servidor HTTP finalizado.');
    await closePool();
    process.exit(0);
  });

  // Timeout de segurança
  setTimeout(() => {
    console.error('💥 Encerramento forçado por timeout de segurança (10s).');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server };
export default server;
