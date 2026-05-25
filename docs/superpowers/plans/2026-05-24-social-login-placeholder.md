# Social Login Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google and Facebook login UI to login/signup without faking auth while backend OAuth APIs are not implemented.

**Architecture:** Add a reusable social login button component and wire it into existing auth pages. Add explicit authService methods for Google/Facebook that fail safely with an unsupported-feature message until backend endpoints exist.

**Tech Stack:** React, TypeScript, React Bootstrap, react-hot-toast, Axios service layer.

---

## File Structure

- Create `src/components/auth/SocialLoginButtons.tsx`: reusable Google/Facebook button group.
- Modify `src/services/authService.ts`: add `loginWithGoogle` and `loginWithFacebook` methods that return a rejected promise with a safe message.
- Modify `src/pages/LoginPage.tsx`: render social buttons below password login form.
- Modify `src/pages/SignupPage.tsx`: render social buttons below signup form.

---

### Task 1: Add safe OAuth service methods

**Files:**
- Modify: `src/services/authService.ts`

- [ ] Add `UnsupportedAuthProviderError` class.
- [ ] Add `loginWithGoogle()` and `loginWithFacebook()` methods.
- [ ] Ensure methods do not write tokens or call missing endpoints.

### Task 2: Create reusable social login layout

**Files:**
- Create: `src/components/auth/SocialLoginButtons.tsx`

- [ ] Render divider text `Hoặc tiếp tục với`.
- [ ] Render Google and Facebook buttons.
- [ ] Call service methods and show toast error from returned error message.
- [ ] Support `mode="login" | "signup"` for button labels.

### Task 3: Add social layout to auth pages

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/SignupPage.tsx`

- [ ] Import `SocialLoginButtons`.
- [ ] Place buttons after the main form submit button.
- [ ] Keep existing email/password behavior unchanged.

### Task 4: Verify build

**Files:**
- Verify only

- [ ] Run `npm --prefix /Users/mac/Documents/FPTU/EXE/fe-f-job run build`.
- [ ] Expected result: build succeeds.

---

## Self-Review

- Google/Facebook UI is covered on login and signup.
- Backend OAuth absence is handled safely without fake tokens.
- Future backend integration can replace service methods with `/auth/oauth/google` and `/auth/oauth/facebook` calls.
