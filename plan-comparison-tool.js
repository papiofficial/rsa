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

document.addEventListener('DOMContentLoaded', function () {
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

    const BASE = 'https://www.restingsycamore.com/medicare';
    function link(href, text) {
      return href ? `<a href="${href}" style="color:inherit;text-decoration:underline;">${text}</a>` : text;
    }
    function cellVal(f, plan) {
      const v = f.key === 'star-rating' ? star(plan[f.key]) : fmt(plan[f.key]);
      if (f.key === 'carrier') return link(plan['carrier-slug'] ? `${BASE}/carriers/${plan['carrier-slug']}` : '', v);
      if (f.key === 'plan-type') return link(plan['plan-type-slug'] ? `${BASE}/plan-types/${plan['plan-type-slug']}` : '', v);
      if (f.key === 'state') return link(plan['state-slug'] ? `${BASE}/states/${plan['state-slug']}` : '', v);
      return v;
    }

    const rows = fields.map(f => {
      const isDiff = diffs.has(f.key);
      return `<tr class="${isDiff ? 'comp-diff' : ''}">
        <td class="comp-label">${f.label}</td>
        <td class="comp-val">${cellVal(f, plan1)}</td>
        <td class="comp-val">${cellVal(f, plan2)}</td>
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

    const planLink = (plan) => link(`${BASE}/plans/${plan.slug}`, plan.name);
    container.innerHTML = `
      <div class="comp-wrap">
        <div class="comp-table-wrap">
          <table class="comp-table">
            <thead>
              <tr>
                <th></th>
                <th class="comp-plan-name">${planLink(plan1)}</th>
                <th class="comp-plan-name">${planLink(plan2)}</th>
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

  // ─── Detect mode: auto-render (CMS pages) vs interactive (static page) ───────
  const interactiveContainer = document.getElementById('plan-comparison-tool');

  // Webflow currently wraps the comparison UI in a form. This tool is not a lead form.
  // Prevent dropdown/button interactions from submitting to Webflow Forms and emailing Peter.
  const selectorsForm = document.getElementById('selectors');
  if (selectorsForm) {
    selectorsForm.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    });
  }

  const presetWrapper = document.querySelector('[data-plan-1]');
  const slug1 = presetWrapper ? (presetWrapper.getAttribute('data-plan-1') || '') : '';
  const slug2 = presetWrapper ? (presetWrapper.getAttribute('data-plan-2') || '') : '';
  const isAutoMode = !!(slug1 && slug2);

  // ─── Problem 2: Auto-render on CMS comparison pages (data-plan-1 present) ───
  if (isAutoMode && interactiveContainer) {
    fetchPlans().then(plans => {
      const plan1 = plans.find(p => p.slug === slug1);
      const plan2 = plans.find(p => p.slug === slug2);
      if (plan1 && plan2) {
        renderComparison(plan1, plan2, interactiveContainer);
      } else {
        interactiveContainer.innerHTML = '<p style="color:#888">Plan data not found for this comparison.</p>';
        console.warn('RSA: Could not find plans:', slug1, slug2);
      }
    });
  }

  // ─── Problem 1: Interactive comparison tool (static page) ───────────────────
  if (!isAutoMode && interactiveContainer) {
    fetchPlans().then(plans => {
      // Show a real comparison on arrival. Users came here to compare, not to stare at empty controls.
      const states = [...new Set(plans.map(p => p.state))].filter(Boolean).sort();
      const defaultState = states.includes('Utah') ? 'Utah' : states[0];

      interactiveContainer.innerHTML = `
        <div class="comp-interactive">
          <p class="comp-helper">Showing a sample comparison. Change the state or either plan to update the table.</p>
          <div class="comp-fields">
            <label>State</label>
            <select id="comp-state">
              ${states.map(s => `<option value="${s}" ${s === defaultState ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="comp-plan-selects" id="comp-plan-selects">
            <div class="comp-fields">
              <label>Plan A</label>
              <select id="comp-plan-a"><option value="">Select Plan A...</option></select>
            </div>
            <div class="comp-fields">
              <label>Plan B</label>
              <select id="comp-plan-b"><option value="">Select Plan B...</option></select>
            </div>
          </div>
          <button id="comp-compare" type="button">Update Comparison</button>
          <div id="comp-result"></div>
        </div>
      `;

      const stateSelect = document.getElementById('comp-state');
      const planASelect = document.getElementById('comp-plan-a');
      const planBSelect = document.getElementById('comp-plan-b');
      const compareBtn = document.getElementById('comp-compare');
      const resultDiv = document.getElementById('comp-result');

      function plansForState(state) {
        return plans.filter(p => p.state === state).sort((a, b) => a.name.localeCompare(b.name));
      }

      function populatePlansForState(state) {
        const statePlans = plansForState(state);
        const opts = statePlans.map(p => `<option value="${p.slug}">${p.name} (${p.carrier})</option>`).join('');
        planASelect.innerHTML = opts;
        planBSelect.innerHTML = opts;
        if (statePlans[0]) planASelect.value = statePlans[0].slug;
        if (statePlans[1]) planBSelect.value = statePlans[1].slug;
        renderIfReady();
      }

      function renderIfReady() {
        const ready = planASelect.value && planBSelect.value && planASelect.value !== planBSelect.value;
        compareBtn.style.display = ready ? 'inline-block' : 'none';
        if (!ready) {
          resultDiv.innerHTML = '<p class="comp-empty">Choose two different plans to compare.</p>';
          return;
        }
        const plan1 = plans.find(p => p.slug === planASelect.value);
        const plan2 = plans.find(p => p.slug === planBSelect.value);
        if (plan1 && plan2) renderComparison(plan1, plan2, resultDiv);
      }

      stateSelect.addEventListener('change', function () {
        populatePlansForState(this.value);
      });
      planASelect.addEventListener('change', renderIfReady);
      planBSelect.addEventListener('change', renderIfReady);
      compareBtn.addEventListener('click', renderIfReady);

      populatePlansForState(defaultState);
    }).catch(err => {
      interactiveContainer.innerHTML = '<p style="color:#888">Plan comparison data could not be loaded. Please refresh the page or contact Resting Sycamore for help comparing plans.</p>';
      console.error('RSA: Plan comparison tool failed to load:', err);
    });
  }

});
