# Project Overview

Static HTML website for a land and vegetation management services company. Each service has its own directory containing an `index.html` page. There is no build toolchain — pages are plain HTML served directly by `static-web-server`.

## Structure

- `index.html` — home page
- `<service-name>/index.html` — one page per service (20 pages total)
- `style.css`, `script.js` — shared styles and scripts
- `scripts/` — maintenance and validation scripts
- `about/`, `contact/`, `service-area/` — non-service pages

## Pre-publish Breadcrumb Check

Before every publish, Replit automatically runs:

```
node scripts/check-breadcrumbs.js
```

This is configured as the deployment `build` command in `.replit` (`[deployment] build = ["node", "scripts/check-breadcrumbs.js"]`). The script checks that every service page's breadcrumb last segment matches both the page `<title>` and `<h1>`. If any mismatch is found, it prints the offending file(s) and exits with a non-zero code, **blocking the publish**. Fix the mismatch in the page's HTML, then publish again.

To run the check manually at any time:

```
node scripts/check-breadcrumbs.js
```

## User Preferences

- No emojis in code or documentation unless explicitly requested.
