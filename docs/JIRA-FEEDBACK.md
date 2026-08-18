# In-app bug reports → Jira

The floating bug button (`src/components/FeedbackReporter.jsx`) mirrors every report
into a Jira Cloud project. The local `feedback_reports` row stays the source of
truth; Jira is a mirror, and every step fails soft — if Jira is down, misconfigured,
or simply not set up, the report is still saved and the user still sees "Report sent".

## What lands in Jira

| Issue field | Source |
|---|---|
| Summary | `[<path>] <first line of the user's description>` |
| Labels | `vietnamy`, `in-app-report`, `kind-<bug\|feedback\|feature>`, `severity-<low\|med\|high>`, `page-<first path segment>` |
| Description | Where it happened (path, full URL, viewport, what opened the reporter, focused element) · What the user reported · Reporter (name/email/user id/UI language) · Environment (app version, user agent, screen, timezone, online, report id) · Recent console output |
| Attachment | JPEG screenshot of the screen, when capture and storage both succeed |

The `page-*` label is the quick filter — `labels = "page-lesson"` gives every report
filed from a lesson screen.

## One-time setup

1. **Create the project.** In Jira, create a project named **`vnmy-user`**. Jira project
   *keys* must be uppercase alphanumerics, so `vnmy-user` cannot itself be the key —
   use `VNMYUSER` (or anything else, and set `JIRA_PROJECT_KEY` to match).
2. **Create an API token** at
   <https://id.atlassian.com/manage-profile/security/api-tokens>.
3. **Set the environment variables** (see `.env.example`):

   ```sh
   JIRA_BASE_URL=https://your-site.atlassian.net
   JIRA_EMAIL=you@your-domain.com
   JIRA_API_TOKEN=...
   JIRA_PROJECT_KEY=VNMYUSER
   JIRA_ISSUE_TYPE=Bug        # must exist in that project's issue type scheme
   ```

   Leaving `JIRA_BASE_URL` blank disables the mirror.

4. **Preflight the config** — this checks your credentials, lists every project key
   the account can see (so the key is never a guess), and confirms `JIRA_ISSUE_TYPE`
   exists in that project's scheme:

   ```sh
   npm run feedback:verify-jira            # read-only checks
   npm run feedback:verify-jira -- --create  # also files a real test issue + attachment
   ```

   The `--create` run exercises the attachment endpoint too, so a missing permission
   shows up here rather than the first time a user files a report with a screenshot.

5. **Verify end to end** by filing a report from the app. The confirmation reads
   "Report sent — tracked as VNMYUSER-1." when the mirror worked. If it just says
   "Report sent.", check the server log for `[feedback] Jira issue creation failed`.

## Screenshots

There is no browser API that returns the real rendered pixels without a permission
prompt — `getDisplayMedia` is unsupported on iOS Safari, the primary target — so
`src/lib/screenshot.js` rasterises the live DOM with `html2canvas` instead.

- Capture starts when the bug button is pressed and runs in the background, so the
  modal opens instantly. The reporter's own chrome is excluded from the raster, so
  the shot shows the screen the user was actually looking at.
- The image is uploaded only on submit, so abandoned drafts cost nothing. It goes to
  `R2_FEEDBACK_BUCKET` via `POST /api/feedback-screenshot`; the server then reads it
  back over a **signed** request to attach it to the issue, so the bucket does not
  need to be public.
- `html2canvas` cannot parse `color-mix()` or `backdrop-filter`, so a few surfaces
  render flat. Layout, text, and on-screen state all survive, which is what triage
  needs. The 200 KB library is dynamically imported and never loads unless someone
  opens a report.
- Set `VITE_FEEDBACK_SCREENSHOT_ENABLED=false` to turn capture off without a code
  change. Reports then carry page details only.

If R2 is not configured the upload returns 503, the client sends the report without a
screenshot, and the issue still gets the full description.
