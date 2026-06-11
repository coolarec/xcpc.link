import homeGalleries from '../data/home-galleries.json'

const cloneGalleries = (galleries) => structuredClone(galleries)

const fetchBackendGalleries = async (endpoint) => {
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Failed to fetch home galleries: ${response.status}`)
  }

  return response.json()
}

export const fetchHomeGalleries = async () => {
  const endpoint = import.meta.env.VITE_GALLERIES_API_URL

  if (endpoint) {
    try {
      return await fetchBackendGalleries(endpoint)
    } catch (error) {
      console.warn(error)
    }
  }

  return cloneGalleries(homeGalleries)
}
