<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { ACTIVITY_MAX_ENTRIES } from '../../../modules/home/linkActivity'
import type { ActivityEntry } from '../../../modules/home/linkActivity'
import type { SiteLink } from '../../../types/home'

interface ActivityItem extends ActivityEntry {
  link: SiteLink
}

const props = defineProps<{
  popular: ActivityItem[]
  recent: ActivityItem[]
  links: SiteLink[]
  ready: boolean
  loading: boolean
  error: string
}>()
const emit = defineEmits<{ retry: [] }>()

const brokenIcons = ref(new Set<string>())
const sampleLinks = shallowRef<ActivityItem[]>([])
const activityRoot = ref<HTMLElement>()
const scrollHints = ref<Record<string, boolean>>({})
let resizeObserver: ResizeObserver | undefined

const updateScrollHints = () => {
  const hints: Record<string, boolean> = {}
  activityRoot.value?.querySelectorAll<HTMLElement>('[data-activity-row]').forEach((element) => {
    hints[element.dataset.activityRow!] = element.scrollWidth - element.clientWidth - element.scrollLeft > 1
  })
  scrollHints.value = hints
}

const scrollNext = (rowId: string) => {
  const element = activityRoot.value?.querySelector<HTMLElement>(`[data-activity-row="${rowId}"]`)
  if (!element) return
  element.scrollLeft += Math.max(72, element.clientWidth * 0.8)
  updateScrollHints()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(updateScrollHints)
  if (activityRoot.value) resizeObserver.observe(activityRoot.value)
  updateScrollHints()
})
onBeforeUnmount(() => resizeObserver?.disconnect())

watch(() => props.links, (links) => {
  const shuffled = [...new Map(links.map((link) => [link.websiteUrl, link])).values()]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  // 仅用于无记录时展示，不写入访问历史或生成虚假的点击次数。
  sampleLinks.value = shuffled.slice(0, ACTIVITY_MAX_ENTRIES).map((link) => ({
    url: link.websiteUrl, link, lastOpened: 0, weekCount: 0,
  }))
}, { immediate: true })

const rows = computed(() => [
  { id: 'popular', title: '七日常用', items: props.popular.length ? props.popular : props.ready && !props.error ? sampleLinks.value : [] },
  { id: 'recent', title: '最近打开', items: props.recent.length ? props.recent : props.ready && !props.error ? [...sampleLinks.value].reverse() : [] },
])

watch(rows, updateScrollHints, { flush: 'post' })
</script>

<template>
  <section ref="activityRoot" class="link-activity" aria-label="全站访问记录" :aria-busy="loading && !ready">
    <div
      v-for="row in rows"
      :key="row.id"
      class="activity-row"
      :aria-labelledby="`activity-${row.id}`"
    >
      <div class="row-label" :title="row.id === 'popular' ? '全站用户近 7 天最常打开的 20 个网站' : '全站用户最近打开的 20 个网站，重复打开会置顶'">
        <h2 :id="`activity-${row.id}`">{{ row.title }}</h2>
      </div>
      <div v-if="row.items.length" class="activity-window">
        <div class="activity-links" :data-activity-row="row.id" @scroll.passive="updateScrollHints">
          <a
            v-for="item in row.items"
            :key="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="activity-link"
            :title="item.link.websiteTitle"
          >
            <span class="activity-avatar" aria-hidden="true">
              <img
                v-if="item.link.avatarUrl && !brokenIcons.has(item.link.avatarUrl)"
                :src="item.link.avatarUrl"
                alt=""
                width="28"
                height="28"
                decoding="async"
                @error="brokenIcons.add(item.link.avatarUrl)"
              />
              <span v-else>{{ item.link.websiteTitle.charAt(0) }}</span>
            </span>
            <span class="activity-title">{{ item.link.websiteTitle }}</span>
          </a>
        </div>
        <button
          v-if="scrollHints[row.id]"
          type="button"
          class="scroll-hint"
          :aria-label="`向右滑动查看更多${row.title}网站`"
          title="向右滑动查看更多"
          @click="scrollNext(row.id)"
        >
          <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </div>
      <p v-else-if="loading" class="empty-activity" role="status">正在加载…</p>
      <div v-else-if="error" class="activity-error" role="status">
        <span>暂时无法加载</span>
        <button type="button" @click="emit('retry')">重试</button>
      </div>
      <p v-else class="empty-activity">暂无访问记录</p>
    </div>
  </section>
</template>

<style scoped>
.link-activity {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.activity-row {
  min-height: 54px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  overflow: hidden;
  padding: 3px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--surface);
}

.row-label {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  color: var(--surface);
  background: var(--text);
}

.row-label h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 750;
  line-height: 16px;
  white-space: nowrap;
}

.activity-window {
  position: relative;
  min-width: 0;
}

.activity-links {
  min-width: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(68px, 1fr);
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 2px 3px;
  scrollbar-width: none;
}

.activity-links::-webkit-scrollbar { display: none; }

.scroll-hint {
  position: absolute;
  inset: 0 0 0 auto;
  width: 28px;
  display: grid;
  place-items: center end;
  padding: 0;
  color: var(--secondary);
  background: linear-gradient(to right, transparent, var(--surface) 45%);
  cursor: pointer;
}

.scroll-hint:hover { color: var(--focus); }
.scroll-hint:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }

.activity-link {
  min-width: 0;
  min-height: 42px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: inherit;
  text-decoration: none;
}

.activity-link:hover { color: var(--focus); }
.activity-link:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }

.activity-avatar {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  color: #555;
  font-size: 8px;
  font-weight: 750;
}

.activity-avatar img { width: 24px; height: 24px; object-fit: contain; }

.activity-title {
  width: 100%;
  max-width: 68px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
}

.empty-activity { margin: 0; color: var(--secondary); font-size: 10px; line-height: 14px; }
.activity-error { display: flex; align-items: center; gap: 8px; color: var(--secondary); font-size: 10px; }
.activity-error button { padding: 2px 4px; color: var(--focus); font-size: inherit; cursor: pointer; }
.activity-error button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

@media (max-width: 760px) {
  .activity-row {
    padding: 3px 10px;
    border-radius: 12px;
  }
}
</style>
