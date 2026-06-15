import { permanentRedirect } from 'next/navigation'

// The gallery listing moved to /playground/gallery (clearer name than /s).
// Individual shared apps still live at /playground/s/[id] — those permalinks are unchanged.
export default function SharedAppsIndexRedirect() {
  permanentRedirect('/playground/gallery')
}
