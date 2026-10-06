# 13. MUI for components, CSS Modules for layout

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The frontend started with CSS Modules only, which was enough for the map layout. The remaining screens are mostly controls and forms:

- mode buttons on the map toolbar;
- the plot registration form, whose fields must show the API's per-field `400` errors;
- the plot details panel;
- the search panel with price and area filters;
- login and sign-up;
- feedback for `409` and `422` responses.

Building these by hand means writing focus handling, labels, keyboard support and error states for each one.

## Decision

- Use **Material UI** (`@mui/material` 9, with Emotion and `@mui/icons-material`) for interactive components and typography: buttons, toggle groups, text fields, alerts, the app bar.
- Keep **CSS Modules** for page layout: the flex structure of the page, the map container that OpenLayers renders into, and the floating toolbar position. Layout stays in plain CSS that does not depend on the component library.
- One theme in `app/theme.ts`: the primary colour matches the plot polygons on the map, and the font stays the system font. `ThemeProvider` and `CssBaseline` are mounted in `app/providers.tsx`.
- Components are imported by path (`@mui/material/Button`) to keep imports explicit and builds fast.

## Alternatives considered

- **CSS Modules only:** no new dependency, but every form control, its accessible label and its error state would be hand-written.
- **A headless library (Radix, Headless UI):** accessible behaviour without styles, so the styling work stays.
- **Tailwind:** fast to style, but provides no components or accessible behaviour.

## Consequences

- `TextField` exposes `error` and `helperText`, so the `errors[]` list of a `ProblemDetail` maps to fields directly (registration form, login).
- The bundle grows by about 80 KB gzip. Acceptable for this app. The map library is already the largest dependency, and code splitting can come later.
- Two styling mechanisms coexist. The rule above (components vs layout) decides which one a change uses.
- Components are tested through their accessible roles with Testing Library, the same way as the rest of the UI.
