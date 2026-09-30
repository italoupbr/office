import { createContext, useContext } from 'react'
import type { ViewMode } from './permissions'
import { AGENCY_MODE } from './permissions'

export interface ViewModeValue {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}

export const ViewModeContext = createContext<ViewModeValue>({
  mode: AGENCY_MODE,
  setMode: () => {},
})

export function useViewMode(): ViewModeValue {
  return useContext(ViewModeContext)
}
