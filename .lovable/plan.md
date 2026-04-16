

# Plan: FinBeauty — Comprehensive Fixes & Improvements

## Overview
This plan covers 25 items: security fixes, database migrations, UI/UX improvements across Dashboard, Agendamentos, Clientes, Follow-Up, Fichas, Login, Link Bio, Mobile layout, and nomenclature changes.

---

## Phase 1: Database Migrations (SQL)

**Migration 1 — Security & Schema:**
- Add `birthday` column (date, nullable) to `clientes` table
- Add `consent_signed_at` column (timestamptz, nullable) to `fichas` table
- Add UNIQUE constraint on `slug` in `profiles`
- Create RLS policy on `profiles` to block users from updating their own `role` column (use a `BEFORE UPDATE` trigger that prevents role changes unless done by service_role)
- Add UPDATE policy on `fichas-fotos` storage bucket

**Security approach for role column:**
- Create a trigger function `prevent_role_change()` that checks if `OLD.role != NEW.role` and raises an exception unless the current user is the service role
- This ensures no authenticated user can escalate privileges via the API

---

## Phase 2: Admin Route Protection (App.tsx)

- Create `AdminRoute` wrapper component that checks `profile?.role === 'admin'` and redirects non-admins to `/home_profissional`
- Wrap `/admin` route with this component
- The sidebar already hides the Admin link for non-admins; this adds server-verified protection

---

## Phase 3: Login Page (Auth.tsx)

- Remove "Não tem conta? Cadastre-se" link entirely
- Add "Acessar Demonstração" button that calls `signIn('demo@finbeauty.com.br', 'demo123')`
- Add route `/creatifin` in App.tsx with a simple signup form (nome, email, senha) — public but secret URL

---

## Phase 4: Dashboard (DashboardTab.tsx)

- When `todayAppts.length === 0`, show a `+ Novo Agendamento` button inside the empty state
- This button opens the **inline** new appointment dialog (same popup used in AgendamentosTab) directly on the Dashboard — no navigation
- Extract the "New Appointment" dialog into a shared component or duplicate inline with full create logic (client select, service select, date, time, save to Supabase)
- Add "+ Novo Cliente" mini-button next to client select in the appointment popup
- If services list is empty when clicking service select, show message and redirect to Serviços

---

## Phase 5: Agendamentos Popup Improvements (AgendamentosTab.tsx)

- Add "+ Novo Cliente" button next to cliente Select field that opens a nested Dialog for quick client creation (without closing the appointment popup)
- Make Data/Horário fields `grid-cols-2` with equal 50% width
- If `servicos.length === 0` when user opens service dropdown, auto-open service creation or show inline message with link

---

## Phase 6: Clientes (ClientesTab.tsx)

- Add `birthday` field (type="date") to new client form and edit client form
- Update interface and Supabase insert/update to include `birthday`
- Fix WhatsApp modal responsiveness: `max-w-[calc(100vw-2rem)]`, proper padding, `break-words`

---

## Phase 7: Follow-Up — Birthday Section

- In ClientesTab (Follow-Up tab), query clients where `birthday` day+month matches today
- Show "Aniversariantes de Hoje" card with client names and WhatsApp button with birthday message template

---

## Phase 8: Fichas de Anamnese (FichasTab.tsx)

- When consent toggle is activated, save `consent_signed_at = new Date().toISOString()` to the fichas record
- Display formatted timestamp below toggle: "Assinado em DD/MM/AAAA às HH:MM:SS"
- Add "Enviar PDF via WhatsApp" button (generates simple text summary, opens wa.me link with message)

---

## Phase 9: Mobile Layout Fix (AppSidebar.tsx)

- The sidebar already uses drawer overlay on mobile — verify the hamburger button doesn't overlap content
- Add `pl-12 lg:pl-0` or similar top padding to `MainLayout` on mobile so content doesn't hide behind the hamburger button
- Ensure bottom nav doesn't overlap content (already has `pb-20 lg:pb-8`)

---

## Phase 10: Link Bio & Account Page (AccountPage.tsx)

- Wire "Salvar Link Bio" to actually save slug, links, sinal config to `profiles` table via Supabase
- Add real-time slug uniqueness check: on blur/change, query `profiles` where `slug = value AND id != user.id`
- Show error badge if slug is taken
- Replace all "Label" placeholders with "Nome"

---

## Phase 11: Secret Route /creatifin

- New page `CreateFinPage.tsx` with simple form: nome, email, senha
- Calls `supabase.auth.signUp()` with provided data
- Added to App.tsx routes (public, no auth required)

---

## Phase 12: Global Nomenclature

- Search and replace all instances of placeholder text "Label" (case-insensitive in UI strings) with "Nome" across all components

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/new.sql` | New migration for birthday, consent_signed_at, slug unique, role protection trigger, storage policy |
| `src/App.tsx` | Add AdminRoute, /creatifin route |
| `src/pages/Auth.tsx` | Remove signup link, add demo button |
| `src/pages/CreateFinPage.tsx` | New secret signup page |
| `src/components/modules/DashboardTab.tsx` | Inline new appointment dialog, empty state button |
| `src/components/modules/AgendamentosTab.tsx` | Inline new client button, equal-width date/time, empty services handling |
| `src/components/modules/ClientesTab.tsx` | Birthday field, WhatsApp modal fix, birthday section in follow-up |
| `src/components/modules/FichasTab.tsx` | Consent timestamp, WhatsApp PDF button |
| `src/components/layout/AppSidebar.tsx` | Mobile hamburger position fix |
| `src/components/layout/MainLayout.tsx` | Mobile top padding for hamburger |
| `src/pages/AccountPage.tsx` | Wire Supabase save, slug check, "Label"→"Nome" |
| `src/pages/AdminPage.tsx` | Admin role guard |

---

## Technical Notes

- The role protection trigger uses `SECURITY DEFINER` and checks `current_setting('role') != 'service_role'` to allow only backend/service calls to change roles
- Slug uniqueness uses a DB constraint + client-side validation for instant feedback
- The demo account login simply uses existing `signIn` — the demo user account needs to exist in the database (will document this)
- PDF generation for fichas will use a text-based summary opened via wa.me URL (no actual PDF file generation needed for MVP)

