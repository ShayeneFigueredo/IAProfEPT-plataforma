#!/bin/bash
# Script de Restauração de Desastres - Plataforma IAprofEPT
# Autor: Maycon Luiz Amaral Magalhães

if [ -z "$1" ]; then
  echo "Uso: $0 <caminho_para_arquivo_de_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1
DB_HOST=${PGHOST:-localhost}
DB_PORT=${PGPORT:-5432}
DB_USER=${PGUSER:-postgres}
DB_NAME=${PGDATABASE:-iaprofept_db}

echo "================================================================"
echo "⚠️ ATENÇÃO: A restauração apagará o banco de dados atual!"
echo "Isso causará indisponibilidade temporária na Plataforma."
echo "Banco Alvo: $DB_NAME em $DB_HOST:$DB_PORT"
echo "Arquivo de Backup: $BACKUP_FILE"
echo "================================================================"
read -p "Tem certeza que deseja continuar? (s/n): " confirm

if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "Operação abortada pelo usuário."
  exit 0
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Iniciando drop/recriação do banco de dados..."
export PGPASSWORD=${PGPASSWORD:-""}

# Terminando conexões ativas para permitir o DROP
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Iniciando restauração via pg_restore..."
# Restauração a partir de custom format (-F c)
# -1 garante que tudo seja executado em uma única transação
pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -1 "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Restauração concluída com sucesso! Tempo de inatividade superou a expectativa."
else
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERRO ao restaurar o banco de dados!" >&2
  exit 1
fi
