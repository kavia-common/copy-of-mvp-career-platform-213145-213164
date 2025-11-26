import React, { createContext, useContext, useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export const JourneyContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * JourneyProvider stores the user's current journey selections and results.
 */
export function JourneyProvider({ children }) {
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [targetRoleId, setTargetRoleId] = useState(null);
  const [assessment, setAssessment] = useState([]); // array of {id, name, proficiencyLevel}
  const [gapResult, setGapResult] = useState(null);
  const [developmentPlan, setDevelopmentPlan] = useState(null);

  const value = useMemo(() => ({
    currentRoleId,
    setCurrentRoleId,
    targetRoleId,
    setTargetRoleId,
    assessment,
    setAssessment,
    gapResult,
    setGapResult,
    developmentPlan,
    setDevelopmentPlan
  }), [
    currentRoleId, targetRoleId, assessment, gapResult, developmentPlan
  ]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

// PUBLIC_INTERFACE
export function useJourney() {
  /** Hook to access the current journey (roles, assessment, gap analysis, plan). */
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}
