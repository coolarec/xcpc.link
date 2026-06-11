import { computed, ref } from 'vue'

export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const offset = computed(() => (page.value - 1) * pageSize.value)

  return {
    page,
    pageSize,
    offset,
  }
}
