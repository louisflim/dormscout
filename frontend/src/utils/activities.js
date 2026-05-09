/** Normalize axios/API response shapes for `/activities/user/:id` */
export function normalizeActivitiesResponse(response) {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

export function countUnreadActivities(acts) {
  return acts.filter((a) => !Boolean(a.read ?? a.isRead)).length;
}
