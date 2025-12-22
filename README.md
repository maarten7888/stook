<div align="center">
  <h1>Stook — elke sessie beter</h1>
  <p>Kamado‑first BBQ webapp. Next.js 15 + Supabase + Drizzle + Tailwind + shadcn/ui.</p>
</div>

## Stack
- **Next.js 15** (App Router, RSC), TypeScript
- **Tailwind CSS v4**, shadcn/ui (Radix), lucide‑react
- **Supabase** (Postgres + Auth + Storage), regio eu‑central (Frankfurt)
- **Drizzle ORM** + drizzle‑kit (migraties in `drizzle/`)
- **Google Cloud Vision** (OCR voor foto import)
- **Vitest** + Testing Library, **Playwright** (e2e)
- **GitHub Actions** CI/CD

## Features
- 🔐 **Authenticatie**: Supabase Auth (email/password, magic link)
- 📝 **Recepten**: CRUD operaties, ingrediënten, stappen, tags
- 🔥 **Kooksessies**: Live tracking, temperatuur logs, foto's
- ⭐ **Reviews**: Beoordelingen voor publieke recepten
- 📤 **Import**: URL → Preview → Import flow
- 📷 **OCR Import**: Maak foto van recept → automatisch digitaliseren
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

# Google Cloud Vision (optioneel, voor OCR import)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
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

## Google Cloud Vision Setup (OCR)

Om de foto import functie te gebruiken, moet je Google Cloud Vision configureren:

### 1. Google Cloud Project aanmaken
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan of selecteer een bestaand project
3. Noteer de **Project ID**

### 2. Vision API inschakelen
1. Ga naar **APIs & Services** → **Library**
2. Zoek naar "Cloud Vision API"
3. Klik op **Enable**

### 3. Service Account aanmaken
1. Ga naar **IAM & Admin** → **Service Accounts**
2. Klik op **Create Service Account**
3. Geef een naam (bijv. "stook-ocr")
4. Geef de rol: **Cloud Vision API User** (of meer specifiek: `roles/vision.user`)
5. Klik op **Done**

### 4. Service Account Key genereren
1. Klik op de aangemaakte service account
2. Ga naar **Keys** tab
3. Klik op **Add Key** → **Create new key**
4. Kies **JSON** formaat
5. Download het JSON bestand

### 5. Environment variabele instellen
Kopieer de inhoud van het JSON bestand naar de `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable.

> ⚠️ **Let op**: De JSON moet op één regel staan of correct geëscaped worden.

**Voorbeeld:**
```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"my-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"stook-ocr@my-project.iam.gserviceaccount.com",...}
```

### Troubleshooting OCR

| Probleem | Oplossing |
|----------|-----------|
| "OCR service is niet correct geconfigureerd" | Check of `GOOGLE_APPLICATION_CREDENTIALS_JSON` correct is ingesteld |
| "Geen tekst gevonden" | Probeer een duidelijkere foto met beter licht |
| "Quota bereikt" | Wacht tot quota reset of verhoog in Google Cloud Console |
| "Permission denied" | Check of Vision API is ingeschakeld en service account juiste rol heeft |

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
- `POST /api/import` - Recept importeren van URL
- `POST /api/import/photo/presign` - Signed upload URL voor OCR
- `POST /api/import/photo/ocr` - OCR uitvoeren op foto
- `POST /api/import/photo/preview` - OCR tekst naar recept preview
- `POST /api/import/photo` - Recept importeren van OCR

### Profiel
- `GET /api/profile` - Gebruikersprofiel
- `PUT /api/profile` - Profiel bijwerken
- `GET /api/profile/stats` - Gebruikersstatistieken

## Testing

### Unit Tests (Vitest)
```bash
pnpm test
```
Tests voor RLS policies, database schema validatie, utility functies en OCR parser.

### E2E Tests (Playwright)
```bash
pnpm playwright test
```
End-to-end tests voor:
- Authenticatie flow (registreren/inloggen)
- Recepten CRUD operaties
- Sessie management
- Import flow (URL + OCR)
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
- `NEXT_PUBLIC_SITE_URL` → `https://stookboek.nl` (productie)
- `SITE_URL` → `https://stookboek.nl` (productie)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (voor OCR)

**Belangrijk**: Zorg dat `NEXT_PUBLIC_SITE_URL` en `SITE_URL` in productie ingesteld zijn op `https://stookboek.nl` (zonder www).

### 3. Domeinen

#### DNS Configuratie
Voeg alle domeinen toe aan je Vercel project:

1. **Ga naar Vercel Dashboard** → Je project → Settings → Domains
2. **Voeg toe**:
   - `stookboek.nl` (primair domein)
   - `www.stookboek.nl` (wordt automatisch doorgestuurd naar non-www)
   - `stook-boek.nl` (redirect naar stookboek.nl)
   - `www.stook-boek.nl` (redirect naar stookboek.nl)

#### DNS Records bij je domeinregistrar

**Stap 1: Haal de exacte DNS records op van Vercel**
1. Ga naar Vercel Dashboard → Je project → Settings → Domains
2. Klik op `stookboek.nl` (of voeg het toe als het er nog niet staat)
3. Vercel toont de **exacte DNS records** die je moet instellen
4. Noteer deze records (ze kunnen per project verschillen!)

**Stap 2: Configureer de records bij je domeinregistrar**

Log in bij je domeinregistrar (TransIP, Hostnet, Mijndomein, etc.) en ga naar **DNS beheer** of **DNS instellingen**.

**Voor `stookboek.nl` (root/apex domein):**
Vercel geeft meestal een van deze opties:
- **A record**: 
  ```
  Type: A
  Name: @ (of leeg, of stookboek.nl)
  Value: [IP adres van Vercel, bijv. 76.76.21.21]
  TTL: 3600 (of automatisch)
  ```
- **ALIAS/ANAME record** (als je registrar dit ondersteunt):
  ```
  Type: ALIAS (of ANAME)
  Name: @
  Value: [CNAME waarde van Vercel, bijv. cname.vercel-dns.com]
  ```

**Voor `www.stookboek.nl` (subdomein):**
```
Type: CNAME
Name: www
Value: [CNAME waarde van Vercel, bijv. cname.vercel-dns.com]
TTL: 3600 (of automatisch)
```

**Stap 3: Specifieke instructies per registrar**

**TransIP:**
1. Ga naar **Domeinen** → **stookboek.nl** → **DNS**
2. Klik **Record toevoegen**
3. Voor root: Kies **A** record, naam `@`, waarde = IP van Vercel
4. Voor www: Kies **CNAME** record, naam `www`, waarde = CNAME van Vercel

**Hostnet:**
1. Ga naar **Mijn Domeinen** → **stookboek.nl** → **DNS beheer**
2. Klik **Nieuw record**
3. Volg dezelfde stappen als hierboven

**Mijndomein:**
1. Ga naar **Domeinen** → **stookboek.nl** → **DNS**
2. Klik **Record toevoegen**
3. TransIP instructies gelden ook hier

**Andere registrars:**
- Zoek naar "DNS beheer", "DNS instellingen" of "DNS records"
- Voeg de records toe zoals Vercel ze toont
- **Let op**: Sommige registrars gebruiken `@` voor root, andere gebruiken een leeg veld of `stookboek.nl`

**Stap 4: Verwijder oude records (indien nodig)**

**Probleem: Meerdere A records voor root domein**
Als je meerdere A records ziet voor `@` (bijv. `216.198.79.1` en `37.97.254.27`):

1. **Check in Vercel** welk IP-adres wordt getoond:
   - Vercel Dashboard → Project → Settings → Domains → `stookboek.nl`
   - Noteer het exacte IP-adres dat Vercel toont

2. **Vergelijk met je DNS records**:
   - Als Vercel **één IP** toont → verwijder de andere A record(s)
   - Als Vercel **beide IPs** toont → beide behouden (zeldzaam)
   - Als **geen van beide** overeenkomt → verwijder beide en voeg de juiste toe

3. **In TransIP**:
   - Ga naar **Domeinen** → **stookboek.nl** → **DNS**
   - Klik op het **prullenbak icoon** naast de verkeerde A record
   - Behouden: alleen de A record met het IP dat Vercel toont
   - Behouden: alle email records (MX, TXT, CNAME voor DKIM/DMARC)

**Belangrijk**: Laat alle email gerelateerde records staan:
- MX records (voor email)
- TXT records (SPF, DMARC)
- CNAME records (`transip-*.domainkey` voor DKIM)

**Stap 5: Wacht op DNS propagatie**
- DNS wijzigingen kunnen 1-24 uur duren
- Test met: `dig stookboek.nl` of `nslookup stookboek.nl`
- Vercel toont in het dashboard wanneer de DNS correct is geconfigureerd

#### SSL Certificaten
Vercel regelt automatisch SSL certificaten (Let's Encrypt) voor beide domeinen. Dit kan 1-24 uur duren na DNS propagatie.

#### Redirects
De app redirect automatisch de volgende domeinen naar `stookboek.nl` (301 permanent redirect) via `next.config.ts`:
- `www.stookboek.nl` → `stookboek.nl`
- `stook-boek.nl` → `stookboek.nl`
- `www.stook-boek.nl` → `stookboek.nl`

#### Extra domein toevoegen: stook-boek.nl

**Stap 1: Voeg domein toe aan Vercel**
1. Ga naar Vercel Dashboard → Je project → Settings → Domains
2. Klik **"Add Domain"**
3. Voer `stook-boek.nl` in en klik **"Add"**
4. Voer `www.stook-boek.nl` in en klik **"Add"**
5. Vercel toont de benodigde DNS records

**Stap 2: Configureer DNS records bij TransIP**
Voor `stook-boek.nl` (root domein):
- **Type**: A
- **Name**: `@`
- **Value**: [IP adres dat Vercel toont, meestal hetzelfde als stookboek.nl]

Voor `www.stook-boek.nl` (subdomein):
- **Type**: CNAME
- **Name**: `www`
- **Value**: [CNAME waarde die Vercel toont]

**Stap 3: Wacht op DNS propagatie en SSL**
- DNS propagatie: 1-24 uur
- SSL certificaat: automatisch door Vercel (1-24 uur na DNS)

**Stap 4: Test redirect**
Na configuratie zouden deze URLs automatisch moeten redirecten:
- `https://stook-boek.nl` → `https://stookboek.nl`
- `https://www.stook-boek.nl` → `https://stookboek.nl`

**Test je configuratie:**
```bash
# Controleer DNS propagatie
dig stookboek.nl
dig www.stookboek.nl

# Test redirect
curl -I https://www.stookboek.nl
# Moet 301 redirect naar https://stookboek.nl geven
```

#### Troubleshooting: Domein werkt niet na 24+ uur

**Stap 1: Check de status in Vercel**
1. Ga naar Vercel Dashboard → Je project → Settings → Domains
2. Check de status van `stookboek.nl`:
   - ✅ **Valid** = Alles werkt
   - ⚠️ **Valid Configuration** = DNS correct, wachten op SSL
   - ❌ **Configuration Error** = DNS probleem
   - ⏳ **Pending** = Nog niet geconfigureerd

**Stap 2: Controleer DNS records**
Test of je DNS records correct zijn geconfigureerd:

**Online tools:**
- https://whatsmydns.net/#A/stookboek.nl (check DNS propagatie wereldwijd)
- https://dnschecker.org/#A/stookboek.nl
- https://mxtoolbox.com/SuperTool.aspx?action=a%3astookboek.nl

**Via terminal:**
```bash
# Check A record voor root domein
dig stookboek.nl +short
# Moet het IP adres van Vercel tonen

# Check CNAME voor www
dig www.stookboek.nl +short
# Moet de CNAME waarde van Vercel tonen (bijv. cname.vercel-dns.com)
```

**Stap 3: Veelvoorkomende problemen**

**Probleem 1: DNS records zijn niet correct**
- **Symptoom**: Vercel toont "Configuration Error"
- **Oplossing**: 
  1. Check in Vercel welk IP/CNAME exact wordt verwacht
  2. Vergelijk met je DNS records bij TransIP
  3. Zorg dat er geen extra A records zijn die Vercel niet verwacht
  4. Verwijder oude/verkeerde records

**Probleem 2: DNS propagatie duurt langer**
- **Symptoom**: DNS werkt op sommige locaties wel, andere niet
- **Oplossing**: 
  - Wacht nog 12-24 uur
  - Check met whatsmydns.net of DNS wereldwijd correct is
  - Flush je lokale DNS cache: `ipconfig /flushdns` (Windows) of `sudo dscacheutil -flushcache` (Mac)

**Probleem 3: SSL certificaat wordt niet aangemaakt**
- **Symptoom**: HTTP werkt, HTTPS niet (of "Invalid Certificate")
- **Oplossing**:
  1. Wacht 1-24 uur na DNS propagatie
  2. Check in Vercel of SSL certificaat wordt aangemaakt
  3. Als na 48 uur nog geen SSL: verwijder en voeg domein opnieuw toe in Vercel

**Probleem 4: Domein is niet toegevoegd aan Vercel**
- **Symptoom**: DNS werkt, maar site laadt niet
- **Oplossing**:
  1. Ga naar Vercel Dashboard → Settings → Domains
  2. Voeg `stookboek.nl` toe (als het er niet staat)
  3. Voeg `www.stookboek.nl` toe
  4. Wacht tot Vercel de DNS records valideert

**Probleem 5: Verkeerde environment variabelen**
- **Symptoom**: Site laadt, maar redirects/links werken niet
- **Oplossing**:
  1. Check in Vercel → Settings → Environment Variables:
     - `NEXT_PUBLIC_SITE_URL` = `https://stookboek.nl` (zonder www!)
     - `SITE_URL` = `https://stookboek.nl` (zonder www!)
  2. Redeploy na wijziging: Vercel → Deployments → Redeploy

**Probleem 6: TransIP DNS cache**
- **Symptoom**: DNS records zijn correct, maar werken niet
- **Oplossing**:
  1. Log in bij TransIP
  2. Ga naar Domeinen → stookboek.nl → DNS
  3. Verwijder en voeg de A record opnieuw toe (forceer refresh)
  4. Wacht 1-2 uur

**Stap 4: Test de website**
```bash
# Test HTTP (zonder SSL)
curl -I http://stookboek.nl

# Test HTTPS (met SSL)
curl -I https://stookboek.nl

# Test redirect van www naar non-www
curl -I https://www.stookboek.nl
# Moet 301 redirect geven naar https://stookboek.nl
```

**Stap 5: Records matchen maar Vercel detecteert ze niet (na 24+ uur)**

**Symptoom**: DNS records zijn correct ingesteld en matchen Vercel, maar status blijft "Invalid Configuration".

**Oplossing 1: Forceer DNS refresh in Vercel**
1. Ga naar Vercel Dashboard → Project → Settings → Domains
2. Klik op **"Refresh"** knop naast het domein
3. Wacht 5-10 minuten en check opnieuw

**Oplossing 2: Verwijder en voeg domeinen opnieuw toe in Vercel**
1. In Vercel Dashboard → Settings → Domains:
   - Klik op **"Edit"** → **"Remove"** voor `stookboek.nl`
   - Klik op **"Edit"** → **"Remove"** voor `www.stookboek.nl`
2. Wacht 2-5 minuten
3. Voeg beide domeinen opnieuw toe:
   - Klik **"Add Domain"**
   - Voer `stookboek.nl` in
   - Voer `www.stookboek.nl` in
4. Vercel zal nu opnieuw de DNS records valideren

**Oplossing 3: Check of Vercel de DNS records daadwerkelijk ziet**
Test vanuit verschillende locaties of Vercel de records kan zien:

```bash
# Test vanaf verschillende DNS servers
dig @8.8.8.8 stookboek.nl +short  # Google DNS
dig @1.1.1.1 stookboek.nl +short  # Cloudflare DNS
dig @208.67.222.222 stookboek.nl +short  # OpenDNS

# Check of het IP correct is
# Moet allemaal 216.198.79.1 tonen
```

**Online check:**
- https://whatsmydns.net/#A/stookboek.nl
- Als alle locaties `216.198.79.1` tonen → DNS is correct
- Als sommige locaties nog oude IP tonen → wacht nog op propagatie

**Oplossing 4: Check TransIP nameservers**
1. Ga naar TransIP → Domeinen → stookboek.nl → **Nameservers**
2. Zorg dat je de **TransIP nameservers** gebruikt (niet externe zoals Cloudflare)
3. TransIP nameservers moeten zijn:
   - `ns0.transip.net`
   - `ns1.transip.net`
   - `ns2.transip.net`
4. Als je andere nameservers gebruikt, wijzig deze terug naar TransIP

**Oplossing 5: Verwijder en voeg A record opnieuw toe in TransIP**
Soms helpt het om de record opnieuw aan te maken:
1. TransIP → Domeinen → stookboek.nl → DNS
2. Verwijder het A record voor `@` met waarde `216.198.79.1`
3. Wacht 1 minuut
4. Voeg het A record opnieuw toe:
   - Type: A
   - Name: @
   - Value: 216.198.79.1
   - TTL: 1 Uur
5. Wacht 1-2 uur en check Vercel opnieuw

**Oplossing 6: Check voor verborgen/duplicate records**
1. In TransIP → DNS, check of er geen **duplicate A records** zijn
2. Check of er geen **ALIAS/ANAME records** zijn die conflicteren
3. Zorg dat er **precies één A record** is voor `@` met waarde `216.198.79.1`

**Oplossing 7: Contact Vercel Support**
Als bovenstaande niet werkt na 48 uur:
1. Ga naar https://vercel.com/support
2. Stuur een ticket met:
   - Screenshot van TransIP DNS records
   - Screenshot van Vercel domain status
   - Output van `dig stookboek.nl` en `dig www.stookboek.nl`
   - Vermeld dat records al een week correct zijn ingesteld

**Stap 6: Als niets werkt**
1. **Check of je domein niet bij een andere provider staat** (bijv. Cloudflare DNS)
2. **Check of er geen DNS forwarding/proxy actief is** die de records verbergt
3. **Test of de site al werkt** (ook al toont Vercel "Invalid Configuration"):
   - Probeer `https://stookboek.nl` in je browser
   - Als de site laadt → DNS werkt, alleen Vercel validatie heeft probleem

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
- Altijd Supabase Admin Client voor runtime queries
- Drizzle ORM alleen voor migraties
- RLS policies verplicht
- Service-role key alleen server-side

### API Design
- Zod schema validatie
- Consistent error handling
- Proper HTTP status codes
- Server-side authenticatie checks

## Roadmap

### M0-M4 ✅ (Voltooid)
- [x] Basis scaffolding en theming
- [x] Supabase setup + Drizzle schema
- [x] Authenticatie flow
- [x] Recepten CRUD + API
- [x] Sessies + temperatuur tracking
- [x] Reviews systeem
- [x] Foto upload + Storage
- [x] Import flow (URL)
- [x] Profiel management
- [x] Testing setup
- [x] CI/CD pipeline

### M5 🔄 (In Progress)
- [x] Social features (follows/vrienden)
- [x] Favorieten systeem
- [ ] Branch protection rules
- [ ] PWA manifest

### M6 ✅ (Voltooid)
- [x] OCR Import (Google Cloud Vision)
- [x] Foto upload voor OCR
- [x] Tekst herkenning en parsing
- [x] Preview en bewerken
- [x] Recept aanmaken van OCR

### Sprint 2 (Toekomst)
- [ ] Real-time updates (Supabase Realtime)
- [ ] Geavanceerde zoekfunctionaliteit
- [ ] Notificaties
- [ ] Analytics dashboard
- [ ] Export functionaliteit
- [ ] Multi-language support
