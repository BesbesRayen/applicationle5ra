# CreadiTn — BNPL Platform

**Buy Now, Pay Later (BNPL) platform** for the Tunisian market. Users can apply for credit, verify their identity via AI-powered KYC, and purchase products from partner merchants in installments.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Architecture](#3-architecture)
4. [All API Endpoints](#4-all-api-endpoints)
5. [Database Schema](#5-database-schema)
6. [Environment Variables](#6-environment-variables)
7. [How to Run](#7-how-to-run)
8. [Known Limitations & TODOs](#8-known-limitations--todos)

---

## 1. Project Overview

CreadiTn is a full-stack BNPL (Buy Now, Pay Later) platform composed of:
- A **Spring Boot REST API** (backend) handling auth, KYC, credit, payments
- A **Next.js web dashboard** (admin + landing page)
- An **Expo React Native** mobile app (end-user)
- A **Socket.IO** real-time server for live notifications

**Tech Stack:**

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Spring Boot | 4.0.3 |
| Language | Java | 17 |
| Database | MySQL | 8.0 |
| ORM | Hibernate/JPA | — |
| Auth | JWT (JJWT) | 0.12.6 |
| KYC | Didit AI | v3 API |
| Web Dashboard | Next.js | — |
| Mobile | Expo (React Native) | — |
| Real-time | Socket.IO | — |
| PDF | Apache PDFBox | 3.0.3 |
| Docs | SpringDoc OpenAPI | 2.8.6 |

---

## 2. Project Structure

```
pfeprojet-main/
├── creadiTn/                   # Spring Boot backend (port 8082)
│   ├── src/main/java/com/creaditn/creaditnbackend/
│   │   ├── controller/         # 22 REST controllers (HTTP endpoints)
│   │   ├── service/            # Business logic layer
│   │   ├── repository/         # JPA data access layer
│   │   ├── entity/             # JPA entities (database tables)
│   │   ├── dto/                # Request/response data transfer objects
│   │   ├── security/           # JWT filter, admin filter, security config
│   │   ├── exception/          # Global exception handler + custom exceptions
│   │   ├── kyc/service/        # Didit AI KYC client
│   │   ├── scheduler/          # Cron jobs (payment reminders, overdue checks)
│   │   ├── util/               # Utility classes
│   │   └── config/             # CORS, MVC, Swagger configuration
│   ├── src/main/resources/
│   │   ├── application.properties  # App config (gitignored — do not commit)
│   │   ├── schema.sql              # Base DB schema
│   │   └── schema-bnpl.sql         # BNPL-specific schema
│   └── Dockerfile
│
├── Dashboard_client-main/      # Next.js admin dashboard (port 3000)
│   ├── src/app/                # Next.js App Router pages
│   │   ├── admin/              # Admin panel (stats, users, KYC, credits)
│   │   ├── dashboard/          # User dashboard
│   │   ├── boutiques/          # Store listings
│   │   └── api/                # Next.js API routes (proxy + NextAuth)
│   ├── src/components/         # Shared React components
│   ├── src/lib/api.ts           # Admin API client (all fetch calls)
│   └── Dockerfile
│
├── frontend mobile/            # Expo React Native app
│   ├── src/pages/              # 23 app screens
│   ├── src/lib/api.ts           # Mobile API client
│   ├── src/lib/auth.tsx         # Auth context (JWT storage)
│   └── src/lib/socket.ts        # Socket.IO client
│
├── socket-server/              # Socket.IO real-time server (port 3001)
│   ├── index.js                # Express + Socket.IO server
│   └── Dockerfile
│
├── docker-compose.yml          # Full stack Docker orchestration
├── .env.example                # Environment variable template
└── creaditn (1).sql            # Database dump for import
```

---

## 3. Architecture

### Communication Flow
```
Mobile App (Expo)           Admin Dashboard (Next.js)
     │                               │
     │ JWT Bearer token              │ X-Admin-Token header
     │                               │
     └─────────────┬─────────────────┘
                   │ HTTP REST API
                   ▼
         Spring Boot Backend (8082)
                   │
         ┌─────────┼──────────────┐
         │         │              │
       MySQL    File System    POST /emit
       (DB)     (uploads/)         │
                           Socket.IO Server (3001)
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
               Mobile App                  Admin Dashboard
               (live events)               (live events)
```

### Auth Flow
```
1. User submits email + password
2. Backend validates credentials → BCrypt password check
3. Backend generates JWT (contains userId + email, signed with secret)
4. Client stores JWT in memory / AsyncStorage
5. Every API request: Authorization: Bearer <token>
6. JwtAuthenticationFilter validates token on each request
7. Token expires after 24 hours (configurable via jwt.expiration)
```

### KYC Flow (Secure — Post-Audit)
```
User opens KYC screen
       │
       ▼
Upload: CIN front + CIN back + Selfie (live camera)
       │
       ▼
POST /api/kyc/verify  (JWT required)
       │
       ├─[A] JWT Ownership Check ──────────────────────────────────
       │      JWT.userId must == form.userId
       │      → 401 UNAUTHORIZED if mismatch (prevents IDOR)
       │
       ├─[B] Duplicate Document Check ─────────────────────────────
       │      SHA-256 hash of ID images stored
       │      → 400 if same image already used by another account
       │
       ├─[C] Didit AI Verification ─────────────────────────────────
       │      Sends front + back + selfie to Didit v3 API
       │      Didit performs: OCR + face matching (selfie vs ID photo)
       │      Returns: status + extracted name/DOB/document number
       │
       ├─[D] Identity Name Matching ────────────────────────────────
       │      extracted.firstName ≈ user.firstName
       │      extracted.lastName  ≈ user.lastName
       │      → 400 if mismatch: "Identity document does not match"
       │
       ├─[E] Didit Identity ID Lock ────────────────────────────────
       │      Didit assigns a unique identity ID per real person
       │      → 400 if same Didit ID used by another account
       │
       └─[F] Result: Auto-approve or reject → notify user
              Admin can manually override in admin panel
```

**Liveness Detection:** Depends on Didit's API processing the `selfie_image`. Requires `DIDIT_API_KEY` to be configured. Without it, system falls back to simulation mode (auto-approve) — **only acceptable in development**.

---

## 4. All API Endpoints

### Authentication (`/api/auth`)
| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/register` | No | `{firstName, lastName, email, password, phone}` | Register new user |
| POST | `/api/auth/login` | No | `{email, password}` | Login → returns JWT |
| POST | `/api/auth/google-login` | No | `{googleToken}` | Google OAuth login |
| POST | `/api/auth/verify-email` | No | `{email, code}` | Verify email OTP |
| POST | `/api/auth/resend-verification` | No | `{email}` | Resend OTP |
| POST | `/api/auth/forgot-password/request` | No | `{identifier}` | Request password reset |
| POST | `/api/auth/forgot-password/confirm` | No | `{identifier, code, newPassword}` | Confirm reset |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me?userId=X` | JWT | Get own profile |
| GET | `/api/users/profile?userId=X` | JWT | Get profile (alias) |
| GET | `/api/users/account-status?userId=X` | JWT | Get setup completion status |
| PUT | `/api/users/me?userId=X` | JWT | Update profile |
| PUT | `/api/users/password?userId=X` | JWT | Change password |
| POST | `/api/users/photo?userId=X` | JWT | Upload profile photo |
| DELETE | `/api/users/delete?userId=X` | JWT | Delete account |

### KYC (`/api/kyc`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/kyc/verify` (multipart) | JWT | Submit ID + selfie → Didit AI verification |
| GET | `/api/kyc/status?userId=X` | JWT | Get KYC status |
| POST | `/api/kyc/upload-multipart` | JWT | Upload docs without AI check |

### Credit (`/api/credits`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/credits/simulate` | JWT | Simulate credit offer |
| POST | `/api/credits/request?userId=X` | JWT | Request a credit line |
| GET | `/api/credits/my?userId=X` | JWT | Get user's credits |
| GET | `/api/credits/balance?userId=X` | JWT | Get available credit |
| GET | `/api/credits/my-installments?userId=X` | JWT | Get installments |
| GET | `/api/credits/my-installments/pending?userId=X` | JWT | Get pending installments |

### Dashboard (`/api/dashboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard?userId=X` | JWT | Complete dashboard summary |

### Cards, Payments, Articles, Merchants, Notifications, Support, Transactions — all require JWT.

### Admin (`/api/admin`) — Requires `X-Admin-Token` header
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Get admin token |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | All users |
| GET/PUT | `/api/admin/kyc/*` | KYC management |
| GET/PUT | `/api/admin/credits/*` | Credit management |
| GET/POST/PUT/DELETE | `/api/admin/articles/*` | Article management |
| GET | `/api/admin/invoices/*` | Invoice management |
| GET | `/api/admin/purchases` | Purchase orders |
| GET | `/api/admin/notifications` | Admin notifications |

---

## 5. Database Schema

### Key Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | id, email, password_hash, first_name, last_name, kyc_status, email_verified | BCrypt passwords |
| `kyc_documents` | id, user_id, cin_front_url, cin_back_url, selfie_url, cin_front_hash, cin_back_hash, cin_number_unique, didit_identity_id, status, face_match_score | SHA-256 hashes prevent duplicate documents |
| `credit_requests` | id, user_id, product_name, total_amount, n_installments, monthly_amount, status | PENDING/APPROVED/REJECTED |
| `installments` | id, credit_request_id, due_date, amount, penalty, status, paid_date | PENDING/PAID/OVERDUE |
| `financial_profiles` | id, user_id, employment_status, monthly_salary, marital_status | Financial assessment |
| `cards` | id, user_id, card_number_encrypted, type, default_card | Encrypted card numbers |
| `creadi_scores` | id, user_id, score, level, risk_level | Credit scoring |
| `articles` | id, merchant_id, name, price, image_url, active | Product catalog |
| `merchants` | id, name, category, logo_url | Partner stores |
| `purchase_orders` | id, user_id, article_id, total_amount, payment_type, status | Orders |
| `payments` | id, user_id, installment_id, amount, paid_at | Payment records |
| `notifications` | id, user_id, title, message, type, read | User alerts |
| `invoices` | id, user_id, purchase_order_id, total_amount, status | Billing |
| `transactions` | id, user_id, type, amount, description | Audit trail |

---

## 6. Environment Variables

Create `.env` based on `.env.example`:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_ROOT_PASSWORD` | MySQL root password | `secure_root_pass` |
| `DB_USER` | MySQL app user | `creaditn` |
| `DB_PASSWORD` | MySQL app password | `secure_app_pass` |
| `JWT_SECRET` | JWT signing secret (≥32 chars) | `random-64-char-string` |
| `MAIL_USERNAME` | Gmail address | `app@gmail.com` |
| `MAIL_PASSWORD` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `SOCKET_EMIT_SECRET` | Backend→socket auth secret | `random-secret` |
| `ADMIN_EMAIL` | Admin login email | `admin@bnpl.com` |
| `ADMIN_PASSWORD` | Admin password | `secure_pass` |
| `DIDIT_API_KEY` | Didit AI KYC API key | `didit_api_xxxx` |

Mobile (`frontend mobile/.env`):
- `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8082`

Dashboard (`Dashboard_client-main/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:8082`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

---

## 7. How to Run

### Option A — Docker (Recommended)

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with real values

# 2. Start all services (MySQL + Backend + Socket + Dashboard)
docker-compose up --build

# URLs:
#   Dashboard:    http://localhost:3000
#   Backend API:  http://localhost:8082
#   Swagger UI:   http://localhost:8082/swagger-ui.html
#   Socket:       http://localhost:3001
```

### Option B — Manual (Development)

**Prerequisites:** Java 17, Node.js 20, MySQL 8, Maven

```bash
# 1. Database
mysql -u root -e "CREATE DATABASE creaditn CHARACTER SET utf8mb4;"
mysql -u root creaditn < "creaditn (1).sql"

# 2. Backend
cd creadiTn
./mvnw spring-boot:run   # runs on :8082

# 3. Socket server
cd socket-server
npm install && npm run dev   # runs on :3001

# 4. Dashboard
cd Dashboard_client-main
npm install && npm run dev   # runs on :3000

# 5. Mobile
cd "frontend mobile"
npm install --legacy-peer-deps
npx expo start   # scan with Expo Go
```

### Default Credentials
- **Admin panel:** `admin@bnpl.com` / `admin123`
- Change via `app.admin.email` and `app.admin.password` in `application.properties`

---

## 8. Known Limitations & TODOs

### Security Fixes Applied (This Audit)
| Fix | File | Description |
|----|------|-------------|
| **IDOR Prevention** | `KycController.java` | JWT userId must match form userId — prevents submitting KYC for other users |
| **Face Matching** | `DiditClient.java` | Selfie now sent to Didit API as `selfie_image` for face comparison |
| **KYC File Access** | `SecurityConfig.java` | `/api/files/kyc/**` no longer publicly accessible |
| **Admin Credentials** | `AdminController.java` | Moved from hardcoded strings to `@Value` properties |
| **Error Leakage** | `GlobalExceptionHandler.java` | Generic 500 message — no internal stack traces to client |
| **CORS** | `SecurityConfig.java` | Restricted to known origins instead of wildcard |
| **Logging** | `KycService.java` | `System.err.println` replaced with SLF4J `log.warn` |

### Known Limitations
| # | Severity | Description |
|---|----------|-------------|
| L1 | MEDIUM | **Liveness Detection** — requires `DIDIT_API_KEY`. Without it, falls back to simulation (auto-approve). Set in production. |
| L2 | MEDIUM | **Admin token** is timestamp-based (`admin-session-{ts}`). No HMAC signature — upgrade to signed JWT in production. |
| L3 | MEDIUM | **Other controllers** (UserController, CreditController, etc.) also accept `userId` as request param without JWT ownership check. Extend the `enforceOwnership` pattern. |
| L4 | LOW | **KYC IP Audit** — IP address not captured in KYC attempt log. Add `ip_address` field to `kyc_documents`. |
| L5 | LOW | **Payment gateway** not integrated — payments are simulated. |

### Flagged TODOs
| File | TODO |
|------|------|
| `socket-server/index.js` | `cors: { origin: '*' }` — restrict in production |
| `application.properties` | `jwt.expiration=86400000` — consider refresh token pattern |
| `DiditClient.java` | Didit `selfie_image` field name may vary by API version — verify with Didit docs |
| Multiple controllers | `@RequestParam Long userId` — extract from JWT instead for full IDOR protection |

### Files Safe to Delete (Request Confirmation First)
| File | Reason |
|------|--------|
| `nulgit` | Empty file, zero content |
| `.gitignore#` | Corrupted duplicate of `.gitignore` |
| `frontend mobile/playwright-fixture.ts` | Empty fixture, no tests reference it |
| `frontend mobile/src/test/example.test.ts` | Scaffolded but empty |

"# applicationle5ra" 
