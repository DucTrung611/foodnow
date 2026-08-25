# auth

## Owns
- Login, registration, session bootstrap (silent refresh on page load)
- Profile + delivery addresses self-service (backend groups these with auth
  in `features/users`; there's no separate frontend "users" feature, so it
  lives here)
- Routes: `ROUTES.login`, `ROUTES.register`, `ROUTES.profile`

## Consumed endpoints
`POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` ·
`GET /users/me` · `PATCH /users/me` · `GET/POST/PATCH/DELETE /users/me/addresses`

## Backend contract notes (verified against features/users source, not just API_SPEC.md)
- `POST /auth/register` returns the created `User` directly — **no token pair**. The user must log
  in afterward; `useRegister` redirects to `ROUTES.login` with a toast rather than auto-authenticating.
- `POST /auth/login` returns `{ accessToken, user }` in the JSON body. `refreshToken` is **not** in
  the body — it's set as an httpOnly cookie, hence `apiClient` uses `withCredentials: true`.
- `role` on register is restricted to `CUSTOMER | VENDOR | DRIVER` — `ADMIN` accounts aren't
  self-registerable.
- `phone` must match `^(0|\+84)[0-9]{9,10}$`; `password` minimum 8 characters — both enforced
  client-side in `RegisterForm`'s zod schema to mirror the backend DTO.

## Public exports (via index.ts)
Pages: `LoginPage`, `RegisterPage`, `ProfilePage`
Hooks: `useLogin`, `useRegister`, `useLogout`, `useBootstrapAuth`, `useProfile`, `useUpdateProfile`,
`useAddresses`, `useAddAddress`, `useRemoveAddress`

## TODO
- `ProfilePage` is read-only (view profile + addresses); add edit-profile and add/remove-address forms.
- No "forgot password" flow yet — not in API_SPEC.md.
