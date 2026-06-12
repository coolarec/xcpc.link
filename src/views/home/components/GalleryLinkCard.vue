<script setup lang="ts">
import type { SiteLink } from '../../../types/home'

interface GalleryLinkCardProps extends SiteLink {
  accent?: string
}

withDefaults(defineProps<GalleryLinkCardProps>(), {
  accent: '#007aff',
})

const handleAvatarError = (event: Event): void => {
  const target = event.currentTarget as HTMLImageElement | null
  if (!target) return
  delete target.parentElement?.dataset.avatarLoaded
  target.hidden = true
}

const handleAvatarLoad = (event: Event): void => {
  const target = event.currentTarget as HTMLImageElement | null
  if (!target) return
  target.dataset.loaded = 'true'
  if (target.parentElement) target.parentElement.dataset.avatarLoaded = 'true'
}
</script>

<template>
  <a
    class="gallery-card link-card"
    :href="websiteUrl"
    target="_blank"
    rel="noreferrer"
    :style="{ '--accent': accent }"
  >
    <div class="link-avatar-shell" :data-fallback="websiteTitle.charAt(0)">
      <img
        v-if="avatarUrl"
        class="link-avatar"
        :src="avatarUrl"
        :alt="`${websiteTitle} avatar`"
        draggable="false"
        @load="handleAvatarLoad"
        @error="handleAvatarError"
      >
    </div>
    <div class="link-content">
      <h3>{{ websiteTitle }}</h3>
      <p>{{ websiteDescription }}</p>
    </div>
  </a>
</template>

<style scoped>
.gallery-card {
  box-sizing: border-box;
  position: relative;
  width: clamp(360px, 32vw, 600px);
  height: 480px;
  overflow: hidden;
  display: grid;
  align-content: end;
  gap: 6px;
  padding: var(--link-card-padding, 20px 22px);
  border: 0;
  border-radius: 18px;
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
  height: 5px;
  background: var(--accent);
}

.link-avatar-shell {
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 2;
  width: 64px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 999px;
  overflow: hidden;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.34), transparent 31%),
    color-mix(in srgb, var(--accent), var(--panel-bg) 70%);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 72%),
    inset 0 0 0 1px var(--soft-line);
}

.link-avatar-shell::before {
  content: attr(data-fallback);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, #ffffff, var(--accent) 8%);
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 800;
}

.link-avatar-shell[data-avatar-loaded='true']::before {
  opacity: 0;
}

.link-avatar-shell[data-avatar-loaded='true'] {
  background: transparent;
  box-shadow: none;
}

.link-avatar {
  width: 100%;
  height: 100%;
  opacity: 0;
  object-fit: cover;
  border-radius: 999px;
  transition: opacity 0.2s ease;
}

.link-avatar[data-loaded='true'] {
  opacity: 1;
}

.link-content,
.gallery-card h3,
.gallery-card p {
  position: relative;
  z-index: 1;
}

.link-content {
  align-self: end;
  max-width: 410px;
  min-width: 0;
}

.gallery-card h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: var(--link-title-size, 30px);
  line-height: 1.02;
  letter-spacing: 0;
}

.gallery-card p {
  max-width: 390px;
  margin: 14px 0 0;
  overflow-wrap: anywhere;
  color: var(--muted-fg);
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--link-description-size, 15px);
  line-height: 1.45;
  line-clamp: var(--link-description-lines, 3);
  -webkit-line-clamp: var(--link-description-lines, 3);
  -webkit-box-orient: vertical;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100%;
    max-width: 100%;
    height: clamp(300px, 76svh, 330px);
    gap: 14px;
    padding: 16px;
    border-radius: 18px;
  }

  .link-avatar-shell {
    top: 16px;
    right: 16px;
    width: 50px;
  }

  .link-avatar-shell::before {
    font-size: 19px;
  }

  .link-content {
    max-width: calc(100% - 4px);
  }

  .gallery-card h3 {
    font-size: 30px;
    line-height: 0.96;
  }

  .gallery-card p {
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.45;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
}

@media (max-width: 420px) {
  .gallery-card {
    height: clamp(290px, 72svh, 315px);
    padding: 14px;
  }

  .link-avatar-shell {
    width: 46px;
  }

  .link-avatar-shell::before {
    font-size: 18px;
  }

  .gallery-card h3 {
    font-size: 26px;
  }

  .gallery-card p {
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }
}
</style>
