<script setup>
defineProps({
  avatar: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  href: {
    type: String,
    required: true,
  },
  tags: {
    type: Array,
    default: () => [],
  },
  index: {
    type: Number,
    required: true,
  },
  accent: {
    type: String,
    default: '#007aff',
  },
})
</script>

<template>
  <a
    class="gallery-card link-card"
    :href="href"
    target="_blank"
    rel="noreferrer"
    :style="{ '--accent': accent }"
  >
    <span class="gallery-index">{{ String(index + 1).padStart(2, '0') }}</span>
    <div class="link-avatar" aria-hidden="true">{{ avatar }}</div>
    <div class="link-content">
      <span class="link-kicker">Reference</span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
    <div v-if="tags.length" class="gallery-tags" aria-label="tags">
      <span v-for="tag in tags" :key="tag">{{ tag }}</span>
    </div>
    <span class="link-action" aria-hidden="true">Open</span>
  </a>
</template>

<style scoped>
.gallery-card {
  position: relative;
  width: clamp(360px, 32vw, 600px);
  height: 480px;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 22px;
  padding: 22px;
  border: 0;
  border-radius: 20px;
  background: color-mix(in srgb, var(--card-bg), transparent 2%);
  color: var(--page-fg);
  box-shadow: var(--gallery-card-shadow);
  text-decoration: none;
  transition:
    background-color 0.28s ease,
    box-shadow 0.28s ease;
}

.gallery-card:hover {
  background: color-mix(in srgb, var(--card-bg), var(--page-fg) 3%);
}

.gallery-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent);
}

.gallery-index {
  position: relative;
  z-index: 2;
  width: fit-content;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--page-fg), transparent 92%);
  color: var(--muted-fg);
  font-size: 12px;
  font-family: "Sora", sans-serif;
  font-weight: 700;
}

.link-avatar {
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 2;
  width: 64px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: color-mix(in srgb, var(--accent), var(--panel-bg) 70%);
  color: color-mix(in srgb, #ffffff, var(--accent) 8%);
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: 22px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 72%),
    inset 0 0 0 1px var(--soft-line);
}

.link-content,
.gallery-card h3,
.gallery-card p,
.gallery-tags,
.link-action {
  position: relative;
  z-index: 1;
}

.link-content {
  align-self: end;
  max-width: 410px;
}

.link-kicker {
  display: block;
  margin-bottom: 12px;
  color: color-mix(in srgb, var(--accent), #ffffff 14%);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gallery-card h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(40px, 5vw, 72px);
  line-height: 0.92;
  letter-spacing: -0.03em;
}

.gallery-card p {
  max-width: 390px;
  margin: 20px 0 0;
  color: var(--muted-fg);
  font-size: 17px;
  line-height: 1.5;
}

.gallery-tags {
  display: flex;
  flex-wrap: wrap;
  align-self: end;
  gap: 0;
  padding-right: 82px;
}

.gallery-tags span {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  margin: 2px 2px 2px 0;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--page-fg), transparent 92%);
  color: var(--muted-fg);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.link-action {
  position: absolute;
  right: 22px;
  bottom: 22px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent), transparent 84%);
  color: color-mix(in srgb, var(--accent), #ffffff 18%);
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100%;
    height: 360px;
    padding: 20px;
    border-radius: 18px;
  }

  .gallery-card h3 {
    font-size: clamp(34px, 11vw, 48px);
  }

  .gallery-card p {
    font-size: 15px;
  }

  .gallery-tags {
    padding-right: 0;
  }

  .link-action {
    display: none;
  }
}
</style>
