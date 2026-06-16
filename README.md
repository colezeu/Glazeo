# Glazeo — Configurator Sisteme din Sticlă

Aplicație React pentru configurarea și oferirea de sisteme din sticlă (terase, balustrade, cabine duș, oglinzi, pergole, uși).

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS, build cu Vite
- **Backend API**: Vercel Serverless Functions (`/api/`)
- **Auth & DB**: Supabase
- **Email**: Resend
- **AI Consultant**: Anthropic Claude Haiku (sau OpenAI / Ollama local)
- **Deploy**: Vercel

## Setup local

```bash
# 1. Clonează și instalează
git clone https://github.com/colezeu/Glazeo.git
cd Glazeo
npm install

# 2. Configurează variabilele de mediu
cp .env.example .env
# → editează .env cu credențialele tale

# 3. Pornește dev server
npm run dev
```

## Variabile de mediu necesare

Vezi `.env.example` pentru lista completă. Minimul necesar pentru a porni:

| Variabilă | Descriere |
|-----------|-----------|
| `VITE_SUPABASE_URL` | URL proiect Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase |
| `ANTHROPIC_API_KEY` | API key Anthropic (pentru AI Consultant) |
| `RESEND_API_KEY` | API key Resend (pentru email oferte) |
| `ADMIN_PASSWORD` | Parolă admin panel |

## Deploy pe Vercel

1. Push pe GitHub
2. Importă repo-ul în [vercel.com](https://vercel.com)
3. Adaugă toate variabilele din `.env.example` în **Settings → Environment Variables**
4. Deploy automat la fiecare push pe `main`

> **Important**: `VITE_*` variabilele sunt expuse în frontend (build-time). Celelalte sunt server-side only.

## Structura proiectului

```
/
├── api/                    # Vercel Serverless Functions
│   ├── ai-consultant.js    # AI chat (Anthropic/OpenAI/Ollama)
│   ├── quote/request.js    # Trimitere email ofertă (Resend)
│   └── admin/              # Auth admin + catalog management
├── src/
│   ├── pages/              # Dashboard, Auth, Admin (Supabase-powered)
│   ├── components/         # ProtectedRoute, SaveProjectModal, etc.
│   ├── *ConfiguratorPage   # Un fișier per produs
│   └── lib/supabase.ts     # Client Supabase
├── public/                 # Assets statice (imagini produse)
├── shared/                 # Cod partajat frontend/backend
└── supabase/migrations/    # SQL migrations
```

## Configuratoare disponibile

| Rută | Produs |
|------|--------|
| `/configurator/balustrade` | Balustrade din sticlă |
| `/configurator/cabine-dus` | Cabine și paravane duș |
| `/configurator/inchidere-terasa` | Închideri terasă (multitrack, frameless, ghilotină) |
| `/configurator/usi-batante` | Uși batante frameless |
| `/configurator/usi-culisante` | Uși culisante |
| `/configurator/partitionari` | Partiționări birou |
| `/configurator/oglinzi` | Oglinzi |
| `/configurator/copertina` | Copertine |
| `/configurator/pergola-copertina` | Pergole |

## Admin

- `/` → login Supabase
- `/admin/quotes` → toate ofertele primite
- `/admin/partners` → gestiune parteneri cu multiplicator de preț

Admin complet (catalog prices): `/admin/` cu parolă din `ADMIN_PASSWORD`.
