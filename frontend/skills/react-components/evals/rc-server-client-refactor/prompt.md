---
tags: [frontend, react-components]
max_turns: 80
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

app/products/[id]/page.tsx is a mess. The whole page is a client component that fetches its own data from our API route in a useEffect, and it ships way too much JavaScript. Can you refactor it the way it should be done with the App Router? The image gallery and add to cart have to keep working.
