# FIT30 Browser/Auth gate

The production database Practical RLS Gate passed with two confirmed test users.
The application email flow still needs a separate browser test on a Vercel Preview
deployment using a reachable mailbox. Do not merge the preview branch before
signup, confirmation, refresh, logout, login, and password recovery pass.

Supabase Security Advisor currently reports `Leaked Password Protection Disabled`.
If the project has a Pro or higher plan, enable leaked password protection in
Auth password settings. If the setting is unavailable on the current plan,
record the warning separately. This warning is not a database RLS failure.

For Preview, add only the exact `https://<preview-domain>/auth/callback` to
Supabase Redirect URLs. Keep the production Site URL at `https://vieww.ru`.
