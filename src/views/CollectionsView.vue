<script setup>
import { FolderOpen, Layers, Sparkles } from '@lucide/vue'
</script>

<template>
  <section class="route-page">
    <div class="route-kicker">
      <FolderOpen :size="18" aria-hidden="true" />
      <span>专题</span>
    </div>
    <div class="route-hero">
      <h1>把链接整理成可以回看的专题。</h1>
      <p>专题页会用于收藏夹、研究包和项目资料集。现在先保留内容分区和卡片密度。</p>
    </div>
    <div class="route-showcase route-showcase-green" aria-hidden="true">
      <div class="route-screen">
        <span>Collections</span>
        <strong>12</strong>
        <p>Curated algorithm packs with quiet structure and review-ready grouping.</p>
      </div>
    </div>
    <div class="route-grid" aria-label="专题结构">
      <article class="route-panel">
        <Layers :size="22" aria-hidden="true" />
        <h2>项目资料</h2>
        <p>把竞赛、工具、文章和数据源分组。</p>
      </article>
      <article class="route-panel">
        <Sparkles :size="22" aria-hidden="true" />
        <h2>精选入口</h2>
        <p>为常用集合提供第一屏入口。</p>
      </article>
    </div>
  </section>
</template>
