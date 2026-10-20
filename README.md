SAN CARLOS COLLEGE RECORD MANAGEMENT SYSTEM

## Provision the Ex-com account

Apply the Supabase migration in `supabase/migrations` before deploying the application. To send the Ex-com invitation, provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` through a trusted local or deployment secret store, then run:

```sh
npm run provision:ex-com
```

The script invites Edward Vincent D. Unson at `edward@scc.edu.ph` and creates an admin profile with position `EX_COM`, which grants department-independent access. The service-role key is privileged; do not commit it or expose it to the browser.
