---
name: code-review-git
description: Rules for rigorous code review, ESLint/TypeScript compliance, preventing infinite React re-renders, and enforcing unified Conventional Git Commits. Load this skill when performing clean refactoring, fixing type-casting warnings, or planning commit flows.
---

# Code Review & Git Commit Standard Skill (SKILL.md)

This skill provides guidelines and strict regulations for performing code reviews, preventing TypeScript compilation errors, preventing infinite re-render loops in React, and formatting standardized Git commits. 

---

## 1. Static Analysis & Type Safety Safeguards (Anti-Crash Rules)

Every code check or edit MUST adhere to these strict TypeScript constraints to keep builds green:

### A. Strict Casts & Argument Mismatches
When invoking mathematical or formatting functions (such as monetary formatter `formatCurrency(val)`), never pass raw `unknown` or `string` fields.
- **Incorrect:** `formatCurrency(sum)` where `sum` is of type `unknown` or union.
- **Correct (Safe Cast):** `formatCurrency(sum as number)` or `formatCurrency(Number(sum))`.

### B. Prevention of Infinite React Re-renders
- NEVER trigger state updates directly in the body of a React functional component.
- Keep dependency arrays of `useEffect` or `useMemo` strictly populated with primitive values (strings, numbers, booleans) instead of complex objects or inline-defined arrow functions.

### C. Import Formatting & Ordering
- Place all `import` declarations sequentially at the absolute top of the file.
- Use explicit named imports. Don't use object destructuring on default imports.
- Do NOT use `import type` if the imported entity contains runtime elements like standard `enum` declarations.

---

## 2. Comprehensive Code Review Guidelines

Always evaluate proposed changes against the following quality checklist:

| Quality Pillar | Expected Standards | Failure Triggers |
| :--- | :--- | :--- |
| **Type Safety** | Clean compilation under `tsc --noEmit` without any generic `as any` casts. | Unhandled `unknown` or implicit `any` parameter types. |
| **Aesthetic Craft** | Custom typography sizing, responsive grid cards, and native visual cues. | Cookie-cutter interfaces decorated with distracting metrics log lines. |
| **Accessibility** | Legible background contrast, and 44px+ touch targets on touch overlays. | Hardcoded viewport calculations or squished elements. |
| **RTL Formatting** | Correct use of logical properties (e.g. `pe-*`, `ps-*`, `space-x-reverse`) for native Arabic Right-to-Left alignment. | Use of fixed directional directions (e.g. `pl-*`, `pr-*`, `left-*`) that break layout direction. |
| **Currency Handling** | Dynamic display of currency code/name retrieved from the settings database. | Hardcoded Omani Rial ("ر.ع." or "OMR") currency symbols in UI component markup. |

---

## 3. Conventional Git Commit Standard (Unified Structure)

All work and logs must support both Arabic and English developers, following the **Conventional Commits 1.0.0** specification.

### Commit Format Template:
```text
<type>(<scope>): <short description in English> | <الوصف باللغة العربية>

[Optional body: detailed architectural changes]
```

### Commit Types:
- **feat**: Introducing a brand new capability (e.g. `feat(reports): add real-time inventory ledger and safety thresholds UI`).
- **fix**: Correcting a bugs/lint issues (e.g. `fix(reports): cast unknown summation types as numbers to satisfy compiler`).
- **refactor**: Rewriting code without altering user behavior (e.g. `refactor(header): optimize alert dispatch to reduce state complexity`).
- **docs**: Updating instruction files, readmes or skills (e.g. `docs(skills): establish code review and git standards`).

### Example Commit Log:
`feat(header): add live audit alert popover and simulator | إضافة منبثق التنبيهات الفورية ومحاكاة عمليات التدقيق`
