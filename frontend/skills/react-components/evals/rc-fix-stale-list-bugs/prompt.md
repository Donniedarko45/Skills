---
tags: [frontend, react-components]
max_turns: 80
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Two bugs in components/order-list.tsx on the /orders page: when a new order comes in (the 'Simulate new order' button) it doesn't show up until I change the status filter, and after I delete an order the details panel on the right sometimes shows a different order than the one I selected. Can you fix these properly? Deleting is local-only for now, that's fine.
