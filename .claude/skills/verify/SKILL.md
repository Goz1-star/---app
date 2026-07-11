---
name: verify
summary: Runtime verification recipe for the Next.js workshop app
---

# Verify this app

Use this when validating source changes with a real running app.

1. Establish scope with `git diff HEAD --stat` for uncommitted work.
2. Run the app with `npm run dev` and wait for `http://localhost:3000`.
3. The app uses DB-backed sessions in Prisma. For local runtime checks, create short-lived sessions for the seeded users and send them as the `wmxz_session` cookie:
   - admin seed phone: `18800000001`
   - student seed phone: `18800000002`
4. Drive changed pages through HTTP requests or a browser:
   - admin pages with `Cookie: wmxz_session=<admin-token>`
   - student pages with `Cookie: wmxz_session=<student-token>`
5. For Server Action forms, fetch the rendered page, include the hidden `$ACTION_*` inputs from the target form, then POST `FormData` back to the same route.
6. Capture rendered HTML excerpts showing the changed UI/result. For GUI changes, a browser screenshot is preferred when available.

Useful routes for this project:

- `/admin/settings`
- `/admin/tasks`
- `/student/tasks`
