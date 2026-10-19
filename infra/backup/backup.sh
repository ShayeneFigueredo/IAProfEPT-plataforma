#!/bin/bash
# Script de Backup Automatizado - Plataforma IAprofEPT
# Autor: Maycon Luiz Amaral Magalhães
# Engenharia: Shayene Figueredo & Samuel Amorim

# Configurações do Banco de Dados
DB_HOST=${PGHOST:-localhost}
DB_PORT=${PGPORT:-5432}
DB_USER=${PGUSER:-postgres}
DB_NAME=${PGDATABASE:-iaprofept_db}

# Diretório Seguro na UFJF
BACKUP_DIR="/mnt/seguro_ufjf/backups/iaprofept"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/iaprofept_backup_${DATE}.sql.gz"

# Tempo de Retenção em dias
RETENTION_DAYS=30

# Garante que o diretório de backup exista
mkdir -p "$BACKUP_DIR"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Iniciando backup do banco $DB_NAME..."

# Exportamos a senha se fornecida, senão o psql vai buscar no .pgpass
export PGPASSWORD=${PGPASSWORD:-""}

# Realiza o dump e compactação (-Z 9 usa compressão zlib máxima)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -Z 9 -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup finalizado com sucesso: $BACKUP_FILE"
else
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: Falha ao gerar o backup!" >&2
  exit 1
fi

# Remove backups mais antigos que a retenção
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Limpando backups mais antigos que $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -type f -name "iaprofept_backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Rotina de backup concluída."
