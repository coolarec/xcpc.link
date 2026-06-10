<script setup>
import { Bookmark, Search, Tag } from '@lucide/vue'
</script>

<template>
  <section class="route-page">
    <div class="route-kicker">
      <Bookmark :size="18" aria-hidden="true" />
      <span>收藏库</span>
    </div>
    <div class="route-hero">
      <h1>所有收藏，按状态安静排好。</h1>
      <p>这里会承载列表、搜索、标签过滤与批量整理。当前先保留页面结构，后续功能可以直接接入。</p>
    </div>
    <div class="route-showcase route-showcase-blue" aria-hidden="true">
      <div class="route-screen">
        <span>Library</span>
        <strong>128</strong>
        <p>Saved references grouped by source, tag, and review status.</p>
      </div>
    </div>
    <div class="route-grid" aria-label="收藏库状态">
      <article class="route-panel">
        <Search :size="22" aria-hidden="true" />
        <h2>快速检索</h2>
        <p>域名、标题、标签和备注统一检索。</p>
      </article>
      <article class="route-panel">
        <Tag :size="22" aria-hidden="true" />
        <h2>标签切片</h2>
        <p>用轻量标签组合出可复用的视图。</p>
      </article>
    </div>
  </section>
</template>
