# 14. Map interaction modes as an explicit state machine

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The map does three things with the mouse: explore (pan and zoom), draw a plot polygon, and draw a search circle. OpenLayers lets any number of interactions be active together. Two draw interactions at once would capture the same clicks and produce two shapes. After a polygon is closed, the map keeps it while the user fills in the registration form, and a rejected registration must keep it too.

## Decision

- The modes are a closed set: `idle`, `drawingPlot`, `drawingSearch` and `editingPlot`. The state is a discriminated union, so `editingPlot` carries the drawn boundary and no other mode can.
- A pure function `nextInteractionState(state, event)` reads the next mode from a transition table. An event the current mode does not handle returns the same state.
- React holds the state with `useReducer(nextInteractionState, { mode: 'idle' })`. The page reads it through its orchestrating hook (`useMapPage`).
- The mode decides the draw shape (`Polygon`, `Circle` or none). A single hook, `useDrawInteraction`, keeps at most one `Draw` interaction on the map: when the shape changes, it removes the old interaction before adding the new one.
- The toolbar is an exclusive toggle group. Pressing the active mode again cancels back to `idle`. While a drawn plot is edited, the button stays pressed as "Editing plot" and ignores clicks, so a stray click cannot discard the drawing and the typed values; the form has explicit Redraw and Cancel buttons.

## Alternatives considered

- **Booleans per mode (`isDrawingPlot`, `isDrawingSearch`):** they allow impossible combinations, and every handler must reset the others.
- **A state machine library (XState):** visual tooling and guards, more than a four-state table needs.
- **Letting each feature add its own OpenLayers interaction:** nothing guarantees that only one draw is active.

## Consequences

- Every transition is unit-tested as a table (mode × event), without a map or a browser.
- New modes extend the table and the `switch`es over the mode. TypeScript flags any `switch` that misses a case.
- Switching modes in the middle of a drawing discards the unfinished sketch, because its interaction is removed.
- The drawn boundary leaves the state machine only through `cancel`, a redraw, a mode switch or a successful save. A `409` or `422` keeps it on the map.
