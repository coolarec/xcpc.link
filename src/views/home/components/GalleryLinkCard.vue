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
    <!-- Ambient background effects -->
    <div class="card-ambient-glow"></div>
    <div class="card-watermark" aria-hidden="true">{{ websiteTitle.charAt(0) }}</div>

    <!-- Header area -->
    <div class="card-header">
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
      
      <div class="action-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17L17 7"/>
          <path d="M7 7h10v10"/>
        </svg>
      </div>
    </div>

    <!-- Content area -->
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px 32px;
  border: 0;
  border-radius: 32px;
  background: color-mix(in srgb, var(--card-bg), transparent 2%);
  color: var(--page-fg);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 32px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
  transform: translateZ(0);
}

.gallery-card:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 24px 48px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.04);
  background: color-mix(in srgb, var(--card-bg), var(--page-fg) 2%);
}

.card-ambient-glow {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 70%;
  aspect-ratio: 1;
  background: var(--accent);
  filter: blur(80px);
  opacity: 0.12;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.4s ease;
}

.gallery-card:hover .card-ambient-glow {
  opacity: 0.18;
}

.card-watermark {
  position: absolute;
  bottom: -4%;
  right: -4%;
  font-size: 280px;
  font-family: "Sora", sans-serif;
  font-weight: 900;
  line-height: 1;
  color: var(--accent);
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  transform: rotate(-4deg);
}

.card-header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.link-avatar-shell {
  width: 72px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.34), transparent 31%),
    color-mix(in srgb, var(--accent), var(--panel-bg) 70%);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 72%),
    0 8px 24px rgba(0, 0, 0, 0.06);
  position: relative;
}

.link-avatar-shell::before {
  content: attr(data-fallback);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, #ffffff, var(--accent) 8%);
  font-family: "Sora", sans-serif;
  font-size: 28px;
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
  border-radius: 20px;
  transition: opacity 0.3s ease;
}

.link-avatar[data-loaded='true'] {
  opacity: 1;
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--page-fg) 4%, transparent);
  color: var(--muted-fg);
  display: grid;
  place-items: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.gallery-card:hover .action-btn {
  background: var(--accent);
  color: #ffffff;
  transform: scale(1.05) translate(2px, -2px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 40%, transparent);
}

.link-content,
.gallery-card h3,
.gallery-card p {
  position: relative;
  z-index: 1;
}

.link-content {
  align-self: flex-start;
  max-width: 90%;
  min-width: 0;
}

.gallery-card h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: var(--link-title-size, 34px);
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.gallery-card p {
  margin: 16px 0 0;
  overflow-wrap: anywhere;
  color: var(--muted-fg);
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--link-description-size, 16px);
  line-height: 1.5;
  font-weight: 400;
  line-clamp: var(--link-description-lines, 3);
  -webkit-line-clamp: var(--link-description-lines, 3);
  -webkit-box-orient: vertical;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100%;
    max-width: 100%;
    height: clamp(300px, 76svh, 330px);
    padding: 28px 24px;
    border-radius: 28px;
  }

  .card-ambient-glow {
    width: 90%;
    filter: blur(60px);
  }

  .card-watermark {
    font-size: 200px;
    bottom: -5%;
    right: -5%;
  }

  .link-avatar-shell {
    width: 60px;
    border-radius: 16px;
  }

  .link-avatar-shell::before {
    font-size: 24px;
  }

  .link-avatar {
    border-radius: 16px;
  }

  .action-btn {
    width: 38px;
    height: 38px;
  }

  .action-btn svg {
    width: 16px;
    height: 16px;
  }

  .link-content {
    max-width: 100%;
  }

  .gallery-card h3 {
    font-size: 28px;
  }

  .gallery-card p {
    margin-top: 12px;
    font-size: 14px;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }
}

@media (max-width: 420px) {
  .gallery-card {
    height: clamp(290px, 72svh, 315px);
    padding: 24px 20px;
    border-radius: 24px;
  }

  .link-avatar-shell {
    width: 52px;
    border-radius: 14px;
  }

  .link-avatar-shell::before {
    font-size: 20px;
  }

  .link-avatar {
    border-radius: 14px;
  }

  .action-btn {
    width: 34px;
    height: 34px;
  }

  .gallery-card h3 {
    font-size: 24px;
  }

  .gallery-card p {
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }
}
</style>
