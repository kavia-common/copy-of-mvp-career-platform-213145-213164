import React from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * CompetencySlider renders a labeled range input for a competency level (0-5).
 */
export default function CompetencySlider({ id, label, value, min = 0, max = 5, step = 1, onChange }) {
  const sliderId = `competency-${id}`;
  const valueId = `${sliderId}-value`;

  return (
    <div className="comp-slider">
      <label htmlFor={sliderId} className="comp-label">
        {label}
      </label>
      <div className="comp-input-row">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-describedby={valueId}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output id={valueId} className="comp-value" aria-live="polite">
          {value}
        </output>
      </div>
    </div>
  );
}

CompetencySlider.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired
};
