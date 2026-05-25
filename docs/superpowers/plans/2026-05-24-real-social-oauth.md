# Real Social OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real Google and Facebook login from `fe-f-job` through verified backend OAuth endpoints in `be-f-job`.

**Architecture:** Frontend obtains provider tokens using Google Identity Services and Facebook JS SDK, then sends those tokens to backend. Backend verifies provider tokens, creates or links a local user, stores a normal refresh token, and returns the same auth response shape as email/password login.

**Tech Stack:** Express TypeScript backend, Prisma/MySQL, google-auth-library, JWT, React/Vite frontend, Axios, React Bootstrap.

---

## File Structure

### Backend

- Modify `be-f-job/prisma/schema.prisma`: add `user_oauth` and `oauth_provider` for provider identity links.
- Modify `be-f-job/src/config/env.ts`: add `GOOGLE_CLIENT_ID` and optional `FACEBOOK_APP_ID`.
- Modify `be-f-job/src/services/auth.service.ts`: add provider verification, OAuth user upsert/link flow, and token response reuse.
- Modify `be-f-job/src/controllers/auth.controller.ts`: add `googleOAuth` and `facebookOAuth` handlers.
- Modify `be-f-job/src/routes/auth.routes.ts`: add `POST /oauth/google` and `POST /oauth/facebook`.

### Frontend

- Modify `fe-f-job/src/services/authService.ts`: replace placeholder social login methods with backend API calls.
- Create `fe-f-job/src/services/socialProviderService.ts`: load Google/Facebook SDKs and return provider token.
- Modify `fe-f-job/src/stores/authStore.ts`: add `loginWithGoogle` and `loginWithFacebook` actions that store backend tokens.
- Modify `fe-f-job/src/components/auth/SocialLoginButtons.tsx`: call auth store social login actions instead of placeholder service methods.

---

### Task 1: Add backend OAuth persistence

**Files:**
- Modify: `be-f-job/prisma/schema.prisma`

- [ ] Add `user_oauth` model linked to `user`.
- [ ] Add `oauth_provider` enum with `GOOGLE` and `FACEBOOK`.
- [ ] Add `oauthAccounts user_oauth[]` relation on `user`.

### Task 2: Add backend env validation

**Files:**
- Modify: `be-f-job/src/config/env.ts`

- [ ] Add `GOOGLE_CLIENT_ID` as optional in development/test and required in production.
- [ ] Add `FACEBOOK_APP_ID` as optional in development/test and required in production.

### Task 3: Implement backend OAuth service

**Files:**
- Modify: `be-f-job/src/services/auth.service.ts`

- [ ] Import `OAuth2Client` from `google-auth-library` and `oauth_provider` from Prisma.
- [ ] Add token response helper to reuse JWT/refresh generation.
- [ ] Add `loginWithGoogle(idToken: string)`.
- [ ] Add `loginWithFacebook(accessToken: string)`.
- [ ] Add shared `findOrCreateOAuthUser(provider, providerId, email, name, image?)`.

### Task 4: Add backend OAuth controller/routes

**Files:**
- Modify: `be-f-job/src/controllers/auth.controller.ts`
- Modify: `be-f-job/src/routes/auth.routes.ts`

- [ ] Add controller methods reading `{ token }` from body.
- [ ] Add `POST /auth/oauth/google` and `POST /auth/oauth/facebook` routes.

### Task 5: Implement frontend provider SDK service

**Files:**
- Create: `fe-f-job/src/services/socialProviderService.ts`

- [ ] Add Google Identity Services script loader and token client wrapper.
- [ ] Add Facebook SDK loader and login wrapper.
- [ ] Read `VITE_GOOGLE_CLIENT_ID` and `VITE_FACEBOOK_APP_ID` only.

### Task 6: Connect frontend auth service/store/buttons

**Files:**
- Modify: `fe-f-job/src/services/authService.ts`
- Modify: `fe-f-job/src/stores/authStore.ts`
- Modify: `fe-f-job/src/components/auth/SocialLoginButtons.tsx`

- [ ] Send provider token to backend endpoints.
- [ ] Store returned backend `accessToken`, `refreshToken`, and `user`.
- [ ] Navigate behavior remains handled by auth pages/navbar state.

### Task 7: Verify

**Files:**
- Verify only

- [ ] Run `npm --prefix /Users/mac/Documents/FPTU/EXE/be-f-job run build`.
- [ ] Run `npm --prefix /Users/mac/Documents/FPTU/EXE/fe-f-job run build`.

---

## Self-Review

- Google backend verification is covered with `google-auth-library`.
- Facebook backend verification is covered through Graph API using the frontend-provided access token.
- Frontend does not use or store provider secrets.
- The existing auth response contract remains unchanged.
- Prisma schema changes require a migration/generate step before runtime DB use.
