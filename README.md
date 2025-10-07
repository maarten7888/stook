<div align="center">
  <h1>Stook — elke sessie beter</h1>
  <p>Kamado‑first BBQ webapp. Next.js 15 + Supabase + Drizzle + Tailwind + shadcn/ui.</p>
</div>

## Stack
- **Next.js 15** (App Router, RSC), TypeScript
- **Tailwind CSS v4**, shadcn/ui (Radix), lucide‑react
- **Supabase** (Postgres + Auth + Storage), regio eu‑central (Frankfurt)
- **Drizzle ORM** + drizzle‑kit (migraties in `drizzle/`)
- **Vitest** + Testing Library, **Playwright** (e2e)
- **GitHub Actions** CI/CD

## Features
- 🔐 **Authenticatie**: Supabase Auth (email/password, magic link)
- 📝 **Recepten**: CRUD operaties, ingrediënten, stappen, tags
- 🔥 **Kooksessies**: Live tracking, temperatuur logs, foto's
- ⭐ **Reviews**: Beoordelingen voor publieke recepten
- 📤 **Import**: URL → Preview → Import flow
- 👤 **Profiel**: Gebruikersvoorkeuren en statistieken
- 🖼️ **Foto's**: Supabase Storage met signed URLs
- 🔒 **RLS**: Row Level Security policies

## Setup

### 1. Dependencies installeren
```bash
pnpm install
```

### 2. Environment variabelen
Kopieer `env.example` naar `.env.local` en vul de waarden in:

```bash
# Site URLs
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URL (gebruik Pooler in productie)
DATABASE_URL=postgresql://postgres:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&options=project%3D<ref>
```

### 3. Database setup
```bash
# Migraties pushen
pnpm db:push

# RLS policies toepassen
pnpm db:rls

# Storage bucket aanmaken
pnpm db:bucket

# Demo data seeden
pnpm seed
```

### 4. Development server
```bash
pnpm dev
```

## Scripts

| Script | Beschrijving |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build voor productie |
| `pnpm start` | Start productie server |
| `pnpm lint` | ESLint check |
| `pnpm test` | Vitest unit tests |
| `pnpm playwright test` | E2E tests |
| `pnpm db:push` | Drizzle migraties pushen |
| `pnpm db:rls` | RLS policies toepassen |
| `pnpm db:bucket` | Storage bucket aanmaken |
| `pnpm seed` | Demo data seeden |

## Database Schema

### Kern tabellen
- **profiles**: Gebruikersprofielen (mirror van auth.users)
- **recipes**: Recepten met metadata en zichtbaarheid
- **ingredients**: Ingrediënten catalogus
- **recipe_ingredients**: Junction tabel recepten ↔ ingrediënten
- **steps**: Kookstappen met timers en temperaturen
- **cook_sessions**: Kooksessies met tracking
- **session_temps**: Temperatuur logs per sessie
- **photos**: Foto's gekoppeld aan recepten/sessies
- **reviews**: Beoordelingen voor publieke recepten
- **tags**: Tags voor categorisering
- **recipe_tags**: Junction tabel recepten ↔ tags

### RLS Policies
Alle tabellen hebben Row Level Security ingeschakeld:
- Gebruikers kunnen alleen eigen data beheren
- Publieke recepten zijn leesbaar voor iedereen
- Reviews alleen voor publieke recepten van anderen
- Foto's alleen toegankelijk via eigen recepten/sessies

## API Endpoints

### Recepten
- `GET /api/recipes` - Lijst recepten (met filters)
- `POST /api/recipes` - Nieuw recept aanmaken
- `GET /api/recipes/[id]` - Recept details
- `PUT /api/recipes/[id]` - Recept bijwerken
- `DELETE /api/recipes/[id]` - Recept verwijderen

### Reviews
- `GET /api/recipes/[id]/reviews` - Reviews voor recept
- `POST /api/recipes/[id]/reviews` - Review toevoegen

### Sessies
- `POST /api/recipes/[id]/sessions` - Sessie starten
- `GET /api/sessions/[id]` - Sessie details
- `PUT /api/sessions/[id]` - Sessie bijwerken
- `GET /api/sessions/[id]/temps` - Temperatuur logs
- `POST /api/sessions/[id]/temps` - Temperatuur toevoegen
- `GET /api/sessions/[id]/photos` - Sessie foto's

### Foto's
- `POST /api/photos` - Foto uploaden (multipart)

### Import
- `POST /api/import/preview` - URL preview
- `POST /api/import` - Recept importeren

### Profiel
- `GET /api/profile` - Gebruikersprofiel
- `PUT /api/profile` - Profiel bijwerken
- `GET /api/profile/stats` - Gebruikersstatistieken

## Testing

### Unit Tests (Vitest)
```bash
pnpm test
```
Tests voor RLS policies, database schema validatie en utility functies.

### E2E Tests (Playwright)
```bash
pnpm playwright test
```
End-to-end tests voor:
- Authenticatie flow (registreren/inloggen)
- Recepten CRUD operaties
- Sessie management
- Import flow
- Profiel beheer

## Deploy (Vercel)

### 1. Repository koppelen
- Koppel GitHub repo aan Vercel project
- Stel build command in: `pnpm build`
- Stel output directory in: `.next`

### 2. Environment variabelen
Zet alle vereiste env vars in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (gebruik Supabase Pooler!)
- `NEXT_PUBLIC_SITE_URL`
- `SITE_URL`

### 3. Domeinen
- **Primair**: `stookboek.nl`
- **Redirect**: `stook-boek.nl` → `stookboek.nl` (301)

### 4. Database (Productie)
```bash
# Gebruik Supabase Pooler voor productie
DATABASE_URL=postgresql://postgres:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&options=project%3D<ref>
```

## CI/CD (GitHub Actions)

Automatische checks bij elke push/PR:
- **Lint & Type Check**: ESLint + TypeScript
- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Build Check**: Next.js build validatie

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint (next/core-web-vitals)
- Prettier formatting
- Server-only keys nooit client-side

### Database
- Altijd Drizzle ORM gebruiken
- Migraties via `drizzle-kit`
- RLS policies verplicht
- Service-role key alleen server-side

### API Design
- Zod schema validatie
- Consistent error handling
- Proper HTTP status codes
- Server-side authenticatie checks

## Roadmap

### Sprint 0 ✅ (Voltooid)
- [x] Basis scaffolding en theming
- [x] Supabase setup + Drizzle schema
- [x] Authenticatie flow
- [x] Recepten CRUD + API
- [x] Sessies + temperatuur tracking
- [x] Reviews systeem
- [x] Foto upload + Storage
- [x] Import flow
- [x] Profiel management
- [x] Testing setup
- [x] CI/CD pipeline

### Sprint 1 (Gepland)
- [ ] Favorieten/follows systeem
- [ ] Geavanceerde zoekfunctionaliteit
- [ ] Notificaties
- [ ] Mobile app (PWA)
- [ ] Real-time updates (Supabase Realtime)

### Sprint 2 (Toekomst)
- [ ] Social features (delen, comments)
- [ ] Analytics dashboard
- [ ] Export functionaliteit
- [ ] Multi-language support
- [ ] Advanced import parsers
