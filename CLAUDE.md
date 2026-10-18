@AGENTS.md

# JodJod (จดจด) — Web App

Frontend ของ JodJod: สมุดโน้ต/เช็คลิสต์ส่วนตัวที่ sync กับ LINE Bot ได้ เว็บนี้เป็น client ล้วน คุยกับ **Go backend แยกต่างหาก** (`NEXT_PUBLIC_API_BASE`, default `http://localhost:8080`) ไม่มี API route หรือ server logic ใน repo นี้

## Stack

- **Next.js 16.3 (App Router, Turbopack)** + React 19 + TypeScript (strict) — ดู `AGENTS.md`: API ของ Next เวอร์ชันนี้ต่างจากที่คุ้นเคย ให้อ่าน `node_modules/next/dist/docs/` ก่อนเขียน
- Tailwind CSS v4 (`@tailwindcss/postcss`) + shadcn (style `base-nova`, ใช้ `@base-ui/react` ไม่ใช่ Radix)
- `lucide-react` (icon), `motion/react` (animation หน้า landing), `@lottiefiles/dotlottie-react` (loading), `date-fns`
- Auth: `@react-oauth/google`, `@line/liff`
- Path alias: `@/*` → root ของโปรเจกต์

## Commands

```bash
npm run dev     # dev server ที่ http://localhost:3000
npm run build
npm run lint    # eslint (eslint-config-next)
```

ยังไม่มี test suite

## Environment (`.env` / `.env.local`, ดูตัวอย่างใน `.env.example`)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `NEXT_PUBLIC_API_BASE` | URL ของ Go backend |
| `NEXT_PUBLIC_LIFF_ID` | LINE LIFF ID สำหรับ login / เชื่อมบัญชี LINE |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

หมายเหตุ: `.gitignore` มี `.env*` ซึ่งจะ ignore `.env.example` ไปด้วย `next.config.ts` มี `allowedDevOrigins` สำหรับ cloudflared tunnel (ไว้ทดสอบ LIFF จากมือถือ) ถ้าเปลี่ยน tunnel ต้องแก้ hostname ตรงนี้ด้วย

## โครงสร้าง

```
app/
  layout.tsx          Provider tree: GoogleOAuthProvider > AuthProvider > LanguageProvider > Toaster
  page.tsx            Landing page (ประกอบจาก components/landing/*)
  login/page.tsx      Login + Register (tabs): email/password, Google, LINE (LIFF)
  register/page.tsx   แค่ render <LoginPage defaultTab="register" />
  notes/page.tsx      หน้าหลัก: feed โน้ต, สร้าง/แก้/ลบ, ค้นหา, กรองตาม type
  chat/page.tsx       แชทกับ AI เต็มหน้า: ประวัติจาก LINE + เว็บ, โหลดข้อความเก่า, ปุ่มยกเลิก
  edit/[id]/page.tsx  หน้าแก้ไขโน้ตแบบเต็มหน้า (params เป็น Promise)
  account/page.tsx    โปรไฟล์, อัปโหลด avatar, ใช้รูปจาก LINE, link/unlink Google & LINE
  subscription/page.tsx  แพ็กเกจ Free/Premium, สมัคร (PromptPay/บัตร — mock), ยกเลิก, ประวัติ
  feedback/page.tsx   ส่ง feedback (complaint/suggestion/bug/other) + ดูของตัวเอง
  admin/page.tsx      Dashboard แอดมิน: stats + tabs feedbacks / users / subscriptions
lib/
  api.ts              API client ทั้งหมด (ทุก call ต้องผ่านไฟล์นี้)
  types.ts            Type ที่ตรงกับ JSON ของ backend (snake_case)
  auth-context.tsx    AuthProvider / useAuth()
  language-context.tsx LanguageProvider / useLanguage() → t(key)
  translations.ts     คำแปล th / en
  utils.ts            cn()
  use-assistant-chat.ts  hook รวม logic แชท AI (ส่ง, ยกเลิก, โหลดประวัติ) ใช้ทั้ง AssistantBox และหน้า /chat
components/
  Navbar.tsx          Navbar หลักที่ทุกหน้าใช้ (shared/NavBar.tsx ไม่ได้ถูกใช้)
  AssistantBox.tsx    กล่องแชท "บอก JodJod" แบบย่อบนหน้า notes (5 ข้อความล่าสุด + ลิงก์ไป /chat)
  chat/ChatExchange.tsx  bubble หนึ่งรอบ (ข้อความผู้ใช้ + คำตอบ AI + ปุ่มยกเลิก) ใช้ร่วมกัน
  NoteCard.tsx        การ์ดโน้ต + toggle item ของ checklist + เวลาเตือนของ reminder
  ToggleBar.tsx       ตัวกรอง type (all / note / checklist)
  UserCard.tsx, LanguageToggle.tsx, Loading.tsx (Lottie), spiral.tsx
  landing/            Hero, CoreFeature, HowItWorks, CTA, Footer
  ui/                 shadcn primitives + modal, toast, noteform, dropdownbutton, date
```

## Features & การทำงาน

### Auth
- วิธี login: email/password, Google (credential จาก `@react-oauth/google`), LINE (LIFF `id_token`) — ทุกแบบได้ `{ user, token, identities }`
- Token: backend ส่ง HttpOnly cookie **และ** token ใน body; `api.ts` เก็บ token ไว้ใน memory + `sessionStorage["jodjod_token"]` เป็น fallback (cookie ข้าม origin ตอน dev) แล้วแนบ `Authorization: Bearer` ทุก request พร้อม `credentials: "include"`
- `AuthProvider` เรียก `getMe()` ตอน mount; login สำเร็จ → `router.push("/notes")`, logout → `/login`
- เชื่อมหลายบัญชีได้ (identities: google / line) ผ่านหน้า account
- **Route guard ทำฝั่ง client ในแต่ละหน้า** (`useEffect` เช็ค `isAuthenticated` แล้ว redirect ไป `/login` หรือ `/login?redirect=...`) — ไม่มี middleware; หน้า admin เช็ค `user.role === "admin"`

### Notes
- `NoteKind`: `note | todo | checklist | reminder`; ตัวกรองบนเว็บใช้ `all | note | checklist`
- Note มี `remind_at` (reminder), `due_date`, `source` (`line | web | ai`)
- Feed: `GET /api/notes?type&q&sort&after&limit` (cursor pagination ผ่าน `next_cursor`) — หน้า notes debounce การค้นหา 200ms
- สร้างโน้ต: `NoteForm` ใช้ `parseChecklistInput()` แยกข้อความเป็น title + items (รองรับ comma, `:`, ขึ้นบรรทัดใหม่, bullet/เลขนำหน้า)
- แก้ไข (`content`, `is_done`), ลบ, toggle item ของ checklist (`PATCH /api/notes/:id/items/:itemId`)
- Free tier จำกัด 50 โน้ต, Premium ไม่จำกัด (บังคับที่ backend; เว็บแสดง count จาก `/api/notes/count`)

### AI Assistant (ใช้ได้ทั้ง LINE และเว็บ/แอป)
- AI ตัวเดียวกับ LINE bot (backend `internal/assistant`, ค่าเริ่มต้น local Ollama `qwen3:4b-instruct`)
- `AssistantBox` เรียก `sendAssistantMessage(text)` → `{ reply, action_id, undoable, wrote }`; ถ้า `wrote` ให้โหลด feed ใหม่ (AI อาจเพิ่มเข้าลิสต์เดิม)
- ปุ่มยกเลิก → `undoAssistantAction(action_id)` (ภายใน 24 ชม., ครั้งเดียว; 404/409 มี `data.message` ให้แสดง)
- AI ใช้ไม่ได้ → 503 และ `data.reply` มีข้อความสุภาพ; ผู้ใช้ยังใช้ `NoteForm` ได้ตามปกติ
- แต่ละข้อความทำงานแยกกัน (ไม่มีความจำบทสนทนา) เหมือนใน LINE

### Subscription
- Tier: `free | premium`; Premium ฿99/เดือน หรือ ฿990/ปี
- การชำระเงินยังเป็น **mock UI** (PromptPay / บัตร) — แค่ส่ง `payment_method` ไป `/api/subscription/subscribe` ไม่มี payment gateway จริง

### Feedback & Admin
- Feedback status: `pending | investigating | resolved | dismissed`
- Admin: ดู `AdminStats`, กรอง/เปลี่ยนสถานะ feedback, เปลี่ยน tier/role ของ user, ดูรายการ subscription และรายได้

### i18n
- ภาษา `th` (default) / `en`, เก็บใน `localStorage["jodjod_lang"]`
- ข้อความ UI ใหม่ต้องเพิ่ม key ใน `lib/translations.ts` ทั้ง `th` และ `en` แล้วเรียกผ่าน `t("key")` (ถ้าไม่มี key จะ fallback เป็น th แล้วเป็นชื่อ key)
- ยังมีข้อความ toast บางจุดที่ hardcode ภาษาไทย (เช่นใน `app/notes/page.tsx`) — ถ้าแก้ส่วนนั้นควรย้ายไปใช้ `t()`

## Backend API (ทั้งหมดอยู่ใน `lib/api.ts`)

| กลุ่ม | Endpoints |
|---|---|
| Auth | `POST /api/auth/{register,login,google,line,logout}`, `GET /api/auth/me`, `POST /api/auth/link/{google,line}`, `POST /api/auth/unlink/{google,line}`, `POST /api/auth/avatar` (multipart field `avatar`), `PATCH /api/auth/profile` |
| Profile/Notes | `GET /api/profile`, `GET /api/notes/count`, `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/:id`, `PATCH /api/notes/:id/items/:itemId` |
| AI Assistant | `POST /api/assistant/messages` (`{text}`), `POST /api/assistant/actions/:id/undo`, `GET /api/assistant/history?limit&before` (เก่า→ใหม่, `next_before` สำหรับหน้าก่อนหน้า) |
| Feedback | `GET/POST /api/feedback` |
| Subscription | `POST /api/subscription/{subscribe,cancel}`, `GET /api/subscription/{current,history}` |
| Admin | `GET /api/admin/{stats,feedbacks,users,subscriptions}`, `PATCH /api/admin/feedbacks/:id/status`, `PATCH /api/admin/users/:id/{tier,role}` |

Conventions:
- ใช้ `request<T>()` ใน `api.ts` เสมอ (ใส่ `Content-Type`, Bearer token, cookie ให้อัตโนมัติ; 204 → `undefined`)
- Error จะถูก throw เป็น `ApiError` (`status`, `data`) โดย message มาจาก `data.error` หรือ `data.details`
- รูป avatar จาก backend อาจเป็น path สัมพัทธ์ → แสดงผ่าน `getAvatarUrl()`
- Field ของ type ใช้ snake_case ให้ตรงกับ backend อย่าแปลงเป็น camelCase

## UI / Design conventions

- ธีม "papercraft / สมุดจด": design tokens อยู่ใน `app/globals.css` (`--bg #F0EFEB`, `--page #FAF9F6`, `--paper`, `--rule #D1CEC5`, `--ink #26343F`, `--ink-muted #66737D`, `--marker #3D5A73` = primary, `--checklist #D8B968`, `--danger #A34F45`)
- Body มีพื้นหลังเส้นบรรทัดสมุด; มี utility class เช่น `.paper-card`
- ฟอนต์: `IBM Plex Sans Thai` (body/heading), `Chonburi` (`.font-display` สำหรับหัวข้อแบรนด์)
- โค้ดเดิมใช้ hex ตรงๆ ใน className บ่อย (`bg-[#3D5A73]`, `text-[#66737D]`) — ทำตามแบบเดิมให้สอดคล้อง หรือใช้ CSS variables
- Toast: `toast.add({ type: "success" | "error", title?, description, priority? })` จาก `@/components/ui/toast`
- ยืนยันการกระทำด้วย `Modal` จาก `@/components/ui/modal`; loading ใช้ `<Loading fullScreen text=... />`
- ทุกหน้าเป็น `"use client"`
- Comment ในโค้ดเขียนเป็นภาษาไทยได้
