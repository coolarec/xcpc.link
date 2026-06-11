<template>
  <article class="gallery-card gallery-card-placeholder" aria-hidden="true">
    <span class="placeholder-line placeholder-line-short"></span>
    <span class="placeholder-orb"></span>
    <span class="placeholder-line"></span>
    <span class="placeholder-line placeholder-line-mid"></span>
  </article>
</template>

<style scoped>
.gallery-card {
  position: relative;
  width: clamp(360px, 32vw, 600px);
  height: 480px;
  overflow: hidden;
  display: grid;
  align-content: end;
  gap: 18px;
  padding: 22px;
  border: 0;
  border-radius: 20px;
  background: color-mix(in srgb, var(--card-bg), transparent 2%);
  color: var(--page-fg);
  box-shadow: var(--gallery-card-shadow);
}

.placeholder-orb,
.placeholder-line {
  display: block;
  background: color-mix(in srgb, var(--page-fg), transparent 88%);
}

.placeholder-orb {
  width: 88px;
  aspect-ratio: 1;
  border-radius: 24px;
}

.placeholder-line {
  width: 78%;
  height: 14px;
  border-radius: 999px;
}

.placeholder-line-short {
  width: 82px;
  height: 12px;
}

.placeholder-line-mid {
  width: 54%;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100%;
    height: 360px;
    min-height: 360px;
    max-height: 360px;
  }
}
</style>
