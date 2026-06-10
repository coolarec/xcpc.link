<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const footerBar = ref(null)
const footerPath = ref(null)

const footerDownPath = 'M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z'
const footerCenterPath = 'M0-0.3C0-0.3,464,0,1139,0S2278-0.3,2278-0.3V683H0V-0.3z'

let context

onMounted(async () => {
  await nextTick()

  const footer = footerBar.value
  const footerShape = footerPath.value

  if (!footer || !footerShape) return

  context = gsap.context(() => {
    const bounceFooter = (velocity) => {
      const variation = gsap.utils.clamp(-0.35, 0.35, velocity / 10000)

      gsap.fromTo(
        footerShape,
        { attr: { d: footerDownPath } },
        {
          attr: { d: footerCenterPath },
          duration: 2,
          ease: `elastic.out(${1 + Math.abs(variation)}, ${0.55 - Math.abs(variation) * 0.3})`,
          overwrite: true,
        },
      )
    }

    gsap.set(footerShape, { attr: { d: footerCenterPath } })

    ScrollTrigger.create({
      trigger: footer,
      start: 'top bottom',
      onEnter: (self) => bounceFooter(self.getVelocity()),
      onEnterBack: (self) => bounceFooter(self.getVelocity()),
    })
  }, footer)
})

onBeforeUnmount(() => {
  context?.revert()
})
</script>

<template>
  <footer ref="footerBar" class="motion-footer" aria-label="Page footer">
    <svg
      class="footer-wave"
      viewBox="0 0 2278 683"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path ref="footerPath" class="footer-wave-path" :d="footerCenterPath" />
    </svg>
    <div class="footer-inner">
      <span>XCPC.LINK</span>
      <strong>Algorithm collection system</strong>
    </div>
  </footer>
</template>

<style scoped>
.motion-footer {
  position: relative;
  z-index: 3;
  min-height: 34svh;
  overflow: hidden;
  display: grid;
  align-items: end;
  background: var(--page-bg);
  color: var(--page-fg);
}

.footer-wave {
  position: absolute;
  inset: -1px 0 0;
  width: 100%;
  height: 100%;
  display: block;
}

.footer-wave-path {
  fill: var(--footer-wave);
}

.motion-footer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--page-bg);
  opacity: 0.3;
  pointer-events: none;
}

.footer-inner {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 44px));
  margin: 0 auto;
  padding: 0 0 42px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  color: var(--page-fg);
}

.footer-inner span,
.footer-inner strong {
  letter-spacing: 0;
}

.footer-inner span {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted-fg);
}

.footer-inner strong {
  max-width: 520px;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 5vw, 64px);
  line-height: 0.96;
  text-align: right;
  letter-spacing: -0.03em;
}

@media (max-width: 860px) {
  .motion-footer {
    min-height: 30svh;
  }

  .footer-inner {
    padding-bottom: 28px;
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-inner strong {
    text-align: left;
  }
}
</style>
