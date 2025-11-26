import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompetencySlider from '../components/CompetencySlider';
import { getCompetencies, submitAssessment } from '../api/client';
import { useJourney } from '../context/JourneyContext';

/**
 * PUBLIC_INTERFACE
 * Assessment page shows competencies and lets user set proficiency levels.
 */
export default function Assessment() {
  const navigate = useNavigate();
  const { currentRoleId, targetRoleId, assessment, setAssessment } = useJourney();

  const [competencies, setCompetencies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentRoleId || !targetRoleId) {
      navigate('/roles');
      return;
    }

    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await getCompetencies(targetRoleId);
        const arr = Array.isArray(data) ? data : [];
        // Initialize user levels from existing assessment or default 0
        const withLevels = arr.map((c) => {
          const existing = assessment.find((a) => a.id === (c.id || c.name));
          return {
            id: c.id || c.name,
            name: c.name,
            definition: c.definition,
            proficiencyLevel: existing ? existing.proficiencyLevel : 0
          };
        });
        setCompetencies(withLevels);
      } catch (err) {
        setError(err?.message || 'Failed to load competencies');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentRoleId, targetRoleId, assessment, navigate]);

  function updateLevel(idx, level) {
    setCompetencies((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], proficiencyLevel: level };
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await submitAssessment(competencies, { targetRoleId });
    } catch {
      // proceed even if backend doesn't persist assessment
    }
    setAssessment(competencies);
    navigate('/gap');
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Competency assessment</h1>
        <p className="muted">Rate your current proficiency (0 to 5) for each competency.</p>

        {loading && <div role="status" aria-live="polite">Loading competencies…</div>}
        {error && <div className="error" role="alert">{error}</div>}

        {!loading && !error && (
          <form onSubmit={handleSubmit} className="form">
            <div className="competency-list">
              {competencies.map((c, idx) => (
                <div key={c.id} className="card">
                  <h3 className="card-title">{c.name}</h3>
                  {c.definition && <p className="card-subtitle">{c.definition}</p>}
                  <CompetencySlider
                    id={c.id}
                    label="Proficiency"
                    value={c.proficiencyLevel}
                    onChange={(lvl) => updateLevel(idx, lvl)}
                  />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Continue to Gap Analysis</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
