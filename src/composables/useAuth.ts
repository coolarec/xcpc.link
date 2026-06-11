import { ref } from 'vue'

export const useAuth = () => {
  const isAuthenticated = ref(false)

  return {
    isAuthenticated,
  }
}
