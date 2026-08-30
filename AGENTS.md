# Ruhama School Management System

## Structure

```
client/     React 19 + Vite 8 + Tailwind CSS 4 (JSX, not TS)
server/     Express 5 + Mongoose 9 (CommonJS, not ESM)
backup/     Stale nested copy — ignore
server.zip, "server (2).zip"   Project-root zip artifacts — ignore
```

No root `package.json`. Each directory is independent. Git repo root is this folder.

## Commands

### Client (`client/`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.js`, not `.eslintrc.*`)
- `npm run preview` — preview production build

### Server (`server/`)
- `npm start` — `node server.js`
- `npm run dev` — `nodemon server.js`
- No lint or test scripts. No test framework configured.

## Deployment (CI/CD)

`.github/workflows/deploy.yml` deploys automatically on push to `main`:
SSH to VPS → `server/` runs `npm ci --omit=dev` + `pm2 restart ruhama-backend` →
`client/` runs `npm ci` + `npm run build` → nginx reload.
`client/vercel.json` (SPA rewrite) exists but is not used by CI.

## Architecture notes

- **Teacher auth**: two JWTs on the client: token under `localStorage["token"]`, teacher object under `localStorage["teacher"]`. Sent as `Authorization: Bearer <token>` by the axios interceptor in `client/src/services/api.js`. On 401 it clears storage and redirects to `/login`.
- **Server auth** (`server/middlewares/authMiddleware.js`): `protect` (verifies JWT from `Authorization` header) + `authorizeRoles("admin"|"teacher")`, checked against `Teacher.role`.
- **Student portal auth** is separate: `server/middlewares/studentAuthMiddleware.js` (`protectStudent`, requires `decoded.role === "student"`). Client stores `localStorage["studentToken"]` / `localStorage["student"]` and builds the `Authorization` header manually (StudentPortal.jsx) — NOT via the shared axios instance.
- **Auth is inconsistently applied**: `paymentRoutes.js` has the `protect`/`authorizeRoles` middleware **commented out** on every route. `examSettingRoutes.js`, `feeSettingRoutes.js`, etc. use it. Client-side guards: `ProtectedRoute` (uses `adminOnly` prop) and `AuthRedirect` in `client/src/components/`.
- **API base URL**: `client/src/services/api.js` uses `import.meta.env.VITE_API_URL` — not hardcoded. `.env` → `http://localhost:5000/api`; `.env.production` → `https://api.ruhamaunitedschool.com/api`. Both files are gitignored.
- **`server/.env` is committed and git-tracked** — contains live MongoDB, JWT, and Cloudinary credentials. Do not rotate silently; changes affect production.
- **Image upload**: Cloudinary via `multer-storage-cloudinary`, folder `ruhama/students`, jpg/jpeg/png/webp only, max 5 MB (`middlewares/uploadImage.js`).
- **Excel import**: `multer` memoryStorage, Excel MIME types only, max 10 MB (`middlewares/uploadExcel.js`).
- **CSS**: Tailwind v4 syntax (`@import "tailwindcss"` in `index.css`). No `tailwind.config.js`.

## API routes

Mounted in `server/server.js`. Prefix → file:

| Prefix | File |
|--------|------|
| `/api/auth` | `server/routes/authRoutes.js` |
| `/api/reports` | `server/routes/reportRoutes.js` |
| `/api/teachers` | `server/routes/teacherRoutes.js` |
| `/api/students` | `server/routes/studentRoutes.js` |
| `/api/payments` | `server/routes/paymentRoutes.js` |
| `/api/exams` | `server/routes/examSettingRoutes.js` |
| `/api/fees` | `server/routes/feeSettingRoutes.js` |
| `/api/ledger` | `server/routes/studentLedgerRoutes.js` |
| `/api/settings` | `server/routes/settingsRoutes.js` |
| `/api/attendance` | `server/routes/attendanceRoutes.js` |
| `/api/student-portal` | `server/routes/studentPortalRoutes.js` |

MongoDB models in `server/models/`: Student, Teacher, Report, Payment, PaymentItem, PaymentAllocation, StudentLedger, StudentFeeStructure, StudentFeeStructureItem, FeeCategory, ExamSetting, ExamSubject, ExamResult, ClassFeeSetting, Attendance, Settings, Counter, StudentRestriction, StudentFeeOverride, StudentFeeAssignment.

## Gotchas

- Project-root `AdmitCardPreview.jsx` is a **duplicate/orphan** — the real component is `client/src/components/exam/AdmitCardPreview.jsx`.
- `client/src/components/ProtectedRoute.jsx` is the real guard; `client/src/routes/ProtectedRoute.jsx` is a duplicate.
- React Router v7 keeps the `react-router-dom` API — layout routes use `element={<ProtectedRoute><MainLayout /></ProtectedRoute>}`.
- `server/` is CommonJS (`require`/`module.exports`, no "type": "module").
- ESLint uses flat config (`eslint.config.js`).