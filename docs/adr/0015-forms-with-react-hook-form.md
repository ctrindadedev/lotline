# 15. Forms with react-hook-form, validated by a plain function

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The frontend started with plain controlled forms. The plot registration form showed what that costs once the API is involved:

- the API's `400` errors must appear on their fields, and each must disappear once the user edits that field;
- the typed values must survive a redraw: the form unmounts while the user draws again after a `409`;
- client validation must match the API rules (`CreatePlotRequest`).

Hand-written, each of these needed custom state: which fields were edited since the last response, and values lifted to the page hook. Login and sign-up (#27) will need the same behaviour.

## Decision

- Use **react-hook-form** for forms. `useForm` lives in the feature hook (`usePlotRegistration`), not in the form component, so values survive while the form is unmounted.
- Validation stays a **pure function** (`validatePlotForm`), plugged in through a small custom resolver. No schema library: one function mirrors the API's rules and is tested case by case.
- The API's field errors are applied with `setError(field, { type: 'server' })`. React-hook-form clears each one when its field passes validation again, after the user edits it.
- MUI `TextField`s are bound with `Controller`. The form component only renders; it receives the form and an alert message.
- Side effects of a save (reset the form, leave the editing mode, show the notice) are callbacks on the mutation (`useMutation({ onSuccess })`), not on `mutate()`. Callbacks on `mutate()` are dropped if the mutation is reset or the component unmounts.

## Alternatives considered

- **Plain controlled forms:** no dependency, but the server-error and unmount behaviour above had to be rebuilt by hand in every form.
- **react-hook-form with zod:** a schema gives types and validation in one place, but adds a second dependency for three fields. The pure function is enough and is already tested.
- **Formik:** similar features, re-renders the whole form on every keystroke and is less active.

## Consequences

- One new dependency (about 10 KB gzip).
- Forms follow one pattern: `useForm` in the feature hook, a resolver over a pure validation function, `setError` for the API's errors, `Controller` for MUI fields.
- The page hook (`useMapPage`) only composes feature hooks (`usePlotRegistration`, and later the search and details hooks), so it does not grow with each feature.
