---
tags: [frontend, accessibility]
max_turns: 80
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add an account dropdown to components/site-header.tsx that opens from the avatar, with Profile, Billing, Settings and Sign out. Sign out should call the signOut server action in app/actions.ts. We don't use a component library.
