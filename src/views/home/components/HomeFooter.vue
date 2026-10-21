<script setup lang="ts">
import { siteRecords } from '../../../config/site'
</script>

<template>
  <footer class="home-footer">
    <div class="sponsor-line" aria-label="Sponsored by CoolArec and bLue">
      <span class="sponsor-heart" aria-hidden="true">♥</span>
      <span>Sponsored by</span>
      <a class="sponsor-person" href="https://www.coolarec.link/" target="_blank" rel="noreferrer">
        <img src="/assets/icons/sponsor-coolarec-desktop.png" alt="" width="22" height="22" loading="lazy" />
        <span>CoolArec</span>
      </a>
      <span class="sponsor-separator">&amp;</span>
      <a class="sponsor-person" href="https://dreamer.blue/" target="_blank" rel="noreferrer">
        <img src="/assets/icons/sponsor-blue-dreamerblue.png" alt="" width="22" height="22" loading="lazy" />
        <span>bLue</span>
      </a>

    </div>
    <p class="qq-group">
      如果你有意见或新想法，欢迎<a
        href="https://qm.qq.com/q/2CsO3c3ZlS"
        target="_blank"
        rel="noreferrer"
        title="加入 QQ 群 876103138"
      >联系我们</a>
    </p>
    <p v-if="siteRecords.icp.number || siteRecords.publicSecurity.number" class="site-records">
      <a
        v-if="siteRecords.icp.number"
        :href="siteRecords.icp.url || undefined"
        target="_blank"
        rel="noreferrer"
      >{{ siteRecords.icp.number }}</a>
      <span v-if="siteRecords.icp.number && siteRecords.publicSecurity.number" aria-hidden="true">&nbsp;·&nbsp;</span>
      <a
        v-if="siteRecords.publicSecurity.number"
        :href="siteRecords.publicSecurity.url || undefined"
        target="_blank"
        rel="noreferrer"
      >{{ siteRecords.publicSecurity.number }}</a>
    </p>
  </footer>
</template>

<style scoped>
.home-footer {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 28px 0 4px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.sponsor-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sponsor-person {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 3px 9px 3px 4px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}

.sponsor-person img {
  width: 22px;
  height: 22px;
  display: block;
  border-radius: 999px;
  background: var(--surface-subtle);
  object-fit: cover;
}

.sponsor-separator {
  color: var(--secondary);
}

.sponsor-heart {
  display: inline-block;
  color: #ff3b30;
  font-size: 15px;
  line-height: 1;
}

.qq-group {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.qq-group a {
  color: var(--text);
  text-underline-offset: 3px;
}

.site-records {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.site-records a {
  color: inherit;
  text-decoration: none;
}

.site-records a:hover {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
