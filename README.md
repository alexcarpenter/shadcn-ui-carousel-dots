# shadcn/ui Carousel Dot Indicators

An example shadcn/ui carousel built on [Embla Carousel](https://www.embla-carousel.com/) with smooth scroll-progress dot indicators.

This implementation is based on the technique from [Smooth Dot Indicators with Embla Carousel and CSS color-mix()](https://alexcarpenter.me/notes/2026-03-06-1).

## Implementation

The carousel uses the shadcn/ui `Carousel` component, which exposes the underlying Embla API through `useCarousel()`.

The custom `CarouselDots` component listens to Embla events:

- `scroll` updates dot progress while dragging or animating.
- `settle` snaps the selected dot to fully active.
- `select` updates accessibility state.
- `reInit` rebuilds the snap list if Embla recalculates.

Each dot receives a `--dot-progress` CSS custom property between `0` and `1`.

That value drives:

- Dot width expansion.
- Dot color interpolation with `color-mix()`.

```tsx
node.style.setProperty("--dot-progress", String(progress))
```

```css
width: calc(var(--spacing) * 2 + var(--spacing) * 3 * var(--dot-progress));
background-color: color-mix(
  in srgb,
  var(--primary) calc(var(--dot-progress) * 100%),
  var(--muted-foreground)
);
```

## Running locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```
