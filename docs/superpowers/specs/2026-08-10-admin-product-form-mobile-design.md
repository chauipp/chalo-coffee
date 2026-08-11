# Admin Product Edit Form: Mobile Layout Design

## Problem

The product edit form is technically functional on a phone, but its long flat sequence of fields makes the editing task feel dense and hard to scan. The screenshot also shows weak grouping, an unclear image-upload area, and actions that compete with the form content.

## Goal

Make the product edit form easy to scan and operate at a 390px phone width while preserving the existing desktop experience, validation, mutations, image upload, and draft recovery behavior.

## Chosen direction: A - grouped sections

The mobile form uses a bottom-sheet modal with a scrollable content region and five visually distinct sections:

1. **Thông tin món** — product name on a full row, then category and status side by side.
2. **Giá & vận hành** — price and preparation time side by side.
3. **Mô tả** — description textarea with its existing wait-time hint.
4. **Hình ảnh** — image preview plus one clear URL/upload area.
5. **Hiển thị** — active/inactive toggle as a simple full-width setting row.

The action footer stays visible at the bottom of the modal. “Cập nhật” is the primary action and “Hủy” is secondary. Both controls have at least a 44px touch target.

### Responsive behavior

- Mobile (`< md`): section cards, single-column flow, two-column pairs only where labels remain readable, sticky action footer, safe-area bottom padding, and an independently scrollable modal body.
- Desktop (`>= md`): keep the existing dialog presentation and two-column form grid. The new section wrappers may remain visually light so the desktop form does not become unnecessarily card-heavy.
- The modal body must never allow the fixed admin bottom navigation to cover the action footer.

## Component and state boundaries

- `ProductForm` remains the owner of form registration, validation, upload state, draft synchronization, and submit/cancel callbacks.
- The layout change is presentation-only: existing field names, schema values, callbacks, and mutation payloads remain unchanged.
- `Modal` continues to own focus restoration, Escape handling, body scroll locking, backdrop close, and portal rendering. The product editor uses its existing modal invocation; mobile-specific sizing/spacing is provided through the modal's current bottom-sheet behavior and form classes.
- `useProductDraft` remains the source of truth for restoring in-progress edits. Reordering fields must not change its `useWatch`/flush lifecycle.

## Accessibility and interaction details

- Preserve the existing labels and error messages associated with every input.
- Keep keyboard focus behavior supplied by `Modal`; the first meaningful form control remains reachable after opening.
- Use semantic headings for each section and maintain a logical DOM order matching the visual order.
- Keep upload as a real file input behind a labelled control; display upload progress and errors without shifting the primary action out of reach.
- Ensure validation errors can expand a section without clipping or trapping the footer.

## Testing strategy

1. Add/extend component-level assertions for the section headings, mobile field order, and action labels.
2. Add a 390px Playwright scenario that opens the product editor, verifies the grouped sections and footer geometry, edits a value, reloads, and confirms the draft is restored.
3. Keep the existing desktop regression check: the product edit dialog still renders all fields and submits through the same callbacks.
4. Run unit tests, TypeScript, production build, and the targeted mobile E2E suite.

## Acceptance criteria

- At 390px, the form is readable without horizontal scrolling and each field is visibly associated with its section.
- The primary action is visually dominant and remains reachable above the fixed mobile navigation.
- Image preview, URL entry, and upload affordance read as one coherent control group.
- Existing product edits, validation, uploads, submit/cancel behavior, route restoration, filters, and drafts continue to work.
- Desktop layout and behavior remain compatible with the current admin UI.
