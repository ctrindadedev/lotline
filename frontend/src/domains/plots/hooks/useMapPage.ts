import { useMap } from '../../../shared/map/useMap';

export function useMapPage() {
  const { targetRef, map } = useMap();

  return { mapTargetRef: targetRef, map };
}
