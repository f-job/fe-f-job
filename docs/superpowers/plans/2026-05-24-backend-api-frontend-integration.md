# Backend API Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate every currently implemented `be-f-job` API into `fe-f-job` with working services and minimal UI pages.

**Architecture:** Keep the existing axios client and auth store. Correct endpoint mismatches in auth, add monitoring service, and add protected admin/system pages so all user and monitoring APIs are reachable from the frontend. UI stays minimal and follows existing React Bootstrap patterns.

**Tech Stack:** React, TypeScript, Vite, React Router, Zustand, Axios, React Bootstrap, React Hook Form, Zod.

---

## File Structure

- Modify `src/services/authService.ts`: align auth endpoints with backend.
- Modify `src/stores/authStore.ts`: keep user shape compatible with backend `name` field while preserving existing UI.
- Create `src/services/monitoringService.ts`: wrap `/monitoring/*` APIs.
- Create `src/layouts/AdminLayout.tsx`: shared admin/system layout.
- Create `src/pages/VerifyEmailPage.tsx`: handle `/auth/verify-email/:token`.
- Create `src/pages/ResendVerificationPage.tsx`: handle `/auth/send-email-verification`.
- Create `src/pages/AdminUsersPage.tsx`: use all `/users` CRUD APIs.
- Create `src/pages/MonitoringPage.tsx`: use all `/monitoring` APIs.
- Modify `src/routes/index.tsx`: register new routes.
- Modify `src/components/common/AppNavbar.tsx`: expose admin/system links and logout.

---

### Task 1: Fix auth API service and store compatibility

**Files:**
- Modify: `src/services/authService.ts`
- Modify: `src/stores/authStore.ts`

- [ ] Change register endpoint from `/auth/register` to `/auth/signup` and send `{ email, name, password }`.
- [ ] Change reset password endpoint to `/auth/reset-password/:token` and send `{ password }`.
- [ ] Add `verifyEmail(token)` and `resendVerification(email)` methods.
- [ ] Normalize authenticated user so both `name` and legacy `fullName` can be read safely.

### Task 2: Add verify and resend email pages

**Files:**
- Create: `src/pages/VerifyEmailPage.tsx`
- Create: `src/pages/ResendVerificationPage.tsx`
- Modify: `src/routes/index.tsx`

- [ ] Add route `/xac-thuc-email/:token` for email verification.
- [ ] Add route `/gui-lai-xac-thuc-email` for resend verification.
- [ ] Use loading, success, and error states.

### Task 3: Add admin layout and users CRUD page

**Files:**
- Create: `src/layouts/AdminLayout.tsx`
- Create: `src/pages/AdminUsersPage.tsx`
- Modify: `src/routes/index.tsx`

- [ ] Create protected `/admin` route group.
- [ ] Add `/admin/users` page.
- [ ] Use `userService.getAll`, `getById`, `create`, `update`, and `delete` from UI actions.
- [ ] Show 403/API errors in-page.

### Task 4: Add monitoring service and page

**Files:**
- Create: `src/services/monitoringService.ts`
- Create: `src/pages/MonitoringPage.tsx`
- Modify: `src/routes/index.tsx`

- [ ] Add service methods for health, readiness, liveness, metrics, alerts, simulate-error, trigger-gc, simulate-memory-leak.
- [ ] Add `/admin/monitoring` page.
- [ ] Render status cards and action buttons for dev/system endpoints.

### Task 5: Update navbar and run verification

**Files:**
- Modify: `src/components/common/AppNavbar.tsx`

- [ ] Add login/logout-aware navigation.
- [ ] Add links to admin users and monitoring when authenticated.
- [ ] Run `npm run build` in `fe-f-job`.

---

## Self-Review

- Auth coverage: signup, login, refresh, logout, verify email, resend verification, forgot password, reset password are covered.
- Users coverage: list, detail, create, update, delete are covered through `AdminUsersPage`.
- Monitoring coverage: all existing monitoring endpoints are covered through `MonitoringPage`.
- No unsupported planned F-Job APIs are included because the backend does not implement them yet.
