SAN CARLOS COLLEGE RECORD MANAGEMENT SYSTEM

## Provision the Executive Committee admin

Apply the Supabase migration in `supabase/migrations` before deploying the application. To send the Ex-com invitation, provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` through a trusted local or deployment secret store, then run:

```sh
npm run provision:ex-com
```

Create the `EXECUTIVE COMMITTEE` department before provisioning. An account receives system-wide access only when its profile has the admin role and is assigned to that department; the user's position does not grant this access. The script invites Edward Vincent D. Unson at `edward@scc.edu.ph` and assigns the profile to the Executive Committee department. The service-role key is privileged; do not commit it or expose it to the browser.
