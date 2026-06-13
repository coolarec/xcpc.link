import { ref, computed, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { SiteLink } from '../types/home'

interface VisualItem {
  item: SiteLink
  key: string
  baseIndex: number
  col: number
  row: number
  color: string
}

export function useWatchDrag(
  rootRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
  links: Ref<SiteLink[]>
) {
  const columnCount = ref(8)
  const rowCount = ref(8)
  const isUIHidden = ref(false)

  // Math utils
  const clamp = (min: number, max: number, value: number): number => Math.min(max, Math.max(min, value))
  const wrap = (value: number, cycle: number): number => ((value % cycle) + cycle) % cycle

  const maxIconScale = 2.15
  const minIconGap = 2
  const palette = ['#007aff', '#34c759', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff']

  let stepX = 78
  let stepY = 68
  let iconSizePx = 54
  let cachedIcons: HTMLElement[] = []
  let offsetX = 0
  let offsetY = 0
  let startX = 0
  let startY = 0
  let startOffsetX = 0
  let startOffsetY = 0
  let lastX = 0
  let lastY = 0
  let lastTime = 0
  let velocityX = 0
  let velocityY = 0
  let isDragging = false
  let suppressClick = false
  let renderFrame = 0
  let inertiaFrame = 0
  let uiTimer = 0
  let resizeObserver: ResizeObserver | undefined

  const isMobileWatch = () =>
    window.matchMedia('(max-width: 720px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches
  let isMobileCached = false

  const visualItems = computed<VisualItem[]>(() => {
    const source = links.value
    if (!source.length) return []

    const assignedIndices: number[][] = Array.from({ length: rowCount.value }, () =>
      Array.from({ length: columnCount.value }, () => 0),
    )

    const neighborOffsets = [
      [0, -1], [-1, -1], [1, -1], [-1, 0], [-2, 0], [0, -2],
      [-1, -2], [1, -2], [2, -2], [-2, -1], [2, -1],
    ] as const

    return Array.from({ length: rowCount.value }).flatMap((_, row) =>
      Array.from({ length: columnCount.value }).map((__, col) => {
        const preferredIndex = wrap(col * 11 + row * 17 + Math.floor(row / 2) * 5, source.length)
        const blocked = new Set<number>()

        for (const [deltaCol, deltaRow] of neighborOffsets) {
          const targetRow = row + deltaRow
          const targetCol = col + deltaCol
          if (targetRow < 0 || targetCol < 0 || targetCol >= columnCount.value) continue
          blocked.add(assignedIndices[targetRow][targetCol])
        }

        let baseIndex = preferredIndex
        for (let step = 0; step < source.length * 2; step += 1) {
          const candidate = wrap(preferredIndex + step * 3, source.length)
          if (!blocked.has(candidate)) {
            baseIndex = candidate
            break
          }
        }

        assignedIndices[row][col] = baseIndex
        const item = source[baseIndex]

        return {
          item,
          key: `${item.websiteTitle}-${row}-${col}`,
          baseIndex,
          col,
          row,
          color: palette[baseIndex % palette.length],
        }
      })
    )
  })

  const getCycles = () => ({
    width: Math.max(1, columnCount.value * stepX),
    height: Math.max(1, rowCount.value * stepY),
  })

  const normalizeOffsets = () => {
    const cycles = getCycles()
    offsetX = wrap(offsetX, cycles.width)
    offsetY = wrap(offsetY, cycles.height)
  }

  const measure = () => {
    const width = stageRef.value?.clientWidth || rootRef.value?.clientWidth || 600
    const height = stageRef.value?.clientHeight || rootRef.value?.clientHeight || 480
    isMobileCached = isMobileWatch()

    iconSizePx = isMobileCached ? clamp(36, 46, width / 6.2) : clamp(40, 54, width / 8.8)
    const safeDiameter = iconSizePx * maxIconScale + (isMobileCached ? 2 : minIconGap)

    stepX = safeDiameter
    stepY = safeDiameter * (Math.sqrt(3) / 2)
    
    let cols = isMobileCached ? Math.max(8, Math.ceil(width / stepX) + 2) : Math.max(10, Math.ceil(width / stepX) + 2)
    if (cols % 2 !== 0) cols++
    columnCount.value = cols

    let rows = isMobileCached ? Math.max(8, Math.ceil(height / stepY) + 2) : Math.max(10, Math.ceil(height / stepY) + 2)
    if (rows % 2 !== 0) rows++
    rowCount.value = rows
    
    rootRef.value?.style.setProperty('--watch-icon-size', `${iconSizePx.toFixed(2)}px`)
  }

  const refreshIconCache = () => {
    cachedIcons = rootRef.value ? [...rootRef.value.querySelectorAll<HTMLElement>('.watch-icon')] : []
  }

  const render = () => {
    renderFrame = 0
    if (!rootRef.value || !links.value.length) return

    normalizeOffsets()
    const icons: HTMLElement[] = cachedIcons.length
      ? cachedIcons
      : [...rootRef.value.querySelectorAll<HTMLElement>('.watch-icon')]
    const cycles = getCycles()

    icons.forEach((node) => {
      const col = Number(node.dataset.col || 0)
      const row = Number(node.dataset.row || 0)
      const rowOffset = row % 2 ? stepX * 0.5 : 0
      const rawX = col * stepX + rowOffset - offsetX - cycles.width / 2
      const rawY = row * stepY - offsetY - cycles.height / 2
      const x = wrap(rawX + cycles.width / 2, cycles.width) - cycles.width / 2
      const y = wrap(rawY + cycles.height / 2, cycles.height) - cycles.height / 2
      const distance = Math.hypot(x, y)
      
      const normalizedDist = distance / (stepX * 2.2)
      const distortion = 1 + Math.pow(normalizedDist, 2) * 0.18
      const renderX = x * distortion
      const renderY = y * distortion

      const bellCurve = Math.exp(-Math.pow(distance / (stepX * 2.3), 2))
      const scale = isMobileCached
        ? clamp(0.1, 2.05, 2.05 * bellCurve)
        : clamp(0.1, maxIconScale, maxIconScale * bellCurve)
      
      const opacityNum = isMobileCached
        ? clamp(0, 0.9, 1.1 - distance / (stepX * 3.4))
        : clamp(0, 0.92, 1.15 - distance / (stepX * 3.8))

      const opacityStr = opacityNum.toFixed(3)
      const zIndexStr = `${100 + Math.round(scale * 100)}`

      node.style.transform = `translate(${renderX.toFixed(2)}px, ${renderY.toFixed(2)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`
      
      if (node.style.opacity !== opacityStr) node.style.opacity = opacityStr
      if (node.style.zIndex !== zIndexStr) node.style.zIndex = zIndexStr
    })
  }

  const scheduleRender = () => {
    if (renderFrame) return
    renderFrame = requestAnimationFrame(render)
  }

  const stopInertia = () => {
    if (!inertiaFrame) return
    cancelAnimationFrame(inertiaFrame)
    inertiaFrame = 0
  }

  const glide = () => {
    offsetX += velocityX * 16
    offsetY += velocityY * 16
    velocityX *= 0.92
    velocityY *= 0.92
    render()

    if (Math.hypot(velocityX, velocityY) > 0.018) {
      inertiaFrame = requestAnimationFrame(glide)
      return
    }

    inertiaFrame = 0
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging) return

    const now = performance.now()
    const elapsed = Math.max(16, now - lastTime)
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    const deltaX = event.clientX - lastX
    const deltaY = event.clientY - lastY

    if (Math.hypot(dx, dy) > 5) {
      suppressClick = true
      isUIHidden.value = true
    }

    offsetX = startOffsetX - dx
    offsetY = startOffsetY - dy
    velocityX = -deltaX / elapsed
    velocityY = -deltaY / elapsed
    lastX = event.clientX
    lastY = event.clientY
    lastTime = now
    scheduleRender()
  }

  const handlePointerUp = () => {
    isDragging = false
    rootRef.value?.classList.remove('is-dragging')
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)

    if (uiTimer) window.clearTimeout(uiTimer)
    uiTimer = window.setTimeout(() => {
      isUIHidden.value = false
    }, 1200)

    if (Math.hypot(velocityX, velocityY) > 0.018) {
      if (isMobileWatch()) {
        velocityX = 0
        velocityY = 0
        return
      }
      stopInertia()
      inertiaFrame = requestAnimationFrame(glide)
    }

    if (suppressClick) {
      window.setTimeout(() => {
        suppressClick = false
      }, 150)
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button && event.button !== 0) return

    const target = event.target as HTMLElement
    if (target.closest('.link-content')) return

    stopInertia()
    isDragging = true
    suppressClick = false
    if (uiTimer) {
      window.clearTimeout(uiTimer)
      uiTimer = 0
    }
    
    startX = event.clientX
    startY = event.clientY
    startOffsetX = offsetX
    startOffsetY = offsetY
    lastX = event.clientX
    lastY = event.clientY
    lastTime = performance.now()
    velocityX = 0
    velocityY = 0
    
    rootRef.value?.classList.add('is-dragging')
    
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const handleIconClick = (event: MouseEvent) => {
    if (!suppressClick) return
    event.preventDefault()
    event.stopPropagation()
  }

  const getIsDragging = () => isDragging

  onMounted(() => {
    if (!rootRef.value) return
    measure()
    nextTick(() => {
      refreshIconCache()
      render()
    })

    resizeObserver = new ResizeObserver(() => {
      measure()
      nextTick(() => {
        refreshIconCache()
        scheduleRender()
      })
    })
    resizeObserver.observe(rootRef.value)
  })

  onBeforeUnmount(() => {
    if (renderFrame) cancelAnimationFrame(renderFrame)
    stopInertia()
    resizeObserver?.disconnect()
  })

  return {
    visualItems,
    isUIHidden,
    handlePointerDown,
    handleIconClick,
    getIsDragging,
    isMobileWatch,
    measure,
    refreshIconCache,
    scheduleRender
  }
}
