#!/bin/bash
# =============================================
# SISCOMURA.IA — Despliegue completo
# Ejecutar: bash scripts/deploy.sh
# =============================================
set -e

echo ''
echo '========================================'
echo '  SISCOMURA.IA — Despliegue Completo'
echo '========================================'
echo ''

# --- PASO 1: TURSO ---
echo '[1/5] Creando base de datos en Turso...'
turso db create siscomura-db --region us-east-1
echo '  Base de datos creada.'

echo '[2/5] Generando token de auth para la DB...'
DB_TOKEN=$(turso db tokens create siscomura-db)
echo '  Token generado.'

# Obtener la URL de la base de datos
DB_URL=$(turso db show siscomura-db --url)
DATABASE_URL="${DB_URL}?authToken=${DB_TOKEN}"
echo "  URL: ${DB_URL}"

# --- PASO 2: SCHEMA ---
echo '[3/5] Subiendo esquema a Turso...'
DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss
echo '  Tablas creadas.'

# --- PASO 3: VERCEL ---
echo '[4/5] Desplegando en Vercel...'
cd "$(dirname "$0")/.."

# Desplegar con la variable de entorno
VERCEL_DATABASE_URL="$DATABASE_URL" vercel deploy --prod --yes 2>&1

# --- PASO 4: Guardar URL de Vercel ---
PROD_URL=$(vercel ls --prod 2>/dev/null | head -1 | awk '{print $2}' || echo '')

echo ''
echo '========================================'
echo '  DESPLIEGUE COMPLETADO'
echo '========================================'
echo ''
echo "Base de datos: ${DB_URL}"
echo "Vercel: ${PROD_URL}"
echo ''
echo 'IMPORTANTE: Guarda esta URL de conexión:'
echo "$DATABASE_URL" > .env.production
echo "Guardada en .env.production"
echo ''
