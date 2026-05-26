import * as React from "react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"

const slides = ["bg-blue-500", "bg-orange-500", "bg-red-500", "bg-green-500"]

type DotStyle = React.CSSProperties & {
  "--dot-progress": string
}

const DOT_SIZE = 8
const DOT_ACTIVE_EXTRA = 12
const DOT_GAP = 6

function CarouselDots() {
  const { api } = useCarousel()
  const [snapCount, setSnapCount] = React.useState(0)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const dotNodes = React.useRef<HTMLButtonElement[]>([])
  const snapList = React.useRef<number[]>([])
  const lower = React.useRef(0)
  const progressCache = React.useRef<number[]>([])

  const renderDots = React.useCallback((progressValues: number[]) => {
    let x = 0

    progressValues.forEach((rawProgress, index) => {
      const progress = Math.max(0, Math.min(1, rawProgress))
      const width = DOT_SIZE + DOT_ACTIVE_EXTRA * progress
      const node = dotNodes.current[index]

      if (node) {
        node.style.setProperty("--dot-progress", String(progress))
        node.style.width = `${width}px`
        node.style.transform = `translate3d(${x}px, -50%, 0)`
      }

      progressCache.current[index] = progress
      x += width + DOT_GAP
    })
  }, [])

  const setupDots = React.useCallback(() => {
    if (!api) return

    snapList.current = api.scrollSnapList()
    dotNodes.current = []
    progressCache.current = Array(snapList.current.length).fill(0)
    setSnapCount(snapList.current.length)
  }, [api])

  const toggleDotBtnsActive = React.useCallback(() => {
    if (!api) return
    setSelectedIndex(api.selectedScrollSnap())
  }, [api])

  const onScroll = React.useCallback(() => {
    if (!api || snapList.current.length < 2) return

    const firstSnap = snapList.current[0]
    const lastSnap = snapList.current[snapList.current.length - 1]
    const progress = Math.max(
      firstSnap,
      Math.min(lastSnap, api.scrollProgress())
    )
    const lastLowerIndex = snapList.current.length - 2

    while (
      lower.current < lastLowerIndex &&
      progress > snapList.current[lower.current + 1]
    ) {
      lower.current++
    }

    while (lower.current > 0 && progress < snapList.current[lower.current]) {
      lower.current--
    }

    const upper = lower.current + 1
    const lowerSnap = snapList.current[lower.current]
    const upperSnap = snapList.current[upper]
    const t = (progress - lowerSnap) / (upperSnap - lowerSnap || 1)
    const progressValues = Array(snapList.current.length).fill(0)

    progressValues[lower.current] = 1 - t
    progressValues[upper] = t

    renderDots(progressValues)
  }, [api, renderDots])

  const onSettle = React.useCallback(() => {
    if (!api) return

    const selected = api.selectedScrollSnap()
    const progressValues = Array(snapList.current.length).fill(0)

    progressValues[selected] = 1
    setSelectedIndex(selected)
    renderDots(progressValues)

    lower.current = Math.min(selected, Math.max(snapList.current.length - 2, 0))
  }, [api, renderDots])

  React.useEffect(() => {
    if (!api) return

    let cancelled = false

    const syncDots = () => {
      if (cancelled) return

      setupDots()
      toggleDotBtnsActive()
      onSettle()
    }

    queueMicrotask(syncDots)

    api.on("reInit", setupDots)
    api.on("reInit", toggleDotBtnsActive)
    api.on("reInit", onSettle)
    api.on("select", toggleDotBtnsActive)
    api.on("scroll", onScroll)
    api.on("settle", onSettle)

    return () => {
      cancelled = true
      api.off("reInit", setupDots)
      api.off("reInit", toggleDotBtnsActive)
      api.off("reInit", onSettle)
      api.off("select", toggleDotBtnsActive)
      api.off("scroll", onScroll)
      api.off("settle", onSettle)
    }
  }, [api, onScroll, onSettle, setupDots, toggleDotBtnsActive])

  React.useEffect(() => {
    if (!api || snapCount === 0) return

    const frame = requestAnimationFrame(onSettle)

    return () => cancelAnimationFrame(frame)
  }, [api, onSettle, snapCount])

  if (snapCount === 0) return null

  const trackWidth =
    snapCount * DOT_SIZE + DOT_ACTIVE_EXTRA + (snapCount - 1) * DOT_GAP

  return (
    <div
      className="relative mx-auto mt-6 h-5"
      aria-label="Slide controls"
      style={{ width: trackWidth }}
    >
      {Array.from({ length: snapCount }).map((_, index) => {
        const progress = selectedIndex === index ? 1 : 0
        const width = DOT_SIZE + DOT_ACTIVE_EXTRA * progress
        const x =
          index * (DOT_SIZE + DOT_GAP) +
          (index > selectedIndex ? DOT_ACTIVE_EXTRA : 0)

        return (
          <button
            key={index}
            ref={(node) => {
              if (node) dotNodes.current[index] = node
            }}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={selectedIndex === index ? "true" : undefined}
            onClick={() => api?.scrollTo(index)}
            className="absolute top-1/2 left-0 h-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={
              {
                "--dot-progress": String(progress),
                width,
                transform: `translate3d(${x}px, -50%, 0)`,
                backgroundColor:
                  "color-mix(in srgb, var(--primary) calc(var(--dot-progress, 0) * 100%), var(--muted-foreground))",
              } as DotStyle
            }
          />
        )
      })}
    </div>
  )
}

export function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="w-full max-w-4xl">
        <Carousel opts={{ align: "start" }} className="mx-auto max-w-2xl">
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`aspect-video bg-linear-to-r ${slide}`} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots />
        </Carousel>
      </section>
    </main>
  )
}

export default App
