<template>
  <footer class="home-footer">
    <div class="sponsor-line" aria-label="Sponsored by CoolArec and bLue">
      <span>Sponsored by</span>
      <span class="sponsor-person">
        <img src="/assets/icons/sponsor-coolarec.png" alt="" width="22" height="22" loading="lazy" />
        <span>CoolArec</span>
      </span>
      <span class="sponsor-separator">&amp;</span>
      <span class="sponsor-person">
        <img src="/assets/icons/sponsor-blue.svg" alt="" width="22" height="22" loading="lazy" />
        <span>bLue</span>
      </span>
      <span class="sponsor-heart" aria-hidden="true">♥</span>
    </div>
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
</style>
