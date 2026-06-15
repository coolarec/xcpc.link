<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const footerBar = ref<HTMLElement | null>(null)
const footerPath = ref<SVGPathElement | null>(null)

const footerDownPath = 'M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z'
const footerCenterPath = 'M0-0.3C0-0.3,464,0,1139,0S2278-0.3,2278-0.3V683H0V-0.3z'

let context: gsap.Context | undefined

onMounted(async () => {
  await nextTick()

  const footer = footerBar.value
  const footerShape = footerPath.value

  if (!footer || !footerShape) return

  context = gsap.context(() => {
    const bounceFooter = (velocity: number) => {
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
      <span>AWESOME XCPC</span>
      <div class="footer-copy">
        <strong>Building the ACM universe, together.</strong>
        <div class="sponsor-line" aria-label="Sponsored by CoolArec and bLue">
          <span>Sponsored by</span>
          <span class="sponsor-person">
            <img src="/assets/icons/sponsor-coolarec-desktop.png" alt="" width="28" height="28" loading="lazy" />
            <span>CoolArec</span>
          </span>
          <span class="sponsor-separator">&amp;</span>
          <span class="sponsor-person">
            <img src="/assets/icons/sponsor-blue-dreamerblue.png" alt="" width="28" height="28" loading="lazy" />
            <span>bLue</span>
          </span>
        </div>
        <p class="cdn-credit">
          <span>
            Thanks to
            <a class="cdn-provider" href="https://algoux.org/" target="_blank" rel="noreferrer">
              <img src="/assets/icons/algoux-mark.svg" alt="" width="28" height="18" loading="lazy" />
              <span>algoUX</span>
            </a>
            for CDN and optimization services.
          </span>
        </p>
      </div>
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
.footer-copy strong,
.footer-copy p {
  letter-spacing: 0;
}

.footer-inner span {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted-fg);
}

.footer-copy {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.footer-copy strong {
  max-width: 520px;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 5vw, 64px);
  line-height: 0.96;
  text-align: right;
  letter-spacing: -0.03em;
}

.footer-copy p {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: var(--muted-fg);
  text-align: right;
}

.sponsor-line {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted-fg);
  font-size: 13px;
  font-weight: 700;
}

.sponsor-person {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--page-fg);
}

.sponsor-person img {
  width: 28px;
  height: 28px;
  border: 1px solid color-mix(in srgb, var(--page-fg), transparent 84%);
  border-radius: 999px;
  object-fit: cover;
}

.sponsor-separator {
  color: var(--muted-fg);
}

.cdn-credit {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.cdn-credit img {
  width: 28px;
  height: 18px;
  display: inline-block;
  object-fit: contain;
  vertical-align: middle;
}

.cdn-credit a {
  color: var(--page-fg);
  text-decoration: none;
}

.cdn-credit a:hover {
  text-decoration: underline;
}

.cdn-provider {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  vertical-align: middle;
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

  .footer-copy {
    justify-items: start;
  }

  .footer-copy strong,
  .footer-copy p {
    text-align: left;
  }

  .sponsor-line {
    justify-content: flex-start;
  }

  .cdn-credit {
    justify-content: flex-start;
  }
}
</style>
