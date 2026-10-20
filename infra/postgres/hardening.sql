-- =======================================================================
-- Hardening e Otimização do PostgreSQL - Plataforma IAprofEPT
-- Este script define boas práticas e otimizações para rodar o banco
-- de dados de forma segura no servidor da UFJF.
-- =======================================================================

-- 1. Criação de Role específica com restrição de login
-- Nunca utilizar o usuário 'postgres' padrão para acesso da aplicação.
CREATE ROLE iaprofept_user WITH LOGIN PASSWORD 'SenhaForteGeradaAqui';

-- Apenas permissões básicas na database (não conceder SUPERUSER)
REVOKE ALL ON DATABASE iaprofept_db FROM PUBLIC;
GRANT CONNECT ON DATABASE iaprofept_db TO iaprofept_user;
GRANT USAGE, CREATE ON SCHEMA public TO iaprofept_user;

-- Garantir privilégios em todas as tabelas e sequências atuais
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO iaprofept_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO iaprofept_user;

-- Garantir privilégios para tabelas e sequências criadas no futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO iaprofept_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO iaprofept_user;

-- 2. Dicas de Configuração (postgresql.conf)
-- Estas configurações devem ser ajustadas no postgresql.conf baseadas nos testes de carga:
/*
max_connections = 100                   # Reduzir limite geral para forçar o pool da aplicação a se comportar
shared_buffers = 1GB                    # Aumentar buffers de memória compartilhada (25% da RAM total sugerido)
effective_cache_size = 3GB              # Ajustar conforme RAM (50% a 75% da RAM total)
work_mem = 64MB                         # Memória para operações de sort/hash (por conexão)
maintenance_work_mem = 256MB            # Para criação de indíces e vacuum
random_page_cost = 1.1                  # Otimizar para SSDs
*/

-- 3. Dicas de Segurança (pg_hba.conf)
-- Restringir as conexões no pg_hba.conf para aceitar requisições APENAS do localhost 
-- se a aplicação e o banco estiverem na mesma VM.
/*
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    iaprofept_db    iaprofept_user  127.0.0.1/32            scram-sha-256
host    iaprofept_db    iaprofept_user  ::1/128                 scram-sha-256
# Rejeitar o resto
host    all             all             0.0.0.0/0               reject
*/
