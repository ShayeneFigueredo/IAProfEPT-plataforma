module.exports = {
  apps: [
    {
      name: 'iaprofept-backend',
      script: './backend/src/server.js',
      instances: 'max', // Utiliza todos os núcleos de CPU disponíveis (Cluster Mode)
      exec_mode: 'cluster',
      watch: false, // Desabilitado em produção
      max_memory_restart: '1G', // Reinicia a instância se exceder 1GB de RAM (Prevenção de Leaks)
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/iaprofept/backend-error.log',
      out_file: '/var/log/iaprofept/backend-out.log',
      merge_logs: true,
      time: true,
      # Configuração para zero-downtime reloads
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};
