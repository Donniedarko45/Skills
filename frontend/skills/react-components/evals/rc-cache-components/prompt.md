---
tags: [frontend, react-components]
max_turns: 80
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Our /products page queries the database on every single request and it's getting slow. Can you cache it? When someone edits a product in /admin the change has to show up right away, for them and for everyone else.
