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
        <span>dreamerbLue</span>
      </a>

    </div>
    <p class="cdn-credit">
      <span>
        Thanks to
        <a class="cdn-provider" href="https://algoux.org/" target="_blank" rel="noreferrer">
          <img src="/assets/icons/algoux-mark.svg" alt="" width="28" height="18" loading="lazy" />
          <span>algoUX</span>
        </a>
        for CDN and optimization services.
      </span>
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

.cdn-credit {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.cdn-credit img {
  width: 28px;
  height: 18px;
  display: inline-block;
  object-fit: contain;
  vertical-align: middle;
}

.cdn-credit a {
  color: var(--text);
  text-decoration: none;
}

.cdn-credit a:hover {
  text-decoration: underline;
}

.cdn-provider {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  vertical-align: middle;
}
</style>
