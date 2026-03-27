# CV-GEN Backend

API REST para el generador de CVs con IA. Construido con NestJS + Prisma + Supabase.

## Stack

- **NestJS 11** — framework backend
- **Prisma 7** — ORM con migraciones
- **Supabase** — PostgreSQL + Auth
- **Pino** — logger estructurado en JSON
- **Swagger** — documentación automática de la API

## Requisitos

- Node.js 18+
- pnpm
- Cuenta en Supabase

## Instalación
```bash
pnpm install
```

## Configuración

Copia el archivo de ejemplo y llena las variables:
```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string con pooler de Supabase |
| `DIRECT_URL` | Connection string directa de Supabase |
| `SUPABASE_JWT_SECRET` | JWT secret desde Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | API key de Anthropic |

## Comandos
```bash
# desarrollo
pnpm run start:dev

# migraciones
npx prisma migrate dev --name nombre

# ver base de datos
npx prisma studio

# lint y formato
pnpm run lint
pnpm run format
```

## Documentación API

Disponible en `http://localhost:3001/docs` en modo desarrollo.

## Arquitectura
```
src/
├── modules/        # features: auth, profile, cv, export
├── prisma/         # servicio de base de datos
├── common/         # guards, decorators, filters compartidos
└── config/         # variables de entorno tipadas
```