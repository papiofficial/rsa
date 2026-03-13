// STATE

// ============================================================
let filteredPlans = [...PLANS_DATA];
let selectedSlugs = [null, null];
const visibleSlots = 2;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  buildFilterOptions();
  readURLParams();       // sets selectedSlugs first
  populateDropdowns();   // then build dropdowns with exclusions already applied
  document.getElementById('highlight-diff-toggle').checked = true; // on by default
  renderComparison();
});

function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  const defaults = [
    'humana-value-choice-h7617-032-ppo',
    'aarp-medicare-advantage-from-uhc-ut-0001-ppo-h2001-017'
  ];
  let hasParams = false;
  ['plan1','plan2'].forEach((key, i) => {
    const slug = params.get(key);
    if (slug && PLANS_DATA.find(p => p.slug === slug)) {
      selectedSlugs[i] = slug;
      hasParams = true;
    }
  });
  if (!hasParams) {
    defaults.forEach((slug, i) => {
      if (PLANS_DATA.find(p => p.slug === slug)) selectedSlugs[i] = slug;
    });
  }
}

function updateURL() {
  const params = new URLSearchParams();
  selectedSlugs.forEach((slug, i) => {
    if (slug) params.set('plan' + (i+1), slug);
  });
  const url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  history.replaceState(null, '', url);
}

// ============================================================
// FILTER OPTIONS BUILD
// ============================================================
function buildFilterOptions() {
  // Counties
  const allCounties = new Set();
  PLANS_DATA.forEach(p => p.counties.forEach(c => allCounties.add(c)));
  const countySelect = document.getElementById('filter-county');
  [...allCounties].sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c + ' County';
    countySelect.appendChild(opt);
  });

  // Plan types
  const allTypes = [...new Set(PLANS_DATA.map(p => p.plan_type))].sort();
  const typeSelect = document.getElementById('filter-type');
  allTypes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    typeSelect.appendChild(opt);
  });

  // Carriers
  const allCarriers = [...new Set(PLANS_DATA.map(p => p.carrier))].sort();
  const carrierSelect = document.getElementById('filter-carrier');
  allCarriers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    carrierSelect.appendChild(opt);
  });

  document.getElementById('filter-county').addEventListener('change', applyFilters);
  document.getElementById('filter-type').addEventListener('change', applyFilters);
  document.getElementById('filter-carrier').addEventListener('change', applyFilters);
}

function applyFilters() {
  const county = document.getElementById('filter-county').value;
  const type = document.getElementById('filter-type').value;
  const carrier = document.getElementById('filter-carrier').value;

  filteredPlans = PLANS_DATA.filter(p => {
    if (county && !p.counties.includes(county)) return false;
    if (type && p.plan_type !== type) return false;
    if (carrier && p.carrier !== carrier) return false;
    return true;
  });

  populateDropdowns();
}

function clearFilters() {
  document.getElementById('filter-county').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-carrier').value = '';
  filteredPlans = [...PLANS_DATA];
  populateDropdowns();
}

// ============================================================
// DROPDOWNS
// ============================================================
function populateDropdowns() {
  for (let i = 0; i < 2; i++) {
    const sel = document.getElementById('plan-select-' + i);
    const current = selectedSlugs[i];
    sel.innerHTML = '<option value="">— Select a plan —</option>';

    // Group by carrier
    const byCarrier = {};
    filteredPlans.forEach(p => {
      if (!byCarrier[p.carrier]) byCarrier[p.carrier] = [];
      byCarrier[p.carrier].push(p);
    });

    // Slugs selected in OTHER slots (not this one)
    const otherSelected = selectedSlugs.filter((s, idx) => idx !== i && s);

    Object.keys(byCarrier).sort().forEach(carrier => {
      const group = document.createElement('optgroup');
      group.label = carrier;
      byCarrier[carrier].sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        if (otherSelected.includes(p.slug)) return; // already selected elsewhere
        const opt = document.createElement('option');
        opt.value = p.slug;
        opt.textContent = p.name;
        if (p.snp) opt.textContent += ' ⚠';
        group.appendChild(opt);
      });
      // Only append group if it has options
      if (group.children.length > 0) sel.appendChild(group);
    });

    if (current) sel.value = current;
    updateSlotStyle(i);
  }
}

function onPlanChange(i) {
  const sel = document.getElementById('plan-select-' + i);
  selectedSlugs[i] = sel.value || null;
  updateSlotStyle(i);
  populateDropdowns(); // refresh all dropdowns to remove/restore this plan from other slots
  updateURL();
  renderComparison();
}

function updateSlotStyle(i) {
  const slot = document.getElementById('slot-' + i);
  if (selectedSlugs[i]) slot.classList.add('has-plan');
  else slot.classList.remove('has-plan');
}

// ============================================================
// COMPARISON TABLE RENDER
// ============================================================
function renderComparison() {
  const active = selectedSlugs.map(s => s ? PLANS_DATA.find(p => p.slug === s) : null).filter(Boolean);
  const output = document.getElementById('comparison-output');

  if (active.length < 2) {
    output.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <h3>Select at least 2 plans to compare</h3>
        <p>Use the dropdowns above to pick plans. Filter by county, plan type, or carrier to narrow your options.</p>
      </div>`;
    document.getElementById('narrative-section').style.display = 'none';
    return;
  }

  const html = buildTableHTML(active);
  output.innerHTML = html;
  renderNarrative(active);
  document.getElementById('narrative-section').style.display = 'block';
  tagRowsBySection();
  markDifferences();
  // Re-apply active tab filter after re-render
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) applyTabFilter(activeTab.dataset.section);
}

function buildTableHTML(plans) {
  const n = plans.length;

  // Build header
  let thead = `<thead><tr>
    <th style="width:180px">Plan Details</th>`;
  plans.forEach(p => {
    thead += `<th class="plan-header">
      ${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.carrier)}" class="carrier-logo">` : ''}
      <div class="plan-header-name">${esc(p.name)}</div>
      <div class="plan-header-carrier">${esc(p.carrier)}</div>
      ${p.snp ? '<div class="plan-header-badge">⚠ SNP</div>' : ''}
      <a href="/contact" class="btn-compare-cta">Talk to an Agent →</a>
    </th>`;
  });
  thead += `</tr></thead>`;

  // Helper: highlight numeric values (lower=better for costs, higher=better for stars/benefits)
  function hlCells(vals, lowerBetter) {
    const nums = vals.map(v => typeof v === 'number' && !isNaN(v) ? v : null);
    const defined = nums.filter(v => v !== null);
    if (defined.length < 2) return vals.map(() => '');
    const min = Math.min(...defined);
    const max = Math.max(...defined);
    if (min === max) return vals.map(() => '');
    return nums.map(v => {
      if (v === null) return '';
      if (lowerBetter) return v === min ? 'hl-best' : v === max ? 'hl-worst' : '';
      else return v === max ? 'hl-best' : v === min ? 'hl-worst' : '';
    });
  }

  function row(label, sublabel, cells, classes) {
    let tr = `<tr class="data-row"><td>${esc(label)}`;
    if (sublabel) tr += `<span class="row-sublabel">${esc(sublabel)}</span>`;
    tr += `</td>`;
    cells.forEach((c, i) => {
      const cls = classes && classes[i] ? ' class="' + classes[i] + '"' : '';
      tr += `<td${cls}>${c}</td>`;
    });
    tr += `</tr>`;
    return tr;
  }

  function section(title) {
    let tr = `<tr class="section-header"><td>${title}</td>`;
    for (let i = 0; i < n; i++) tr += '<td></td>';
    tr += '</tr>';
    return tr;
  }

  function fmt$(val) {
    if (!val && val !== 0) return '<span class="text-muted">—</span>';
    return '$' + Number(val).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2});
  }

  function fmtCopay(str) {
    if (!str) return '<span class="text-muted">—</span>';
    return esc(str);
  }

  function stars(n) {
    if (n === null || n === undefined) return '<span class="stars-na">N/A</span>';
    const full = Math.floor(n);
    const empty = 5 - full;
    return `<span class="stars">${'★'.repeat(full)}${'☆'.repeat(empty)}</span> <small>(${n})</small>`;
  }

  function docLink(url, label) {
    if (!url) return '<span class="text-muted">—</span>';
    return `<a href="${esc(url)}" target="_blank" class="doc-link">📄 ${label}</a>`;
  }

  // Extract numeric copay for highlight comparison
  function numCopay(str) {
    if (!str) return null;
    const m = str.match(/\$?([\d,]+)/);
    return m ? parseFloat(m[1].replace(',','')) : null;
  }

  let tbody = '<tbody>';

  // COST
  tbody += section('COST');

  const premiums = plans.map(p => p.premium);
  const premCls = hlCells(premiums, true);
  tbody += row('Monthly Premium', null,
    plans.map(p => p.premium === 0 ? '<strong>$0</strong>' : fmt$(p.premium) + '/mo'),
    premCls
  );

  const moops = plans.map(p => p.moop);
  const moopCls = hlCells(moops, true);
  tbody += row('Max Out-of-Pocket', 'Most you\'d pay in a bad year',
    plans.map(p => p.moop ? fmt$(p.moop) : '<span class="text-muted">—</span>'),
    moopCls
  );

  const deds = plans.map(p => p.part_d_deductible);
  const dedCls = hlCells(deds, true);
  tbody += row('Part D Drug Deductible', null,
    plans.map(p => p.part_d_deductible > 0 ? fmt$(p.part_d_deductible) : '<strong class="text-green">$0</strong>'),
    dedCls
  );

  const partcP = plans.map(p => p.part_c_premium);
  const partcCls = hlCells(partcP, true);
  tbody += row('Part C Premium', null,
    plans.map(p => fmt$(p.part_c_premium)),
    partcCls
  );

  const partdP = plans.map(p => p.part_d_premium);
  const partdCls = hlCells(partdP, true);
  tbody += row('Part D Premium', null,
    plans.map(p => fmt$(p.part_d_premium)),
    partdCls
  );

  // COPAYS
  tbody += section('COPAYS');

  const pcCopays = plans.map(p => numCopay(p.primary_care_copay));
  const pcCls = hlCells(pcCopays, true);
  tbody += row('Primary Care Visit', null,
    plans.map(p => fmtCopay(p.primary_care_copay) || '<strong class="text-green">$0</strong>'),
    pcCls
  );

  const spCopays = plans.map(p => numCopay(p.specialist_copay));
  const spCls = hlCells(spCopays, true);
  tbody += row('Specialist Visit', null,
    plans.map(p => fmtCopay(p.specialist_copay)),
    spCls
  );

  const erCopays = plans.map(p => numCopay(p.er_copay));
  const erCls = hlCells(erCopays, true);
  tbody += row('Emergency Room', null,
    plans.map(p => fmtCopay(p.er_copay)),
    erCls
  );

  const ucCopays = plans.map(p => numCopay(p.urgent_care_copay));
  const ucCls = hlCells(ucCopays, true);
  tbody += row('Urgent Care', null,
    plans.map(p => fmtCopay(p.urgent_care_copay)),
    ucCls
  );

  const thCopays = plans.map(p => numCopay(p.telehealth_copay));
  const thCls = hlCells(thCopays, true);
  tbody += row('Telehealth', null,
    plans.map(p => fmtCopay(p.telehealth_copay)),
    thCls
  );

  // EXTRA BENEFITS
  tbody += section('EXTRA BENEFITS');

  const dentals = plans.map(p => p.dental_annual_max);
  const dentCls = hlCells(dentals, false);
  tbody += row('Dental Annual Maximum', null,
    plans.map(p => p.dental_annual_max > 0 ? fmt$(p.dental_annual_max) + '/yr' : '<span class="text-muted">Not covered</span>'),
    dentCls
  );

  const hearings = plans.map(p => p.hearing_aid_allowance);
  const hearCls = hlCells(hearings, false);
  tbody += row('Hearing Aid Allowance', null,
    plans.map(p => p.hearing_aid_allowance > 0 ? fmt$(p.hearing_aid_allowance) : '<span class="text-muted">Not covered</span>'),
    hearCls
  );

  tbody += row('Fitness Program', null,
    plans.map(p => p.fitness_program ? `<span class="badge-type">${esc(p.fitness_program)}</span>` : '<span class="text-muted">None</span>'),
    null
  );

  tbody += row('Transportation', 'trips/year',
    plans.map(p => {
      if (!p.transportation_trips || p.transportation_trips === 'Not covered') return '<span class="text-muted">Not covered</span>';
      return esc(p.transportation_trips);
    }),
    null
  );

  tbody += row('OTC Credit', null,
    plans.map(p => {
      const amt = p.otc_amount ? '$' + p.otc_amount : '';
      const freq = p.otc_frequency || '';
      if (!amt && !freq) return '<span class="text-muted">—</span>';
      return [amt, freq].filter(Boolean).join(' ').trim() || '<span class="text-muted">—</span>';
    }),
    null
  );

  // COVERAGE & TYPE
  tbody += section('COVERAGE & TYPE');

  tbody += row('Plan Type', null,
    plans.map(p => `<span class="badge-type">${esc(p.plan_type)}</span>`),
    null
  );

  tbody += row('Includes Drug Coverage', null,
    plans.map(p => p.offers_part_d
      ? '<span style="color:var(--green);font-weight:600">✓ Yes</span>'
      : '<span style="color:#94a3b8">No</span>'),
    null
  );

  tbody += row('Special Needs Plan', null,
    plans.map(p => p.snp
      ? '<span class="snp-yes">⚠ Yes — SNP</span>'
      : '<span style="color:var(--muted)">No</span>'),
    null
  );

  // STAR RATINGS
  tbody += section('STAR RATINGS');

  const overallStars = plans.map(p => p.overall_stars);
  const osCls = hlCells(overallStars, false);
  tbody += row('Overall CMS Rating', null,
    plans.map(p => stars(p.overall_stars)),
    osCls
  );

  const partcStars = plans.map(p => p.part_c_stars);
  const pcsCls = hlCells(partcStars, false);
  tbody += row('Part C Rating', null,
    plans.map(p => stars(p.part_c_stars)),
    pcsCls
  );

  const partdStars = plans.map(p => p.part_d_stars);
  const pdsCls = hlCells(partdStars, false);
  tbody += row('Part D Rating', null,
    plans.map(p => stars(p.part_d_stars)),
    pdsCls
  );

  // DOCUMENTS
  tbody += section('DOCUMENTS');

  tbody += row('Summary of Benefits', null,
    plans.map(p => docLink(p.summary_of_benefits_url, 'View SOB')),
    null
  );

  tbody += row('Evidence of Coverage', null,
    plans.map(p => docLink(p.evidence_of_coverage_url, 'View EOC')),
    null
  );

  tbody += '</tbody>';

  return `<div class="comparison-table-wrap"><table class="comp-table">${thead}${tbody}</table></div>`;
}

// ============================================================
// NARRATIVE
// ============================================================
function renderNarrative(plans) {
  if (plans.length < 2) return;
  const content = document.getElementById('narrative-content');
  const sentences = [];

  const pName = i => `<strong>${esc(plans[i].name.replace(' (PPO)', '').replace(' (HMO)', '').replace(' (HMO-POS)', ''))}</strong>`;

  // For 2-plan comparison use plan A/B; for more just do highlights
  const a = plans[0];
  const b = plans[1];

  // Premium
  if (Math.abs(a.premium - b.premium) > 0) {
    if (a.premium === 0 && b.premium > 0) {
      sentences.push(`${pName(0)} has no monthly premium. ${pName(1)} costs $${b.premium}/mo.`);
    } else if (b.premium === 0 && a.premium > 0) {
      sentences.push(`${pName(1)} has no monthly premium. ${pName(0)} costs $${a.premium}/mo.`);
    } else {
      const lower = a.premium < b.premium ? 0 : 1;
      const higher = 1 - lower;
      sentences.push(`${pName(lower)}'s premium is $${plans[lower].premium}/mo — $${Math.abs(a.premium - b.premium).toFixed(2)} less per month than ${pName(higher)}'s $${plans[higher].premium}/mo.`);
    }
  }

  // MOOP
  if (a.moop && b.moop && Math.abs(a.moop - b.moop) > 500) {
    const lower = a.moop < b.moop ? 0 : 1;
    const higher = 1 - lower;
    const diff = Math.abs(a.moop - b.moop).toLocaleString();
    sentences.push(`${pName(lower)}'s max out-of-pocket is $${plans[lower].moop.toLocaleString()} — $${diff} less than ${pName(higher)}'s $${plans[higher].moop.toLocaleString()}.`);
  }

  // Dental
  const bothHaveDental = a.dental_annual_max > 0 && b.dental_annual_max > 0;
  const onlyADental = a.dental_annual_max > 0 && b.dental_annual_max === 0;
  const onlyBDental = b.dental_annual_max > 0 && a.dental_annual_max === 0;
  if (onlyADental) {
    sentences.push(`${pName(0)} covers dental up to $${a.dental_annual_max.toLocaleString()}/year. ${pName(1)} does not include dental coverage.`);
  } else if (onlyBDental) {
    sentences.push(`${pName(1)} covers dental up to $${b.dental_annual_max.toLocaleString()}/year. ${pName(0)} does not include dental coverage.`);
  } else if (bothHaveDental && Math.abs(a.dental_annual_max - b.dental_annual_max) > 200) {
    const higher = a.dental_annual_max > b.dental_annual_max ? 0 : 1;
    const lower = 1 - higher;
    sentences.push(`Both plans include dental. ${pName(higher)} offers a higher annual maximum ($${plans[higher].dental_annual_max.toLocaleString()} vs $${plans[lower].dental_annual_max.toLocaleString()}).`);
  }

  // Hearing
  if (Math.abs(a.hearing_aid_allowance - b.hearing_aid_allowance) > 0) {
    const higher = a.hearing_aid_allowance >= b.hearing_aid_allowance ? 0 : 1;
    const lower = 1 - higher;
    if (plans[lower].hearing_aid_allowance === 0) {
      sentences.push(`${pName(higher)} includes a $${plans[higher].hearing_aid_allowance} hearing aid allowance. ${pName(lower)} does not cover hearing aids.`);
    } else {
      sentences.push(`${pName(higher)} has a larger hearing aid allowance ($${plans[higher].hearing_aid_allowance} vs $${plans[lower].hearing_aid_allowance}).`);
    }
  }

  // Star ratings
  if (a.overall_stars && b.overall_stars && Math.abs(a.overall_stars - b.overall_stars) >= 1) {
    const higher = a.overall_stars >= b.overall_stars ? 0 : 1;
    const lower = 1 - higher;
    sentences.push(`${pName(higher)} has a higher overall CMS star rating (${plans[higher].overall_stars}★ vs ${plans[lower].overall_stars}★).`);
  }

  // HMO vs PPO
  const aIsPPO = a.plan_type.includes('PPO');
  const bIsPPO = b.plan_type.includes('PPO');
  const aIsHMO = a.plan_type.includes('HMO');
  const bIsHMO = b.plan_type.includes('HMO');
  if ((aIsPPO && bIsHMO) || (aIsHMO && bIsPPO)) {
    const ppoIdx = aIsPPO ? 0 : 1;
    const hmoIdx = 1 - ppoIdx;
    sentences.push(`${pName(ppoIdx)} is a ${plans[ppoIdx].plan_type}, offering more flexibility to see out-of-network providers without a referral. ${pName(hmoIdx)} is an HMO and typically requires referrals for specialists.`);
  }

  // SNP flags
  plans.forEach((p, i) => {
    if (p.snp) {
      sentences.push(`Note: ${pName(i)} is a Special Needs Plan (SNP) with eligibility requirements — not all Medicare beneficiaries qualify.`);
    }
  });

  // Drug coverage
  const aHasDrugs = a.offers_part_d;
  const bHasDrugs = b.offers_part_d;
  if (aHasDrugs !== bHasDrugs) {
    const hasDrug = aHasDrugs ? 0 : 1;
    const noDrug = 1 - hasDrug;
    sentences.push(`${pName(hasDrug)} includes Part D drug coverage. ${pName(noDrug)} does not — you'd need a separate Part D plan if you choose it.`);
  }

  if (sentences.length === 0) {
    sentences.push('These plans are very similar. Review the documents above for full details or call a licensed agent for personalized guidance.');
  }

  content.innerHTML = sentences.map(s => `<p>${s}</p>`).join('');
}

// ============================================================
// HIGHLIGHT DIFFERENCES
// ============================================================
function markDifferences() {
  const rows = document.querySelectorAll('table.comp-table tbody tr');
  rows.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td:not(.row-label)'));
    // Skip section header rows (they only have 1 meaningful cell per plan, all empty)
    const dataCells = cells.filter(td => !tr.classList.contains('section-header'));
    if (dataCells.length < 2) return;
    const vals = dataCells.map(td => td.textContent.trim());
    const allSame = vals.every(v => v === vals[0]);
    tr.classList.toggle('has-diff', !allSame);
  });
  applyHighlight();
}

function applyHighlight() {
  const on = document.getElementById('highlight-diff-toggle')?.checked;
  document.querySelectorAll('tr.has-diff').forEach(tr => {
    tr.querySelectorAll('td').forEach(td => {
      td.style.borderLeft = on ? '3px solid #f59e0b' : '';
      td.style.backgroundColor = on ? '#fffbeb' : '';
    });
  });
}

// ============================================================
// SECTION TABS
// ============================================================
function tagRowsBySection() {
  const sectionMap = {
    'COST': 'cost',
    'COPAYS': 'copays',
    'EXTRA BENEFITS': 'extras',
    'COVERAGE': 'coverage',
    'STAR RATINGS': 'ratings',
    'DOCUMENTS': 'ratings'
  };

  let currentSection = 'all';
  document.querySelectorAll('table.comp-table tr').forEach(tr => {
    if (tr.classList.contains('section-header')) {
      // First cell text determines which section this is
      const text = (tr.cells[0]?.textContent || '').trim().toUpperCase();
      for (const [key, val] of Object.entries(sectionMap)) {
        if (text.includes(key)) {
          currentSection = val;
          break;
        }
      }
    }
    tr.dataset.section = currentSection;
  });
}

function applyTabFilter(section) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.section === section));
  document.querySelectorAll('table.comp-table tr').forEach(tr => {
    if (section === 'all') {
      tr.style.display = '';
    } else {
      tr.style.display = (tr.dataset.section === section || tr.classList.contains('comp-header')) ? '' : 'none';
    }
  });
}

// Tab click handlers (set up once; work on dynamically rendered table via event delegation)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('section-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (tab) applyTabFilter(tab.dataset.section);
  });
  document.getElementById('highlight-diff-toggle')?.addEventListener('change', applyHighlight);
});

// ============================================================
// UTILS
// ============================================================
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}