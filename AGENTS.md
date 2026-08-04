# Ruhama School Management System

## Structure

```
client/     React 19 + Vite 8 + Tailwind CSS 4 (JSX, not TS)
server/     Express 5 + Mongoose 9 (CommonJS, not ESM)
backup/     Stale copy — ignore
```

No root `package.json`. Each directory is independent.

## Commands

### Client
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — preview production build

### Server
- `npm start` — `node server.js`
- `npm run dev` — `nodemon server.js`

## Architecture notes

- **Auth**: JWT in `localStorage` under key `"teacher"`. Bearer token in `Authorization` header via `server/middlewares/authMiddleware.js`. Two roles: `"admin"` and `"teacher"` (stored on Teacher model `role` field).
- **Auth is inconsistently applied**: `examSettingRoutes` uses `protect`/`authorizeRoles` middleware; `paymentRoutes` has auth middleware **commented out**. The client `ProtectedRoute` and `AuthRedirect` components guard routes client-side.
- **API base URL** is hardcoded in `client/src/services/api.js` to the production Vercel deployment. Change for local dev.
- **Image upload**: Cloudinary via `multer-storage-cloudinary`, folder `ruhama/students`, max 5 MB.
- **Excel import**: `multer` memoryStorage, `.xls`/`.xlsx` only, max 10 MB.
- **`server/.env` is committed** — contains live MongoDB, JWT, and Cloudinary credentials.
- **CSS**: Tailwind v4 syntax (`@import "tailwindcss"` in `index.css`). No `tailwind.config.js`.
- **Client deployed on Vercel** (`vercel.json` with SPA rewrite rule).
- **No test framework** configured. No CI/CD in repo.

## API routes

| Prefix | File |
|--------|------|
| `/api/auth` | `server/routes/authRoutes.js` |
| `/api/reports` | `server/routes/reportRoutes.js` |
| `/api/teachers` | `server/routes/teacherRoutes.js` |
| `/api/students` | `server/routes/studentRoutes.js` |
| `/api/payments` | `server/routes/paymentRoutes.js` |
| `/api/exams` | `server/routes/examSettingRoutes.js` |

MongoDB models in `server/models/` — Student, Teacher, Report, Payment, PaymentItem, PaymentAllocation, StudentLedger, StudentFeeStructure, StudentFeeStructureItem, FeeCategory, ExamSetting, Counter, StudentRestriction.

## Gotchas

- The root `AdmitCardPreview.jsx` is a **duplicate/orphan** — the real component lives at `client/src/components/exam/AdmitCardPreview.jsx`.
- ESLint uses the new flat config format (`eslint.config.js`, not `.eslintrc.*`).
- `server/` has no lint or typecheck script.
- React Router v7 uses the `react-router-dom` API — layout routes via `element={<ProtectedRoute><MainLayout /></ProtectedRoute>}` pattern.
