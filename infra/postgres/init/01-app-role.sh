#!/bin/sh
# Cria o usuário da aplicação. Ele não é dono das tabelas nem superusuário,
# então as políticas de Row Level Security valem para ele.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE recreio_app LOGIN PASSWORD '${APP_DB_PASSWORD}';
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO recreio_app;
GRANT USAGE ON SCHEMA public TO recreio_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO recreio_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO recreio_app;
SQL
