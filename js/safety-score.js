/**
 * SafeCity AI - Explainable Safety Score Engine
 * Implements the transparent 7-factor weighted formula and renders visual factor breakdowns
 */

const SafetyScore = {
  weights: {
    lighting: 0.20,
    crowd: 0.15,
    incident_history: 0.25,
    help_access: 0.15,
    time_factor: 0.10,
    road_condition: 0.10,
    community_signal: 0.05
  },

  calculate(factors) {
    const score = (factors.lighting * this.weights.lighting) +
                  (factors.crowd * this.weights.crowd) +
                  (factors.incident_history * this.weights.incident_history) +
                  (factors.help_access * this.weights.help_access) +
                  (factors.time_factor * this.weights.time_factor) +
                  (factors.road_condition * this.weights.road_condition) +
                  (factors.community_signal * this.weights.community_signal);
    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  },

  getScoreClassification(score) {
    if (score >= 80) {
      return {
        label: 'Optimal Reported Safety Signals',
        badgeClass: 'safe',
        color: 'var(--color-safe)',
        icon: 'fa-shield-heart',
        description: 'Corridor displays favorable municipal lighting, verified active businesses, and dense proximity to emergency help points.'
      };
    } else if (score >= 60) {
      return {
        label: 'Moderate Reported Safety Signals',
        badgeClass: 'caution',
        color: 'var(--color-caution)',
        icon: 'fa-triangle-exclamation',
        description: 'Corridor features intermittent lighting or active civic maintenance notices. Exercise standard caution.'
      };
    } else {
      return {
        label: 'Multiple Infrastructure Concerns',
        badgeClass: 'warning',
        color: 'var(--color-danger)',
        icon: 'fa-circle-exclamation',
        description: 'Corridor includes documented dark stretches, reported road defects, or isolated backroads. An alternate well-lit route is recommended.'
      };
    }
  },

  renderFactorBreakdown(containerId, factors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div class="factors-grid" style="display: flex; flex-direction: column; gap: 0.85rem;">';

    for (const [key, item] of Object.entries(factors)) {
      const score = item.score;
      const weight = item.weight;
      let barColor = 'var(--color-safe)';
      if (score < 55) barColor = 'var(--color-danger)';
      else if (score < 75) barColor = 'var(--color-caution)';

      html += `
        <div class="factor-row">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
            <div style="font-size: 0.875rem; font-weight: 600;">
              ${item.name}
              <span style="font-size: 0.725rem; color: var(--text-muted); font-weight: 500; margin-left: 0.25rem;">(${weight} weight)</span>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; color: ${barColor};">
              ${score} / 100
            </div>
          </div>
          <div style="height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--border-color);">
            <div style="width: ${Math.min(100, Math.max(0, score))}%; height: 100%; background: ${barColor}; border-radius: var(--radius-full); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${item.desc}
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }
};

