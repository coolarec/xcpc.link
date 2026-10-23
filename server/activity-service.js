import { activityUrls } from './activity-catalog.js'
import { createActivityService } from './activity.js'

export const activityService = createActivityService({ urls: activityUrls })
import { getStore } from '@edgeone/pages-blob'

export function createActivityRoutes({ storeFactory = getStore, service = activityService } = {}) {
  const stores = new Map()
  const handle = async (method, { request, env }) => {
    const name = env?.ACTIVITY_BLOB_STORE
    let store
    if (typeof name === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(name)) {
      try {
        if (!stores.has(name)) stores.set(name, storeFactory(name))
        store = stores.get(name)
      } catch {
        store = undefined
      }
    }
    return service[method](request, store)
  }
  return {
    lists: (context) => handle('lists', context),
    click: (context) => handle('click', context),
  }
}

export const activityRoutes = createActivityRoutes()
