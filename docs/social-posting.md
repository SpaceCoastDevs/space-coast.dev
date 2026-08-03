# Weekly social posts

The weekly events announcement workflow posts to each platform whose GitHub Actions secrets are configured. It skips unconfigured platforms without failing the Discord announcement.

| Platform | Required secrets                                 |
| -------- | ------------------------------------------------ |
| Facebook | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` |
| Bluesky  | `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`         |
| X        | `X_USER_ACCESS_TOKEN`                            |

Use a Facebook Page access token that can publish posts to the Space Coast Devs Page. Create a dedicated Bluesky app password for `space-coast.dev`; do not use the account's primary password. The X token must be a user-context token authorized to create posts (`tweet.write`).

The workflow runs when a new weekly events MDX post is added to `main`, or manually through **Actions → Announce Weekly Events Post** by supplying its date. A manual re-run posts again to every configured platform.
