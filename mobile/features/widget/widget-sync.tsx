import { updateNeonWidget, type WidgetSnapshot } from '@neon-reserve/widget'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiRequest } from '@/lib/api'

export function useWidgetSnapshot() {
  return useQuery({
    queryKey: ['widget-snapshot'],
    queryFn: () => apiRequest<{ snapshot: WidgetSnapshot }>('/v1/widget/snapshot'),
    staleTime: 15 * 60_000,
    retry: 1,
  })
}

export function WidgetSync() {
  const snapshot = useWidgetSnapshot()

  useEffect(() => {
    if (snapshot.data?.snapshot) {
      updateNeonWidget(snapshot.data.snapshot).catch((error) => console.warn('Widget update failed', error))
    }
  }, [snapshot.data])

  return null
}
