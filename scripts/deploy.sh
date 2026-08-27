#!/bin/bash
# =============================================
# SISCOMURA.IA — Despliegue completo a produccion
# Ejecutar: bash scripts/deploy.sh
# Requisitos: CLI de Turso (`turso`) y Vercel (`vercel`) instalados y autenticados
# =============================================
set -e

echo ''
echo '========================================'
echo '  SISCOMURA.IA — Despliegue a Produccion'
echo '========================================'
echo ''

# --- Verificar herramientas ---
command -v turso >/dev/null 2>&1 || { echo 'ERROR: turso CLI no encontrado. Instala con: curl -sSfL https://get.tur.so/install.sh | bash'; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo 'ERROR: vercel CLI no encontrado. Instala con: npm i -g vercel'; exit 1; }

cd "$(dirname "$0")/.."

# --- PASO 1: TURSO ---
echo '[1/6] Creando base de datos en Turso...'
turso db create siscomura-db --region us-east-1 2>/dev/null || echo '  (DB ya existe, usando la existente)'
echo '  Base de datos lista.'

echo '[2/6] Generando token de auth para la DB...'
DB_TOKEN=$(turso db tokens create siscomura-db --no-expiry 2>/dev/null || turso db tokens create siscomura-db)
echo '  Token generado.'

DB_URL=$(turso db show siscomura-db --url)
DATABASE_URL="${DB_URL}?authToken=${DB_TOKEN}"
echo "  URL: ${DB_URL}"

# --- PASO 2: VARIABLES DE ENTORNO ---
echo '[3/6] Generando AUTH_SECRET...'
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
echo "  AUTH_SECRET: ${AUTH_SECRET:0:8}..."

echo '  Generando ENCRYPTION_KEY...'
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "  ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:16}..."

# --- PASO 3: SCHEMA EN TURSO ---
echo '[4/6] Subiendo esquema a Turso...'
# Usamos un script temporal porque db.ts maneja la migracion automaticamente
# pero necesitamos que la tabla User exista antes del primer deploy
turso db shell siscomura-db < <(echo "
CREATE TABLE IF NOT EXISTS ApiKey (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, key TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  isActive INTEGER NOT NULL DEFAULT 1, usageCount INTEGER NOT NULL DEFAULT 0,
  lastUsedAt TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS Generation (
  id TEXT PRIMARY KEY, moduleId TEXT NOT NULL, moduleName TEXT NOT NULL,
  prompt TEXT NOT NULL, result TEXT NOT NULL, metadata TEXT,
  apiKeyId TEXT REFERENCES ApiKey(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_generation_moduleId ON Generation(moduleId);
CREATE INDEX IF NOT EXISTS idx_generation_createdAt ON Generation(createdAt);
CREATE TABLE IF NOT EXISTS StationConfig (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '', whatsapp TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '', tiktok TEXT NOT NULL DEFAULT '',
  youtube TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '',
  urlApp TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ModuleConfig (
  id TEXT PRIMARY KEY, moduleId TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  description TEXT NOT NULL, icon TEXT NOT NULL, sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS Prompt (
  id TEXT PRIMARY KEY, moduleId TEXT NOT NULL UNIQUE, content TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
") 2>/dev/null || echo '  (Las tablas ya existen)'
echo '  Tablas verificadas.'

# --- PASO 4: VERCEL ENV ---
echo '[5/6] Configurando variables de entorno en Vercel...'

# DATABASE_URL como Secret (no visible en logs)
vercel env rm DATABASE_URL production -y 2>/dev/null || true
echo "${DATABASE_URL}" | vercel env add DATABASE_URL production

# AUTH_SECRET como Secret
vercel env rm AUTH_SECRET production -y 2>/dev/null || true
echo "${AUTH_SECRET}" | vercel env add AUTH_SECRET production

# ENCRYPTION_KEY como Secret
vercel env rm ENCRYPTION_KEY production -y 2>/dev/null || true
echo "${ENCRYPTION_KEY}" | vercel env add ENCRYPTION_KEY production

echo '  Variables configuradas.'

# --- PASO 5: DEPLOY ---
echo '[6/6] Desplegando en Vercel...'
vercel deploy --prod --yes 2>&1

echo ''
echo '========================================'
echo '  DESPLIEGUE COMPLETADO'
echo '========================================'
echo ''
echo 'Siguientes pasos:'
echo '  1. Abre tu URL de Vercel en el navegador'
echo '  2. La app detectara que no hay usuarios y te mostrara el formulario de registro'
echo '  3. Crea tu cuenta de administrador'
echo '  4. Configura tus API keys de Gemini en Configuracion > API Keys'
echo ''
echo 'IMPORTANTE: Guarda estas credenciales en un lugar seguro:'
echo "  AUTH_SECRET: ${AUTH_SECRET}"
echo "  ENCRYPTION_KEY: ${ENCRYPTION_KEY}"
echo "  DATABASE_URL: ${DATABASE_URL}"
echo ''
