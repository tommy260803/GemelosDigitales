---
name: anthropic-code-auditor
description: >-
  Use this skill when performing deep codebase audits, verifying UI/UX consistency,
  hunting subtle bugs in full-stack web systems, or reviewing TypeScript/Python contracts.
---

# Anthropic Code Auditor Skill

This skill enforces strict, thorough code auditing standards inspired by Anthropic engineering best practices.

## Audit Workflow

1. **Defensive API Ingestion**:
   - Never assume backend response objects have all fields populated.
   - Use optional chaining (`?.`) and explicit fallback operators (`?? 'N/A'`).
   - Guard against empty responses (e.g. `{} as Interface` patterns in React state).

2. **Resource & Memory Management**:
   - Check for singleton reuse of heavy clients (e.g. LangChain models, database pools, Redis connections).
   - In chat or multi-turn interfaces, bound conversation history to prevent unbounded token growth and latency.

3. **UI/UX & Design Consistency**:
   - Avoid hardcoded color palettes that break dark/light mode toggles.
   - Ensure interactive inputs (selects, buttons, sliders) adapt properly across themes.
   - Maintain 100% linguistic consistency across views (labels, units, card metrics).
   - Verify responsiveness on mobile screen viewports ($< 1024$px).

4. **Deterministic Validation**:
   - Every bug fix must be accompanied by non-regression verification:
     - Frontend: `npx tsc --noEmit`
     - Backend: `pytest backend/tests/ -v`
