# 🔒 Audit de Securitate — Glazeo App
**Data**: 10 iulie 2026  
**Codebase**: `/Users/cornellezeu/hermes-workspace/Glazeo/src`  
**Stack**: React + Vite + TypeScript + Supabase + Express (backend)  
**Auditor**: Hermes Agent (revizuire automată)

---

## 📊 Sumar

| Severitate | Număr |
|-----------|-------|
| 🔴 Critic | 5 |
| 🟠 Ridicat | 7 |
| 🟡 Mediu | 7 |
| 🔵 Scăzut | 5 |

---

## 🔴 CRITIC

### C1. Admin check exclusiv client-side — bypassabil trivial
**Fișier**: `App.tsx`, linia 50  
**Cod**:
```ts
const isAdmin = user?.email === 'office@glass.associates';
```

Aceasta este **singura verificare** care determină dacă un utilizator vede butonul Admin și poate accesa `/admin/partners` și `/admin/quotes`. Este o comparație de string în browser. Orice utilizator autentificat poate:
- Modifica obiectul `user` în consola browserului
- Seta direct `isAdmin = true` din DevTools
- Intercepta și modifica răspunsul Supabase

**Impact**: Oricine cu un cont valid obține acces admin complet — poate schimba tier-uri de preț, șterge parteneri, modifica statusuri de oferte, vizualiza toate datele clienților.

**Remediere**: Mută verificarea admin pe server (backend/RLS). Folosește claims custom în JWT-ul Supabase (`app_metadata.role = 'admin'`) sau verifică apartenența la un tabel `admins` protejat prin RLS.

---

### C2. RLS absent pe tabela `projects` — orice user autentificat poate citi/șterge orice proiect
**Fișier**: Nu există migrare SQL pentru `projects`  

Nu s-a găsit **nicio** migrare care să activeze Row Level Security pe tabela `projects`. Toate operațiile din `Dashboard.tsx`:
- `deleteProject` (linia 132): `.delete().eq('id', id)` — **fără verificare `user_id`**
- `fetchAll` (linia 67): doar client-side filtrare `.eq('user_id', user.id)`, dar un atacator poate face direct query fără filtru

**Impact**: Orice utilizator autentificat poate șterge proiectele altui utilizator (doar ghicind un UUID). Poate citi toate proiectele și extrage configurații complete. Datele clienților sunt expuse.

**Remediere**:
```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own projects" ON public.projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### C3. RLS absent pe tabela `profiles` — orice user autentificat poate modifica profilul oricui
**Fișier**: `pages/PartnerManagement.tsx`, linii 42, 94-101, 119  
**Cod**:
```ts
// Linia 42: update fără verificare ownership
await supabase.from('profiles').update({ name: trimmed }).eq('user_id', userId)

// Linia 94-101: schimbare tier fără verificare ownership
await supabase.from('profiles').update({ price_multiplier: multiplier }).eq('user_id', userId)

// Linia 119: ștergere profil fără verificare ownership
await supabase.from('profiles').delete().eq('user_id', userId)
```

Deși `PartnerManagement` este protejat de `ProtectedRoute`, un utilizator non-admin poate apela direct aceste operații via consolă (clientul Supabase e disponibil global).

**Impact**: Orice utilizator autentificat își poate seta singur `price_multiplier: 0.75` (tier Volume, reducere 25%). Mai grav, RLS-ul pentru quotes folosește `price_multiplier = 0.75` ca discriminator admin — deci oricine își setează tier-ul Volume **devine automat admin** pentru tabela `quotes`.

**Remediere**: Activează RLS pe `profiles` cu politici stricte. Mută admin flag într-un câmp separat (`is_admin boolean`) protejat prin RLS.

---

### C4. Ruta admin pentru `/admin/partners` și `/admin/quotes` protejată doar de ProtectedRoute — nu de verificare admin
**Fișier**: `App.tsx`, linii 151-152  
**Cod**:
```tsx
<Route path="/admin/partners" element={<ProtectedRoute><PartnerManagement /></ProtectedRoute>} />
<Route path="/admin/quotes" element={<ProtectedRoute><QuotesAdmin /></ProtectedRoute>} />
```

`ProtectedRoute` verifică doar autentificarea, NU și rolul de admin. Butonul Admin e ascuns client-side (C1), dar ruta e accesibilă oricui autentificat direct din URL.

**Impact**: Oricine are un cont valid poate accesa panoul de admin introducând URL-ul manual.

**Remediere**: Adaugă o componentă `AdminRoute` care verifică rolul de admin la server, nu doar autentificarea.

---

### C5. Politica RLS admin pentru quotes folosește `price_multiplier = 0.75` ca discriminator
**Fișier**: `supabase/migrations/fix_policies.sql`, linii 8-15  
**Cod**:
```sql
CREATE POLICY "Admin full access" ON public.quotes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.price_multiplier = 0.75
  ))
```

Orice utilizator care are `price_multiplier = 0.75` (tier Volume) devine automat admin pentru tabela `quotes`. Combinat cu C3 (profiluri neprotejate), oricine își poate seta singur acest tier și obține acces admin la toate ofertele (vizualizare date clienți, modificare statusuri).

**Impact**: Lanț critic: `profiles` fără RLS → setezi `price_multiplier = 0.75` → devii admin quotes → vezi TOATE ofertele cu nume, email, telefon, mesaje ale clienților.

**Remediere**: Folosește un câmp dedicat `is_admin boolean` sau un tabel separat `admins`. Sau cel puțin validează admin la nivel de backend/edge function.

---

## 🟠 RIDICAT

### H1. Configuratoarele NU sunt protejate de autentificare
**Fișier**: `App.tsx`, linii 155-167  

Toate rutele de configurator (balustrade, pergola, shower, etc.) **nu** folosesc `<ProtectedRoute>`. Un utilizator neautentificat poate:
- Accesa toate configuratoarele
- Salva configurații în localStorage
- Trimite cereri de ofertă (politica RLS `Anyone can insert` permite inserții anonime)

**Impact**: Funcționalitatea de bază (configurare + trimis oferte) este accesibilă fără autentificare, ceea ce contrazice mesajul din AuthPage: "Accesul este permis doar partenerilor autorizați." Permite abuz (spam de oferte) și acces la catalogul de prețuri.

**Remediere**: Înfășoară rutele de configurator în `<ProtectedRoute>` dacă accesul trebuie să fie restricționat.

---

### H2. `fetchQuotes()` citește TOATE ofertele — fără filtru client-side, depinde exclusiv de RLS
**Fișier**: `lib/quotes.ts`, linii 34-46  
**Cod**:
```ts
export async function fetchQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  // ...
}
```

Această funcție este folosită de `QuotesAdmin` (panoul admin) și nu filtrează deloc după `user_id`. Se bazează exclusiv pe RLS pentru a returna doar ofertele vizibile. Dar dacă RLS e configurat greșit (C5), returnează toate ofertele.

**Impact**: Datele personale ale clienților (nume, email, telefon, mesaje) sunt expuse.

**Remediere**: Adaugă filtru explicit `.eq('user_id', user.id)` pentru utilizatorii non-admin. Folosește un admin flag explicit.

---

### H3. `updateQuoteStatus()` și `deleteQuote()` — fără verificare ownership
**Fișier**: `lib/quotes.ts`, linii 48-56 și `Dashboard.tsx`, linii 156-164  
**Cod**:
```ts
// Nu verifică dacă utilizatorul curent deține oferta
await supabase.from('quotes').update({ status, updated_at: ... }).eq('id', id)
await supabase.from('quotes').delete().eq('id', id)
```

**Impact**: Un utilizator care ghicește sau enumeră UUID-uri poate modifica statusul sau șterge ofertele altor utilizatori.

**Remediere**: Adaugă `.eq('user_id', user.id)` în query-urile de update/delete. Nu te baza exclusiv pe RLS.

---

### H4. `PartnerManagement` — query fără filtru, expune toți userii și proiectele lor
**Fișier**: `pages/PartnerManagement.tsx`, linii 51-92  
**Cod**:
```ts
const { data, error } = await supabase
  .from('projects')
  .select('user_id')  // ← fără niciun filtru!
```

Apoi iterează prin toți user-ii și le citește profilurile. Un utilizator non-admin autentificat poate vedea:
- Toți partenerii (user IDs, email-uri, nume, tier)
- Numărul de proiecte ale fiecărui partener
- Poate schimba tier-ul și numele oricărui partener, inclusiv șterge profiluri

**Impact**: Violare masivă a confidențialității. Datele tuturor partenerilor sunt expuse.

---

### H5. Număr de telefon WhatsApp hardcodat în codul client
**Fișier**: `QuoteModal.tsx`, linia 108  
**Cod**:
```ts
window.open(`https://wa.me/40734712187?text=${msg}`, "_blank");
```

Numărul de telefon `+40 734 712 187` este expus în codul client-side, vizibil în bundle-ul JavaScript. Același număr apare și în `HomePage.tsx` (linia 217) și `SEOHead.tsx`.

**Impact**: Expunere date personale. Risc de spam/phishing.

---

### H6. Email-uri interne hardcodate
**Fișiere**:
- `quotePdf.js:68`: `srldigima@gmail.com` (CC la mailto fallback)
- `quotePdf.js:69`: `office@glass.associates`
- `AuthPage.tsx:78-79`: `office@glass.associates`
- `App.tsx:50`: `office@glass.associates` (admin email)
- `SEOHead.tsx:109`: `office@glassassociates.ro`
- `InfoPage.tsx:66`: `office@glassassociates.ro`

**Impact**: Toate adresele de email interne sunt vizibile în codul sursă. Risc de spam, phishing țintit, inginerie socială.

---

### H7. `srldigima@gmail.com` — adresă personală Gmail în codul de producție
**Fișier**: `quotePdf.js`, linia 68  
**Cod**:
```ts
const params = new URLSearchParams({ subject, body, cc: 'srldigima@gmail.com' });
```

Aceasta este o adresă de Gmail personală (posibilă firmă SRL Digima) folosită ca CC la trimiterea ofertelor prin mailto fallback. Aceasta nu ar trebui să fie niciodată în codul client.

**Impact**: Expunere adresă personală. Dacă fallback-ul mailto se activează, toate ofertele sunt CC către această adresă.

---

## 🟡 MEDIU

### M1. Politica RLS `Anyone can insert` — anonimi pot crea oferte
**Fișier**: `supabase/migrations/fix_policies.sql`, linii 22-25  
**Cod**:
```sql
CREATE POLICY "Anyone can insert" ON public.quotes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
```

Oricine, inclusiv utilizatori neautentificați, poate insera oferte în baza de date. Nu există rate limiting sau CAPTCHA.

**Impact**: Posibil atac de tip flood — mii de oferte false care poluează baza de date.

---

### M2. Token admin stocat în localStorage — vulnerabil la XSS
**Fișier**: `AdminPage.tsx`, linii 19, 36, 39, 58, 76  
**Cod**:
```ts
localStorage.setItem("ga_admin_token", data.token);
localStorage.removeItem("ga_admin_token");
```

Token-ul JWT admin este stocat în `localStorage`, ceea ce îl face accesibil oricărui script JavaScript din pagină (inclusiv scripturi injectate prin XSS).

**Impact**: Un atac XSS ar putea fura token-ul admin.

**Remediere**: Folosește httpOnly cookies pentru token-ul admin. Aplică Content Security Policy.

---

### M3. Lipsă rate limiting la autentificare
**Fișier**: `pages/AuthPage.tsx`, linii 19-33  

Nu există nicio limitare a numărului de încercări de autentificare. Un atacator poate face brute-force asupra parolelor.

**Impact**: Atac de tip brute-force asupra conturilor.

---

### M4. Configurații complete stocate în localStorage
**Fișier**: `usePersistedConfig.js`, linia 69  
**Cod**:
```ts
localStorage.setItem(`ga_${key}`, JSON.stringify(config));
```

Toate configurațiile (dimensiuni, opțiuni, prețuri) sunt stocate în localStorage în clar. Un atacator cu access fizic la dispozitiv poate citi/configurația utilizatorului.

Suplimentar, `Dashboard.tsx:80` stochează proiecte întregi:
```ts
localStorage.setItem('loadProject', JSON.stringify({ config: project.config, product_type: project.product_type }));
```

**Impact**: Persistența datelor în clar în localStorage. Dacă un atacator obține access la device, poate citi/se fura configurațiile utilizatorului.

---

### M5. Mesaje de eroare Supabase expuse direct utilizatorului
**Fișiere**: Multiple  
**Cod**:
```ts
setError('Eroare: ' + insertError.message)  // SaveProjectModal.tsx:43
setMsg('❌ Update: ' + error.message)         // PartnerManagement.tsx:43
setMessage(error.message)                     // AuthPage.tsx:29
```

Mesajele de eroare Supabase sunt expuse direct în UI. Acestea pot conține informații despre structura bazei de date, nume de coloane, constrângeri.

**Impact**: Scurgere de informații despre structura internă a bazei de date.

---

### M6. Lipsă protecție CSRF la endpoint-ul `/quote/request`
**Fișier**: `backend/server.js`, linii 192-215  

Endpoint-ul nu verifică niciun header de origine sau token CSRF. Orice site poate trimite cereri către acest endpoint din background.

**Impact**: Posibil atac CSRF unde un site malițios trimite oferte false.

---

### M7. Nici o verificare a domeniului la redirectarea mailto
**Fișier**: `quotePdf.js`, linii 66-70  

Fallback-ul mailto construiește un link pe care îl deschide în fereastra curentă. Nu există validare a datelor înainte de a construi URL-ul.

**Impact**: Posibilă injecție de header-uri în mailto dacă datele client nu sunt validate suficient.

---

## 🔵 SCĂZUT

### L1. `@ts-nocheck` prezent în majoritatea fișierelor — TypeScript dezactivat
**Fișiere**: 20+ fișiere includ `// @ts-nocheck`

Type checking-ul e dezactivat în majoritatea componentelor, ceea ce elimină o întreagă clasă de protecții oferite de TypeScript.

**Remediere**: Elimină `@ts-nocheck` și rezolvă erorile de tip. TypeScript previne bug-uri de securitate legate de tipuri incorecte.

---

### L2. `document.write()` folosit pentru generarea PDF
**Fișier**: `quotePdf.js`, linia 318  
**Cod**:
```ts
printWindow.document.write(html);
```

`document.write()` este o practică învechită și periculoasă. Deși aici e folosit pe o fereastră nouă (risc redus), nu e o bună practică.

**Remediere**: Folosește `printWindow.document.body.innerHTML = html` după ce pagina e încărcată.

---

### L3. Lipsă Content-Security-Policy
Nu există nicio configurare CSP în `vite.config.js` sau `index.html`.

**Remediere**: Adaugă headere CSP pentru a preveni XSS, inline scripts, și pentru a restricționa sursele de conținut.

---

### L4. Catalogul de prețuri expus în `/catalog.json`
**Fișier**: Toate configuratoarele (`fetch("/catalog.json")`) și `AdminPage.tsx:85`

Fișierul `catalog.json` este accesibil public la rădăcina site-ului. Conține toate prețurile și structura de costuri.

---

### L5. Nu există `sourcemap: false` în producție
**Fișier**: `vite.config.js`  

Build-ul de producție nu dezactivează source maps. Dacă Vite generează source maps implicit, codul sursă TypeScript ar putea fi expus în producție.

**Remediere**: Adaugă `build: { sourcemap: false }` sau cel puțin `build: { sourcemap: 'hidden' }` în `vite.config.js`.

---

## 📋 Recomandări Prioritizate

### Immediat (săptămâna aceasta)
1. **Activează RLS pe `projects` și `profiles`** cu politici `user_id = auth.uid()`
2. **Mută verificarea admin** din client-side (email hardcodat) în RLS/backend (câmp dedicat `is_admin`)
3. **Înlocuiește discriminatorul admin** din `price_multiplier = 0.75` cu un câmp dedicat
4. **Șterge `srldigima@gmail.com`** din quotePdf.js și folosește variabile de mediu

### Pe termen scurt (2-4 săptămâni)
5. Adaugă `ProtectedRoute` pe toate configuratoarele
6. Adaugă verificări de ownership în toate query-urile de update/delete
7. Mută token-ul admin din localStorage în httpOnly cookie
8. Adaugă rate limiting la autentificare
9. Nu expune mesajele de eroare Supabase direct utilizatorilor
10. Mută numărul de WhatsApp și email-urile interne în variabile de mediu

### Pe termen mediu (1-3 luni)
11. Implementează Content-Security-Policy
12. Dezactivează source maps în producție
13. Elimină `@ts-nocheck` și activează type checking complet
14. Adaugă protecție CSRF pe toate endpoint-urile
15. Revizuiește toate politicile RLS cu un auditor extern

---

## 🔍 Metodologie
- Revizuire manuală a codului sursă (28 fișiere analizate)
- Căutare pattern-uri: `innerHTML`, `localStorage`, `.delete()`, `.insert()`, `fetch()`, email-uri, numere de telefon
- Analiză politici RLS din migrările SQL
- Verificare rutare și protecție rutelor
- Analiză flux de date: client → Supabase → backend

**Notă**: Acest audit acoperă doar codul din `/src` și migrările SQL. Nu include:
- Configurația Supabase Dashboard (verificare live RLS)
- Bucket-uri de stocare Supabase
- Configurația de deployment
- Teste de penetrare active
