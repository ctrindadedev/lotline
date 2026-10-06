# 16. Interface in Brazilian Portuguese, code and docs in English

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The project's language rule is that all source code (names of variables, classes and methods), commit messages, comments and documentation are written in English. Lotline is a marketplace for land in Brazil: its users read Portuguese, write prices with a decimal comma and expect `R$ 150.000,00`.

The API stays in English, including its error messages (`spring.mvc.locale: en`, ADR 0006). The interface showed some of them as they came, such as the reason for a `422`.

## Decision

- The text the user reads is in Brazilian Portuguese. All of it lives in one catalog, `src/shared/i18n/messages.ts`: keys in English, values in Portuguese, and small functions for counts and interpolation (`count(3)`, `listedOn(date)`). Components and helpers read from the catalog and hold no user-facing text, accessible names (`aria-label`) included.
- Numbers, prices, areas, distances and dates are formatted with `Intl` in `pt-BR`, in `src/shared/i18n/format.ts`. MUI uses its `ptBR` locale and the page declares `lang="pt-BR"`.
- The API's own messages never appear inside a Portuguese sentence. The interface picks the Portuguese text from the response status and the field (`409` → overlap, `422` → invalid drawing, `400` → the field's own message), and shows the API's wording only as a "technical detail" line where it helps (the reason for a `422`).
- Tests assert against the catalog (`messages.toolbar.listPlot`), not against Portuguese literals, so Portuguese stays in one file.

## Alternatives considered

- **An i18n library (react-intl, i18next):** message files, plural rules and runtime locale switching for an app with one language. A typed object gives autocompletion and compile-time checks for every key.
- **Portuguese strings written inline in components:** quicker, but spreads non-English text through the source code.
- **Translating the API's messages:** the API is consumed in English by any client; the interface already knows which message to show from the status and the field.

## Consequences

- Adding a language later means turning the catalog into one object per locale; no component changes.
- Inputs accept a decimal comma. Values with a thousands separator ("200.000") are rejected with a message instead of being misread.
- Server wording that is not covered (a new `400` on another field) is shown under a generic Portuguese message, as a technical detail.
