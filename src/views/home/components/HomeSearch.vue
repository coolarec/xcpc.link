<script setup lang="ts">
import { ExternalLink, MapPin, Search, X } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import {
  searchHomeItems,
  type HomeLocationSearchItem,
  type HomeSearchItem,
  type HomeWebsiteSearchItem,
} from './homeViewModel'

const props = defineProps<{
  items: HomeSearchItem[]
  open: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [item: HomeSearchItem]
}>()

const query = ref('')
const activeIndex = ref(-1)
const searchResultsRef = ref<HTMLElement | null>(null)
const searchListId = 'home-search-results'

const results = computed(() => searchHomeItems(props.items, query.value))
const locationResults = computed(() =>
  results.value.filter((item): item is HomeLocationSearchItem => item.kind !== 'website'),
)
const websiteResults = computed(() =>
  results.value.filter((item): item is HomeWebsiteSearchItem => item.kind === 'website'),
)
const displayedResults = computed(() => [...locationResults.value, ...websiteResults.value])
const activeDescendant = computed(() => {
  const item = displayedResults.value[activeIndex.value]
  return item ? `${searchListId}-${item.id}` : undefined
})

watch(displayedResults, (items) => {
  activeIndex.value = items.length ? 0 : -1
})

const openResults = () => {
  emit('update:open', query.value.trim().length > 0)
}

const closeResults = () => {
  emit('update:open', false)
}

const clearSearch = () => {
  query.value = ''
  activeIndex.value = -1
  closeResults()
}

const selectItem = (item: HomeSearchItem) => {
  emit('select', item)
  clearSearch()
}

const moveActiveResult = async (offset: number) => {
  const itemCount = displayedResults.value.length
  if (!itemCount) return
  activeIndex.value = (activeIndex.value + offset + itemCount) % itemCount
  await nextTick()
  searchResultsRef.value
    ?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
    ?.scrollIntoView?.({ block: 'nearest' })
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    await moveActiveResult(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    await moveActiveResult(-1)
  } else if (event.key === 'Enter') {
    const item = displayedResults.value[activeIndex.value]
    if (!item) return
    event.preventDefault()
    selectItem(item)
  } else if (event.key === 'Escape') {
    closeResults()
  }
}

const hideBrokenIcon = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement
  image.style.display = 'none'
}
</script>

<template>
  <div class="home-search">
    <Search class="search-icon" :size="19" :stroke-width="2.2" aria-hidden="true" />
    <input
      v-model="query"
      type="search"
      role="combobox"
      aria-label="搜索分类、分组或网站"
      aria-autocomplete="list"
      :aria-controls="searchListId"
      :aria-expanded="open"
      :aria-activedescendant="activeDescendant"
      :disabled="disabled"
      :placeholder="disabled ? '正在加载资源' : '搜索标题或网站'"
      autocomplete="off"
      spellcheck="false"
      @focus="openResults"
      @input="openResults"
      @keydown="handleKeydown"
    />

    <button
      v-if="query"
      type="button"
      class="clear-search"
      aria-label="清空搜索"
      @click="clearSearch"
    >
      <X :size="16" :stroke-width="2.4" aria-hidden="true" />
    </button>

    <div
      v-if="open && query.trim()"
      :id="searchListId"
      ref="searchResultsRef"
      class="search-results"
      role="listbox"
      aria-label="搜索结果"
    >
      <template v-if="displayedResults.length">
        <section v-if="locationResults.length" class="result-group" aria-labelledby="location-results-title">
          <p id="location-results-title" class="result-group-title">页面位置</p>
          <button
            v-for="item in locationResults"
            :id="`${searchListId}-${item.id}`"
            :key="item.id"
            type="button"
            class="search-result"
            role="option"
            :aria-selected="displayedResults[activeIndex]?.id === item.id"
            :class="{ 'is-active': displayedResults[activeIndex]?.id === item.id }"
            @mouseenter="activeIndex = displayedResults.findIndex((result) => result.id === item.id)"
            @click="selectItem(item)"
          >
            <span class="result-icon location-icon" aria-hidden="true">
              <MapPin :size="17" :stroke-width="2.2" />
            </span>
            <span class="result-copy">
              <strong>{{ item.label }}</strong>
              <span>{{ item.context }}</span>
            </span>
          </button>
        </section>

        <section v-if="websiteResults.length" class="result-group" aria-labelledby="website-results-title">
          <p id="website-results-title" class="result-group-title">网站</p>
          <a
            v-for="item in websiteResults"
            :id="`${searchListId}-${item.id}`"
            :key="item.id"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="search-result"
            role="option"
            :aria-selected="displayedResults[activeIndex]?.id === item.id"
            :class="{ 'is-active': displayedResults[activeIndex]?.id === item.id }"
            @mouseenter="activeIndex = displayedResults.findIndex((result) => result.id === item.id)"
            @click="clearSearch"
          >
            <span class="result-icon" aria-hidden="true">
              <img
                v-if="item.kind === 'website' && item.avatarUrl"
                :src="item.avatarUrl"
                :alt="item.label"
                width="22"
                height="22"
                @error="hideBrokenIcon"
              />
              <span v-else>{{ item.label.charAt(0) }}</span>
            </span>
            <span class="result-copy">
              <strong>{{ item.label }}</strong>
              <span>{{ item.context }}</span>
            </span>
            <ExternalLink class="result-action" :size="16" aria-hidden="true" />
          </a>
        </section>
      </template>

      <p v-else class="empty-results" role="status">没有找到匹配内容</p>
    </div>
  </div>
</template>

<style scoped>
.home-search {
  position: relative;
  width: 100%;
  min-width: 0;
}

.search-icon {
  position: absolute;
  z-index: 1;
  left: 15px;
  top: 50%;
  color: var(--secondary);
  pointer-events: none;
  transform: translateY(-50%);
}

input {
  width: 100%;
  height: 46px;
  padding: 0 46px 0 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  outline: 0;
  color: var(--text);
  background: var(--surface);
  font-size: 15px;
  font-weight: 650;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
  appearance: none;
}

input::-webkit-search-cancel-button {
  display: none;
}

input::placeholder {
  color: var(--secondary);
  font-weight: 600;
}

input:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--text) 18%, transparent);
}

input:focus {
  border-color: var(--focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 18%, transparent);
}

input:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.clear-search {
  position: absolute;
  z-index: 2;
  right: 2px;
  top: 1px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--secondary);
  background: transparent;
}

.clear-search:hover,
.clear-search:focus-visible {
  color: var(--text);
}

.search-results {
  position: absolute;
  z-index: 80;
  inset: calc(100% + 8px) 0 auto;
  max-height: min(440px, calc(100dvh - 180px));
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.14);
}

.result-group + .result-group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--line);
}

.result-group-title {
  margin: 0;
  padding: 8px 10px 5px;
  color: var(--secondary);
  font-size: 12px;
  font-weight: 750;
}

.search-result {
  width: 100%;
  min-height: 52px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  color: var(--text);
  background: transparent;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.search-result:hover,
.search-result.is-active {
  background: var(--surface-hover);
}

.result-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-subtle);
  font-size: 12px;
  font-weight: 800;
}

.result-icon img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.location-icon {
  color: var(--focus);
}

.result-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.result-copy strong,
.result-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-copy strong {
  font-size: 14px;
  line-height: 1.25;
}

.result-copy span {
  color: var(--secondary);
  font-size: 12px;
  line-height: 1.3;
}

.result-action {
  color: var(--secondary);
}

.empty-results {
  margin: 0;
  padding: 24px 16px;
  color: var(--secondary);
  font-size: 13px;
  font-weight: 650;
  text-align: center;
}

@media (max-width: 760px) {
  input {
    font-size: 16px;
  }

  .search-results {
    right: -54px;
  }
}

@media (prefers-reduced-motion: reduce) {
  input {
    transition: none;
  }
}
</style>
