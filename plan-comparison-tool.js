/**
 * Resting Sycamore — Plan Comparison Tool
 * 
 * Problem 1: /medicare/compare-medicare-plans (static page)
 *   - User selects state → filters plans → picks Plan A and Plan B → sees comparison
 * 
 * Problem 2: /comparisons/[slug] (CMS template pages)
 *   - Reads data-plan-1 and data-plan-2 from wrapper div
 *   - Auto-renders comparison on page load, no user interaction needed
 * 
 * Requires: plans.json hosted at https://papiofficial.github.io/rsa/plans.json
 */

(function () {
  const PLANS_URL = 'https://papiofficial.github.io/rsa/plans.json';

  // ─── Shared: fetch plans data ────────────────────────────────────────────────
  async function fetchPlans() {
    const r = await fetch(PLANS_URL);
    return r.json();
  }

  // ─── Shared: render comparison table ────────────────────────────────────────
  function renderComparison(plan1, plan2, container) {
    const fields = [
      { label: 'Carrier', key: 'carrier' },
      { label: 'Plan Type', key: 'plan-type' },
      { label: 'State', key: 'state' },
      { label: 'Monthly Premium', key: 'monthly-premium' },
      { label: 'Part C Premium', key: 'part-c-premium' },
      { label: 'Part D Premium', key: 'part-d-premium' },
      { label: 'Annual Part D Deductible', key: 'annual-deductible' },
      { label: 'Max Out-of-Pocket', key: 'out-of-pocket-max' },
      { label: 'Primary Care Copay', key: 'primary-care-copay' },
      { label: 'Specialist Copay', key: 'specialist-copay' },
      { label: 'Emergency Room', key: 'er-copay' },
      { label: 'Urgent Care', key: 'urgent-care-copay' },
      { label: 'Inpatient Hospital', key: 'inpatient-copay' },
      { label: 'Overall Star Rating', key: 'star-rating' },
      { label: 'Dental Coverage', key: 'dental-coverage' },
      { label: 'Vision Coverage', key: 'vision-coverage' },
      { label: 'Hearing Coverage', key: 'hearing-coverage' },
      { label: 'OTC Credit', key: 'otc-credit' },
    ];

    // Determine differences for highlighting
    const diffs = new Set(
      fields.filter(f => plan1[f.key] !== plan2[f.key]).map(f => f.key)
    );

    const fmt = v => (v === null || v === undefined || v === '') ? '—' : v;
    const star = v => v ? '⭐'.repeat(Math.round(v)) + ` (${v})` : '—';

    const rows = fields.map(f => {
      const isDiff = diffs.has(f.key);
      const val1 = f.key === 'star-rating' ? star(plan1[f.key]) : fmt(plan1[f.key]);
      const val2 = f.key === 'star-rating' ? star(plan2[f.key]) : fmt(plan2[f.key]);
      return `<tr class="${isDiff ? 'comp-diff' : ''}">
        <td class="comp-label">${f.label}</td>
        <td class="comp-val">${val1}</td>
        <td class="comp-val">${val2}</td>
      </tr>`;
    }).join('');

    // Key differences summary
    const diffFields = fields.filter(f => diffs.has(f.key));
    const keyDiffs = diffFields.length > 0
      ? `<div class="comp-key-diffs">
          <h3>Key Differences at a Glance</h3>
          <ul>${diffFields.map(f => `<li><strong>${f.label}:</strong> ${fmt(plan1[f.key])} vs ${fmt(plan2[f.key])}</li>`).join('')}</ul>
        </div>`
      : '<div class="comp-key-diffs"><p>These plans are identical across all compared fields.</p></div>';

    container.innerHTML = `
      <div class="comp-wrap">
        <div class="comp-table-wrap">
          <table class="comp-table">
            <thead>
              <tr>
                <th></th>
                <th class="comp-plan-name">${plan1.name}</th>
                <th class="comp-plan-name">${plan2.name}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${keyDiffs}
        <p class="comp-disclaimer">Plan benefit data reflects 2026 CMS-filed information. Verify details with the plan's Evidence of Coverage before enrolling. Contact a licensed Medicare agent for personalized guidance.</p>
      </div>
    `;
  }

  // ─── Problem 1: Interactive comparison tool (static page) ───────────────────
  const interactiveContainer = document.getElementById('plan-comparison-tool');
  if (interactiveContainer) {
    fetchPlans().then(plans => {
      // Extract unique states
      const states = [...new Set(plans.map(p => p.state))].filter(Boolean).sort();

      interactiveContainer.innerHTML = `
        <div class="comp-interactive">
          <div class="comp-fields">
            <label>State</label>
            <select id="comp-state">
              <option value="">Select a state...</option>
              ${states.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="comp-plan-selects" id="comp-plan-selects" style="display:none;">
            <div class="comp-fields">
              <label>Plan A</label>
              <select id="comp-plan-a"><option value="">Select Plan A...</option></select>
            </div>
            <div class="comp-fields">
              <label>Plan B</label>
              <select id="comp-plan-b"><option value="">Select Plan B...</option></select>
            </div>
          </div>
          <button id="comp-compare" style="display:none;">Compare Plans</button>
          <div id="comp-result"></div>
        </div>
      `;

      const stateSelect = document.getElementById('comp-state');
      const planSelects = document.getElementById('comp-plan-selects');
      const planASelect = document.getElementById('comp-plan-a');
      const planBSelect = document.getElementById('comp-plan-b');
      const compareBtn = document.getElementById('comp-compare');
      const resultDiv = document.getElementById('comp-result');

      stateSelect.addEventListener('change', function () {
        const state = this.value;
        if (!state) { planSelects.style.display = 'none'; compareBtn.style.display = 'none'; return; }
        const statePlans = plans.filter(p => p.state === state).sort((a, b) => a.name.localeCompare(b.name));
        const opts = statePlans.map(p => `<option value="${p.slug}">${p.name} (${p.carrier})</option>`).join('');
        planASelect.innerHTML = '<option value="">Select Plan A...</option>' + opts;
        planBSelect.innerHTML = '<option value="">Select Plan B...</option>' + opts;
        planSelects.style.display = 'block';
        compareBtn.style.display = 'none';
        resultDiv.innerHTML = '';
      });

      function checkReady() {
        compareBtn.style.display = (planASelect.value && planBSelect.value && planASelect.value !== planBSelect.value) ? 'block' : 'none';
      }
      planASelect.addEventListener('change', checkReady);
      planBSelect.addEventListener('change', checkReady);

      compareBtn.addEventListener('click', function () {
        const plan1 = plans.find(p => p.slug === planASelect.value);
        const plan2 = plans.find(p => p.slug === planBSelect.value);
        if (plan1 && plan2) renderComparison(plan1, plan2, resultDiv);
      });
    });
  }

  // ─── Problem 2: Auto-render on CMS comparison pages ─────────────────────────
  const cmsWrapper = document.querySelector('[data-plan-1]');
  if (cmsWrapper) {
    const slug1 = cmsWrapper.dataset.plan1;
    const slug2 = cmsWrapper.dataset.plan2;
    if (slug1 && slug2) {
      // Find or create result container
      let resultDiv = document.getElementById('comp-cms-result');
      if (!resultDiv) {
        resultDiv = document.createElement('div');
        resultDiv.id = 'comp-cms-result';
        cmsWrapper.parentNode.insertBefore(resultDiv, cmsWrapper.nextSibling);
      }
      fetchPlans().then(plans => {
        const plan1 = plans.find(p => p.slug === slug1);
        const plan2 = plans.find(p => p.slug === slug2);
        if (plan1 && plan2) {
          renderComparison(plan1, plan2, resultDiv);
        } else {
          resultDiv.innerHTML = '<p>Plan data not available. Please check back later.</p>';
          console.warn('RSA: Could not find plans:', slug1, slug2);
        }
      });
    }
  }

})();
