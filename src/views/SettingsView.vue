<script setup>
import { Database, Settings, ShieldCheck } from '@lucide/vue'
</script>

<template>
  <section class="route-page">
    <div class="route-kicker">
      <Settings :size="18" aria-hidden="true" />
      <span>设置</span>
    </div>
    <div class="route-hero">
      <h1>同步、导入和偏好设置放在这里。</h1>
      <p>后续可以接账号同步、导入导出、外观偏好和快捷操作。当前先完成信息架构。</p>
    </div>
    <div class="route-grid" aria-label="设置模块">
      <article class="route-panel">
        <Database :size="22" aria-hidden="true" />
        <h2>导入导出</h2>
        <p>预留浏览器书签和 JSON 数据入口。</p>
      </article>
      <article class="route-panel">
        <ShieldCheck :size="22" aria-hidden="true" />
        <h2>隐私控制</h2>
        <p>把同步范围和本地数据策略清楚分开。</p>
      </article>
    </div>
  </section>
</template>
