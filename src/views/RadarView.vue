<script setup>
import { Compass, Gauge, Radar } from '@lucide/vue'
</script>

<template>
  <section class="route-page">
    <div class="route-kicker">
      <Compass :size="18" aria-hidden="true" />
      <span>雷达</span>
    </div>
    <div class="route-hero">
      <h1>让新内容自己浮上来。</h1>
      <p>雷达页预留给订阅源、最近访问、趋势主题和提醒机制，方便之后扩展自动发现能力。</p>
    </div>
    <div class="route-grid" aria-label="雷达模块">
      <article class="route-panel">
        <Radar :size="22" aria-hidden="true" />
        <h2>主题追踪</h2>
        <p>持续观察关键词、站点和比赛信息。</p>
      </article>
      <article class="route-panel">
        <Gauge :size="22" aria-hidden="true" />
        <h2>热度排序</h2>
        <p>让近期高频资料更容易被再次打开。</p>
      </article>
    </div>
  </section>
</template>
