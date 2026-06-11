import { computed, ref } from 'vue'

export const useTable = <T>(initialRows: T[] = []) => {
  const rows = ref<T[]>(initialRows)
  const rowCount = computed(() => rows.value.length)

  return {
    rows,
    rowCount,
  }
}
