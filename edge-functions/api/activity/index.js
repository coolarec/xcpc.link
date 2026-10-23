import { activityRoutes } from '../../../server/activity-service.js'

export function onRequest(context) {
  return activityRoutes.lists(context)
}
