import { useMemo, useState, type ReactNode } from 'react'
import { AGENCY_MODE, type ViewMode } from './permissions'
import { ViewModeContext } from './viewModeContext'

/**
 * No futuro o modo vem do login. No protótipo vem da barra "Ver como".
 * Guarda apenas o modo: prédio aberto e cliente em foco são derivados dele,
 * para nunca sobrar no estado um id que o modo atual não pode ver.
 */
export default function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>(AGENCY_MODE)
  const value = useMemo(() => ({ mode, setMode }), [mode])
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}
