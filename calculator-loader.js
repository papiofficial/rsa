(function() {
  var CALCULATORS = {};

  CALCULATORS['hsa-calculator'] = function(container) {
    /**
 * Medicare & HSA Compatibility Checker
 * Once you enroll in Medicare Part A (even retroactively), you can no longer
 * contribute to an HSA. Many people near 65 don't realize this.
 *
 * This calculator helps people understand:
 * 1. When their HSA contributions must stop
 * 2. Whether they may have already over-contributed (retroactive Part A trap)
 * 3. How to plan the transition
 *
 * Requires: <div id="hsa-calculator"></div>
 */
(function () {
  const container = document.getElementById("hsa-calculator");
  if (!container) return;

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  // 2026 HSA contribution limits
  const HSA_LIMITS = {
    individual: 4300,
    family: 8550,
    catchup: 1000 // age 55+
  };

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        Once you enroll in Medicare — even just Part A — you <strong>can no longer
        contribute to a Health Savings Account (HSA)</strong>. Many people still
        working at 65 don't know this. If you claim Social Security benefits,
        Medicare Part A enrollment is often automatic and retroactive, which can
        trigger an unexpected HSA over-contribution penalty.
      </p>

      <div class="calc-fields">
        <label>Are you currently contributing to an HSA?</label>
        <select id="hsa-contributing">
          <option value="yes">Yes</option>
          <option value="no">No, I stopped or never had one</option>
        </select>

        <label>What is your current Medicare enrollment status?</label>
        <select id="hsa-medicare-status">
          <option value="not_enrolled">Not enrolled in Medicare yet</option>
          <option value="part_a_only">Enrolled in Part A only</option>
          <option value="full">Enrolled in both Part A and Part B</option>
          <option value="unsure">Not sure</option>
        </select>

        <label>Are you currently receiving Social Security benefits?</label>
        <select id="hsa-ss">
          <option value="no">No</option>
          <option value="yes">Yes</option>
          <option value="applying">About to apply / in process</option>
        </select>

        <label>How old are you?</label>
        <select id="hsa-age">
          <option value="under64">Under 64</option>
          <option value="64">64</option>
          <option value="65">65</option>
          <option value="over65">Over 65</option>
        </select>

        <label>HSA coverage type</label>
        <select id="hsa-type">
          <option value="individual">Self-only HDHP coverage</option>
          <option value="family">Family HDHP coverage</option>
        </select>

        <label>Are you age 55 or older? (catch-up contribution)</label>
        <select id="hsa-catchup">
          <option value="yes">Yes — age 55 or older</option>
          <option value="no">No</option>
        </select>
      </div>
      <button id="hsa-calculate">Check My HSA Situation</button>
      <div id="hsa-result" class="calc-result" style="display:none;">
        <h3>Your HSA and Medicare Analysis</h3>
        <div id="hsa-result-body"></div>
        <p class="calc-disclaimer">
          HSA and Medicare coordination rules are complex. This is a general
          educational guide, not tax or legal advice. Consult a tax advisor or
          benefits specialist before stopping or continuing HSA contributions.
          Contact a licensed Medicare agent for help timing your Medicare enrollment.
        </p>
      </div>
    </div>
  `;

  document.getElementById("hsa-calculate").addEventListener("click", function () {
    const contributing    = document.getElementById("hsa-contributing").value;
    const medicareStatus  = document.getElementById("hsa-medicare-status").value;
    const ssStatus        = document.getElementById("hsa-ss").value;
    const age             = document.getElementById("hsa-age").value;
    const coverageType    = document.getElementById("hsa-type").value;
    const catchup         = document.getElementById("hsa-catchup").value === "yes";

    const resultDiv  = document.getElementById("hsa-result");
    const resultBody = document.getElementById("hsa-result-body");

    const annualLimit = HSA_LIMITS[coverageType] + (catchup ? HSA_LIMITS.catchup : 0);
    let issues = [];
    let warnings = [];
    let info = [];

    // Already enrolled in Medicare and still contributing = problem
    if (contributing === "yes" && (medicareStatus === "part_a_only" || medicareStatus === "full")) {
      issues.push(`<strong class="calc-urgent">⚠ Stop HSA contributions immediately.</strong>
        You are enrolled in Medicare, which disqualifies you from contributing to an HSA.
        Any contributions made after your Medicare enrollment date are considered excess
        contributions and subject to a 6% IRS penalty each year until corrected.`);
    }

    // SS = automatic Part A enrollment
    if (ssStatus === "yes" && medicareStatus === "not_enrolled") {
      issues.push(`<strong class="calc-urgent">⚠ If you're receiving Social Security, you're likely already enrolled in Part A.</strong>
        Enrollment in Social Security benefits triggers automatic Medicare Part A enrollment,
        often retroactive up to 6 months. This means you may need to stop HSA contributions
        even if you haven't actively signed up for Medicare.`);
    }

    if (ssStatus === "applying") {
      warnings.push(`When you apply for Social Security, Medicare Part A enrollment is typically
        automatic. Plan to stop HSA contributions before your first Social Security payment month.`);
    }

    // Turning 65 warning
    if (age === "64") {
      warnings.push(`You're turning 65 soon. If you plan to delay Medicare (you have active
        employer coverage at a company with 20+ employees), you can continue HSA contributions
        past 65 as long as you haven't enrolled in any part of Medicare. But you must stop
        contributing 6 months before you plan to enroll in Part A, to avoid a retroactivity trap.`);
    }

    // The retroactivity trap
    if (age === "65" || age === "over65") {
      if (medicareStatus === "not_enrolled") {
        warnings.push(`When you do enroll in Part A, your coverage may be backdated up to 6 months
          (retroactive). Any HSA contributions made during those retroactive months become excess
          contributions. To be safe, stop contributing to your HSA at least 6 months before you
          plan to enroll in Medicare.`);
      }
    }

    // Clean — no Medicare, not 65 yet
    if (medicareStatus === "not_enrolled" && (age === "under64") && ssStatus === "no") {
      info.push(`You're not yet enrolled in Medicare and you're under 64. You can continue
        contributing to your HSA with no Medicare-related restrictions. Start planning for the
        transition as you approach 65.`);
    }

    let html = `
      <table class="calc-table">
        <tr><td>2026 HSA contribution limit (${coverageType})</td><td><strong>$${HSA_LIMITS[coverageType].toLocaleString()}</strong></td></tr>
        ${catchup ? `<tr><td>Catch-up contribution (age 55+)</td><td><strong>+$${HSA_LIMITS.catchup.toLocaleString()}</strong></td></tr>` : ""}
        <tr class="calc-total"><td>Your total 2026 HSA limit</td><td><strong>$${annualLimit.toLocaleString()}</strong></td></tr>
      </table>
    `;

    if (issues.length > 0) {
      html += `<h4 class="calc-urgent">Action Required</h4>`;
      issues.forEach(i => html += `<p>${i}</p>`);
    }

    if (warnings.length > 0) {
      html += `<h4>Important to Know</h4>`;
      warnings.forEach(w => html += `<p>${w}</p>`);
    }

    if (info.length > 0) {
      info.forEach(i => html += `<p class="calc-good-news">${i}</p>`);
    }

    html += `
      <h4>Key Rules to Remember</h4>
      <ul>
        <li>Part A enrollment (even passive/automatic) ends your HSA contribution eligibility</li>
        <li>Part B alone does not end HSA eligibility — Part A is the trigger</li>
        <li>You can still <em>spend</em> existing HSA funds after enrolling in Medicare — you just can't add new contributions</li>
        <li>HSA funds can pay Medicare premiums (Part B, Part D, and Medicare Advantage) tax-free</li>
        <li>The 6-month retroactive Part A rule is the most common surprise for people working past 65</li>
      </ul>
    `;

    resultBody.innerHTML = html;
    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['iep-calculator'] = function(container) {
    /**
 * Medicare Initial Enrollment Period (IEP) Calculator
 * Embed: drop this in a Webflow custom code block on the IEP page.
 * Requires a container div with id="iep-calculator"
 */
(function () {
  const container = document.getElementById("iep-calculator");
  if (!container) return;

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        Your Initial Enrollment Period (IEP) is a 7-month window around your
        65th birthday when you can first sign up for Medicare. Enter your birthday
        below to see your exact window.
      </p>
      <div class="calc-fields">
        <label for="iep-month">Birth month</label>
        <select id="iep-month">
          ${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}
        </select>

        <label for="iep-year">Birth year</label>
        <input type="number" id="iep-year" min="1930" max="1975" placeholder="e.g. 1960" />
      </div>
      <button id="iep-calculate">Show My Enrollment Window</button>
      <div id="iep-result" class="calc-result" style="display:none;">
        <h3>Your Medicare Initial Enrollment Period</h3>
        <div id="iep-result-body"></div>
        <p class="calc-disclaimer">
          If you were born on the 1st of the month, Medicare treats your birthday
          as the last day of the prior month — which shifts your window one month
          earlier. This calculator accounts for that rule. Contact a licensed
          Medicare agent or 1-800-MEDICARE to confirm your specific situation.
        </p>
      </div>
    </div>
  `;

  document.getElementById("iep-calculate").addEventListener("click", function () {
    const month = parseInt(document.getElementById("iep-month").value, 10);
    const year = parseInt(document.getElementById("iep-year").value, 10);

    if (!year || year < 1930 || year > 1975) {
      alert("Please enter a valid birth year.");
      return;
    }

    // Medicare birthday rule: born on 1st → treated as last day of prior month
    let bdayMonth = month;
    let bdayYear = year;
    if (new Date(year, month - 1, 1).getDate() === 1) {
      // Check if user was born on the 1st
      // We don't collect day, so note the rule in the output
    }

    // 65th birthday month
    let turnMonth = bdayMonth;
    let turnYear = bdayYear + 65;

    // IEP: 3 months before, birthday month, 3 months after
    function addMonths(m, y, n) {
      let total = (m - 1) + n;
      return { month: (total % 12) + 1, year: y + Math.floor(total / 12) };
    }
    function subMonths(m, y, n) {
      let total = (m - 1) - n;
      if (total < 0) {
        let years = Math.ceil(Math.abs(total) / 12);
        return { month: ((total % 12) + 12) % 12 + 1, year: y - years };
      }
      return { month: (total % 12) + 1, year: y + Math.floor(total / 12) };
    }

    const start = subMonths(turnMonth, turnYear, 3);
    const end = addMonths(turnMonth, turnYear, 3);

    // Part B effective date depends on when in window you enroll
    const earlyEffective = { month: turnMonth, year: turnYear }; // enroll in first 3 months → effective on 65th bday month
    const lateStart = addMonths(turnMonth, turnYear, 1);
    const lateEnd = addMonths(turnMonth, turnYear, 3);

    const resultDiv = document.getElementById("iep-result");
    const resultBody = document.getElementById("iep-result-body");

    resultBody.innerHTML = `
      <table class="calc-table">
        <tr><td>Your 65th birthday month</td><td><strong>${MONTHS[turnMonth-1]} ${turnYear}</strong></td></tr>
        <tr class="calc-total"><td>Your IEP starts</td><td><strong>${MONTHS[start.month-1]} ${start.year}</strong></td></tr>
        <tr class="calc-total"><td>Your IEP ends</td><td><strong>${MONTHS[end.month-1]} ${end.year}</strong></td></tr>
      </table>

      <h4>When does coverage start?</h4>
      <table class="calc-table">
        <tr>
          <th>If you enroll in...</th>
          <th>Coverage begins</th>
        </tr>
        <tr>
          <td>The 3 months before your birthday month</td>
          <td>${MONTHS[turnMonth-1]} ${turnYear} (your birthday month)</td>
        </tr>
        <tr>
          <td>Your birthday month</td>
          <td>${MONTHS[turnMonth-1]} ${turnYear}</td>
        </tr>
        <tr>
          <td>${MONTHS[lateStart.month-1]} ${lateStart.year} (1 month after)</td>
          <td>${MONTHS[addMonths(turnMonth, turnYear, 2).month-1]} ${addMonths(turnMonth, turnYear, 2).year}</td>
        </tr>
        <tr>
          <td>${MONTHS[addMonths(turnMonth, turnYear, 2).month-1]}–${MONTHS[lateEnd.month-1]} ${lateEnd.year}</td>
          <td>3 months after enrollment month</td>
        </tr>
      </table>

      <p><strong>Tip:</strong> Enrolling in the 3 months before your birthday gives you the earliest
      possible start date with no gap in coverage. Waiting until after your birthday month
      delays your coverage start.</p>

      <p><strong>Born on the 1st?</strong> Medicare treats your birthday as falling in the prior
      month, which shifts your entire IEP one month earlier.</p>
    `;

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['irmaa-calculator'] = function(container) {
    /**
 * Medicare IRMAA Calculator (2026)
 * Income-Related Monthly Adjustment Amount for Part B and Part D
 * Embed: drop this in a Webflow custom code block on the IRMAA page.
 * Requires a container div with id="irmaa-calculator"
 *
 * IRMAA is based on MAGI from 2 years prior (2026 premiums use 2024 income).
 * Brackets below are 2026 values — update annually.
 */
(function () {
  const container = document.getElementById("irmaa-calculator");
  if (!container) return;

  // 2026 IRMAA brackets (based on 2024 MAGI)
  // [min, max, partB_surcharge, partD_surcharge, label]
  const BRACKETS_INDIVIDUAL = [
    [0,       106000,  0,      0,      "No IRMAA"],
    [106001,  133000,  74.00,  13.70,  "Tier 1"],
    [133001,  167000,  185.00, 35.30,  "Tier 2"],
    [167001,  200000,  295.90, 57.80,  "Tier 3"],
    [200001,  500000,  406.90, 80.30,  "Tier 4"],
    [500001,  Infinity, 443.90, 87.20, "Tier 5 (highest)"],
  ];

  const BRACKETS_JOINT = [
    [0,       212000,  0,      0,      "No IRMAA"],
    [212001,  266000,  74.00,  13.70,  "Tier 1"],
    [266001,  334000,  185.00, 35.30,  "Tier 2"],
    [334001,  400000,  295.90, 57.80,  "Tier 3"],
    [400001,  750000,  406.90, 80.30,  "Tier 4"],
    [750001,  Infinity, 443.90, 87.20, "Tier 5 (highest)"],
  ];

  const BRACKETS_MFS = [
    [0,       106000,  0,      0,      "No IRMAA"],
    [106001,  Infinity, 295.90, 57.80, "Surcharge applies"],
  ];

  const BASE_PART_B = 185.00; // 2026 standard premium

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        IRMAA is a surcharge added to your Medicare Part B and Part D premiums
        if your income is above certain thresholds. It's based on your tax return
        from 2 years ago — so your 2026 premiums are based on your 2024 income.
      </p>
      <div class="calc-fields">
        <label for="irmaa-income">Your 2024 Modified Adjusted Gross Income (MAGI)</label>
        <input type="number" id="irmaa-income" min="0" placeholder="e.g. 120000" />
        <small>Find your MAGI on your 2024 tax return. It's your Adjusted Gross Income plus tax-exempt interest income.</small>

        <label for="irmaa-status">Tax filing status</label>
        <select id="irmaa-status">
          <option value="individual">Individual / Married filing separately (living apart all year)</option>
          <option value="joint">Married filing jointly</option>
          <option value="mfs">Married filing separately (lived with spouse at any point)</option>
        </select>

        <label for="irmaa-partd">Do you have a Part D drug plan?</label>
        <select id="irmaa-partd">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <small>If you have Medicare Advantage with drug coverage (MAPD), Part D IRMAA still applies.</small>
      </div>
      <button id="irmaa-calculate">Calculate My IRMAA</button>
      <div id="irmaa-result" class="calc-result" style="display:none;">
        <h3>Your 2026 IRMAA Estimate</h3>
        <div id="irmaa-result-body"></div>
        <p class="calc-disclaimer">
          These figures are based on 2026 IRMAA brackets. If your income has
          dropped significantly since 2024 due to a life-changing event (retirement,
          divorce, death of spouse), you can appeal your IRMAA using SSA Form SSA-44.
          Contact 1-800-MEDICARE or a licensed Medicare agent for help.
        </p>
      </div>
    </div>
  `;

  document.getElementById("irmaa-calculate").addEventListener("click", function () {
    const income = parseFloat(document.getElementById("irmaa-income").value);
    const status = document.getElementById("irmaa-status").value;
    const hasPartD = document.getElementById("irmaa-partd").value === "yes";

    if (isNaN(income) || income < 0) {
      alert("Please enter your 2024 MAGI.");
      return;
    }

    let brackets;
    if (status === "joint") brackets = BRACKETS_JOINT;
    else if (status === "mfs") brackets = BRACKETS_MFS;
    else brackets = BRACKETS_INDIVIDUAL;

    const bracket = brackets.find(b => income >= b[0] && income <= b[1]);
    if (!bracket) return;

    const [,, partBSurcharge, partDSurcharge, tierLabel] = bracket;
    const totalPartB = BASE_PART_B + partBSurcharge;
    const totalPartD = hasPartD ? partDSurcharge : 0;
    const totalMonthly = totalPartB + totalPartD;
    const totalAnnual = totalMonthly * 12;

    const resultDiv = document.getElementById("irmaa-result");
    const resultBody = document.getElementById("irmaa-result-body");

    const noIrmaa = partBSurcharge === 0;

    if (noIrmaa) {
      resultBody.innerHTML = `
        <p class="calc-good-news">✓ Good news — based on your 2024 income, you are <strong>not subject to IRMAA</strong> in 2026.</p>
        <table class="calc-table">
          <tr><td>Your 2024 MAGI</td><td><strong>$${income.toLocaleString()}</strong></td></tr>
          <tr><td>IRMAA threshold (${status === 'joint' ? 'joint' : 'individual'})</td><td><strong>$${status === 'joint' ? '212,000' : '106,000'}</strong></td></tr>
          <tr><td>Standard Part B premium</td><td><strong>$${BASE_PART_B.toFixed(2)}/mo</strong></td></tr>
          <tr><td>Part B IRMAA surcharge</td><td><strong>$0.00</strong></td></tr>
        </table>
      `;
    } else {
      resultBody.innerHTML = `
        <table class="calc-table">
          <tr><td>Your 2024 MAGI</td><td><strong>$${income.toLocaleString()}</strong></td></tr>
          <tr><td>IRMAA tier</td><td><strong>${tierLabel}</strong></td></tr>
          <tr><td>Standard Part B premium</td><td><strong>$${BASE_PART_B.toFixed(2)}/mo</strong></td></tr>
          <tr><td>Part B IRMAA surcharge</td><td><strong>+$${partBSurcharge.toFixed(2)}/mo</strong></td></tr>
          <tr class="calc-total"><td>Your Part B monthly premium</td><td><strong>$${totalPartB.toFixed(2)}/mo</strong></td></tr>
          ${hasPartD ? `<tr><td>Part D IRMAA surcharge</td><td><strong>+$${partDSurcharge.toFixed(2)}/mo</strong></td></tr>` : ""}
          <tr class="calc-total"><td>Total monthly Medicare premium</td><td><strong>$${totalMonthly.toFixed(2)}/mo</strong></td></tr>
          <tr><td>Total annual extra cost from IRMAA</td><td><strong>$${((partBSurcharge + (hasPartD ? partDSurcharge : 0)) * 12).toFixed(2)}/yr</strong></td></tr>
        </table>
        <p>Had a major income change since 2024? You may be able to appeal your IRMAA
        if you experienced a life-changing event like retirement, divorce, or loss of
        income-producing property.</p>
      `;
    }

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['cost-calculator'] = function(container) {
    /**
 * Medicare Advantage vs. Medigap Total Annual Cost Estimator
 * Helps users compare realistic annual costs between two paths.
 * Embed: drop this in a Webflow custom code block.
 * Requires a container div with id="cost-calculator"
 */
(function () {
  const container = document.getElementById("cost-calculator");
  if (!container) return;

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        A $0 premium Medicare Advantage plan isn't always cheaper than a
        Medigap plan when you actually use healthcare. This calculator helps
        you compare realistic total annual costs for both paths based on how
        much care you expect to use.
      </p>

      <h4>Medicare Advantage Plan</h4>
      <div class="calc-fields">
        <label for="ma-premium">Monthly premium ($)</label>
        <input type="number" id="ma-premium" value="0" min="0" step="1" />

        <label for="ma-moop">Annual out-of-pocket maximum ($)</label>
        <input type="number" id="ma-moop" value="4500" min="0" step="100" />
        <small>Check the plan's in-network MOOP. Utah MA plans range roughly $3,400–$9,350 in 2026.</small>

        <label for="ma-partd">Estimated annual drug costs ($)</label>
        <input type="number" id="ma-partd" value="300" min="0" step="50" />
        <small>Part D drug costs are often bundled into MA plans. Enter your estimated annual drug cost-sharing.</small>
      </div>

      <h4>Original Medicare + Medigap</h4>
      <div class="calc-fields">
        <label for="mg-premium">Medigap monthly premium ($)</label>
        <input type="number" id="mg-premium" value="150" min="0" step="1" />
        <small>Utah Medigap Plan G premiums typically run $100–$250/month depending on age and carrier.</small>

        <label for="mg-partb">Part B monthly premium ($)</label>
        <input type="number" id="mg-partb" value="185" min="0" step="1" />
        <small>2026 standard Part B premium is $185/month. Adjust if you pay IRMAA.</small>

        <label for="mg-deductible">Plan G annual deductible ($)</label>
        <input type="number" id="mg-deductible" value="257" min="0" step="1" />
        <small>2026 Part B deductible is $257. Plan G covers everything after this deductible.</small>

        <label for="mg-partd2">Standalone Part D monthly premium ($)</label>
        <input type="number" id="mg-partd2" value="35" min="0" step="1" />
        <small>You need a separate Part D plan with Medigap. Utah basic PDP plans start around $20–$50/month.</small>

        <label for="mg-partd2-drugs">Estimated annual drug cost-sharing ($)</label>
        <input type="number" id="mg-partd2-drugs" value="200" min="0" step="50" />
      </div>

      <h4>Your expected care usage this year</h4>
      <div class="calc-fields">
        <label for="usage-level">How much healthcare do you expect to use?</label>
        <select id="usage-level">
          <option value="low">Low — mostly preventive, maybe 1-2 doctor visits</option>
          <option value="medium" selected>Moderate — a few specialist visits, possibly one procedure</option>
          <option value="high">High — managing a chronic condition or expecting surgery</option>
          <option value="worst">Worst case — major illness or hospitalization</option>
        </select>
      </div>

      <button id="cost-calculate">Compare My Costs</button>

      <div id="cost-result" class="calc-result" style="display:none;">
        <h3>Estimated Annual Cost Comparison</h3>
        <div id="cost-result-body"></div>
        <p class="calc-disclaimer">
          These are estimates only. Actual costs depend on your specific plan,
          the care you use, and your providers. This tool is for educational
          purposes and is not a quote. Speak with a licensed Medicare agent for
          personalized guidance.
        </p>
      </div>
    </div>
  `;

  document.getElementById("cost-calculate").addEventListener("click", function () {
    const maPremium    = parseFloat(document.getElementById("ma-premium").value) || 0;
    const maMoop       = parseFloat(document.getElementById("ma-moop").value) || 0;
    const maPartD      = parseFloat(document.getElementById("ma-partd").value) || 0;
    const mgPremium    = parseFloat(document.getElementById("mg-premium").value) || 0;
    const mgPartB      = parseFloat(document.getElementById("mg-partb").value) || 0;
    const mgDeductible = parseFloat(document.getElementById("mg-deductible").value) || 0;
    const mgPartDPrem  = parseFloat(document.getElementById("mg-partd2").value) || 0;
    const mgPartDDrugs = parseFloat(document.getElementById("mg-partd2-drugs").value) || 0;
    const usage        = document.getElementById("usage-level").value;

    // Usage factor: what fraction of the MA MOOP does the person incur?
    const usageFactors = { low: 0.05, medium: 0.25, high: 0.65, worst: 1.0 };
    const usageLabels  = {
      low:    "Low use (preventive, 1-2 visits)",
      medium: "Moderate use (some specialist visits)",
      high:   "High use (chronic condition or procedure)",
      worst:  "Worst case (major illness or hospitalization)"
    };
    const factor = usageFactors[usage];

    // MA total annual cost
    const maAnnualPremium = maPremium * 12;
    const maOopEstimate   = maMoop * factor;
    const maTotalAnnual   = maAnnualPremium + maOopEstimate + maPartD;

    // Medigap total annual cost
    // Plan G: after Part B deductible, virtually no cost-sharing beyond premium
    const mgAnnualPremium   = mgPremium * 12;
    const mgPartBAnnual     = mgPartB * 12;
    const mgPartDPremAnnual = mgPartDPrem * 12;
    // Out-of-pocket for Plan G is just the Part B deductible (if care is used) + drug cost-sharing
    const mgOop = usage === "low" ? 0 : mgDeductible;
    const mgTotalAnnual = mgAnnualPremium + mgPartBAnnual + mgPartDPremAnnual + mgOop + mgPartDDrugs;

    const diff = Math.abs(maTotalAnnual - mgTotalAnnual);
    const cheaper = maTotalAnnual < mgTotalAnnual ? "Medicare Advantage" : "Medigap path";
    const savings = diff.toFixed(2);

    const resultDiv  = document.getElementById("cost-result");
    const resultBody = document.getElementById("cost-result-body");

    resultBody.innerHTML = `
      <p><strong>Scenario: ${usageLabels[usage]}</strong></p>
      <table class="calc-table">
        <tr>
          <th></th>
          <th>Medicare Advantage</th>
          <th>Medigap Path</th>
        </tr>
        <tr>
          <td>Annual premiums</td>
          <td>$${maAnnualPremium.toFixed(2)}</td>
          <td>$${(mgAnnualPremium + mgPartBAnnual + mgPartDPremAnnual).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Est. out-of-pocket</td>
          <td>$${maOopEstimate.toFixed(2)}</td>
          <td>$${(mgOop + mgPartDDrugs).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Drug costs</td>
          <td>$${maPartD.toFixed(2)} (included above)</td>
          <td>$${mgPartDDrugs.toFixed(2)} (included above)</td>
        </tr>
        <tr class="calc-total">
          <td><strong>Estimated annual total</strong></td>
          <td><strong>$${maTotalAnnual.toFixed(2)}</strong></td>
          <td><strong>$${mgTotalAnnual.toFixed(2)}</strong></td>
        </tr>
      </table>
      <p>At this usage level, the <strong>${cheaper}</strong> is estimated to cost
      <strong>$${savings} less per year</strong>.</p>
      <p>Try changing the usage level above to see how the comparison shifts if you
      have an unexpectedly high-cost year.</p>
    `;

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['msp-calculator'] = function(container) {
    /**
 * Medicare Savings Program (MSP) Eligibility Screener (2026)
 * Helps low-income Medicare beneficiaries find out if they qualify for
 * state assistance paying their Part B premium (and sometimes Part A, copays, deductibles).
 *
 * Note: Income/resource limits vary by state. These are 2026 federal guidelines.
 * Utah uses federal limits. Always verify with the state Medicaid office.
 *
 * Requires: <div id="msp-calculator"></div>
 */
(function () {
  const container = document.getElementById("msp-calculator");
  if (!container) return;

  // 2026 MSP income limits (monthly, CONUS — excludes AK/HI)
  // Source: CMS Medicare Savings Programs fact sheet 2026
  const MSP = {
    QMB: {
      name: "Qualified Medicare Beneficiary (QMB)",
      individual: { income: 1275, resources: 9660 },
      couple:     { income: 1724, resources: 14470 },
      benefit: "Pays your Part A and Part B premiums, deductibles, and copays. Most comprehensive program.",
      color: "calc-good-news"
    },
    SLMB: {
      name: "Specified Low-Income Medicare Beneficiary (SLMB)",
      individual: { income: 1526, resources: 9660 },
      couple:     { income: 2058, resources: 14470 },
      benefit: "Pays your Part B premium ($185/month in 2026). Does not cover deductibles or copays.",
      color: ""
    },
    QI: {
      name: "Qualifying Individual (QI)",
      individual: { income: 1714, resources: 9660 },
      couple:     { income: 2309, resources: 14470 },
      benefit: "Pays your Part B premium. Must apply each year. First-come, first-served funding.",
      color: ""
    },
    QDWI: {
      name: "Qualified Disabled and Working Individuals (QDWI)",
      individual: { income: 4615, resources: 4000 },
      couple:     { income: 6239, resources: 6000 },
      benefit: "Pays Part A premium for people under 65 who are disabled and working.",
      color: ""
    }
  };

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        Medicare Savings Programs (MSPs) help people with limited income pay
        for Medicare costs. If you qualify, the state pays your Part B premium
        — that's up to $2,220/year back in your pocket. Some programs also
        cover your deductibles and copays. This screener tells you which
        program you may qualify for.
      </p>
      <div class="calc-fields">
        <label>Household size</label>
        <select id="msp-household">
          <option value="individual">Just me (individual)</option>
          <option value="couple">Me and my spouse (couple)</option>
        </select>

        <label for="msp-income">Monthly household income (before taxes) ($)</label>
        <input type="number" id="msp-income" min="0" placeholder="e.g. 1400" />
        <small>
          Include Social Security, pension, wages, and other regular income.
          Do not include your first $20 of Social Security income — that's excluded
          from the calculation. Some other exclusions may apply.
        </small>

        <label for="msp-resources">Total countable resources ($)</label>
        <input type="number" id="msp-resources" min="0" placeholder="e.g. 8000" />
        <small>
          Resources include savings accounts, checking accounts, stocks, and bonds.
          Do not include your home, one car, personal belongings, or burial funds up
          to $1,500. IRAs and 401(k)s: some states count these, some don't — Utah
          generally does not count retirement accounts for MSP purposes.
        </small>

        <label>Are you under 65 and working with a disability?</label>
        <select id="msp-qdwi">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <button id="msp-calculate">Check My Eligibility</button>
      <div id="msp-result" class="calc-result" style="display:none;">
        <h3>Medicare Savings Program Screening Result</h3>
        <div id="msp-result-body"></div>
        <p class="calc-disclaimer">
          This is a preliminary screening only. Eligibility is determined by your
          state Medicaid office. Income and resource rules have exclusions that may
          help you qualify even if these numbers suggest otherwise. In Utah, apply
          through the Department of Health and Human Services or call 1-800-662-9651.
          A licensed Medicare agent can also help you navigate this process at no cost.
        </p>
      </div>
    </div>
  `;

  document.getElementById("msp-calculate").addEventListener("click", function () {
    const household = document.getElementById("msp-household").value;
    const income    = parseFloat(document.getElementById("msp-income").value) || 0;
    const resources = parseFloat(document.getElementById("msp-resources").value) || 0;
    const isQDWI    = document.getElementById("msp-qdwi").value === "yes";

    const resultDiv  = document.getElementById("msp-result");
    const resultBody = document.getElementById("msp-result-body");

    // Check which programs qualify
    let qualifies = [];
    let mayQualify = [];

    for (const [key, prog] of Object.entries(MSP)) {
      if (key === "QDWI" && !isQDWI) continue;
      const limits = prog[household];
      if (income <= limits.income && resources <= limits.resources) {
        qualifies.push({ key, prog });
      } else if (income <= limits.income * 1.1 && resources <= limits.resources * 1.15) {
        // Within 10-15% — suggest they apply anyway due to exclusions
        mayQualify.push({ key, prog });
      }
    }

    // Pick the best qualifying program (most generous)
    const best = qualifies[0]; // QMB is first in order — most generous

    if (qualifies.length === 0 && mayQualify.length === 0) {
      resultBody.innerHTML = `
        <p>Based on the income and resources you entered, you appear to be <strong>above the
        income or resource limits</strong> for Medicare Savings Programs at this time.</p>
        <p>A few things to keep in mind:</p>
        <ul>
          <li>Income limits have specific exclusions — the actual calculation may be different from your gross income</li>
          <li>Resource limits exclude your home, car, and some other assets</li>
          <li>Limits change annually — it's worth checking again next year</li>
          <li>If your income has dropped recently, apply anyway — Medicaid offices have discretion</li>
        </ul>
        <p>You may still qualify for the <strong>Extra Help (LIS)</strong> program that reduces Part D
        drug costs. That program has slightly higher income limits.</p>
      `;
    } else {
      let html = "";

      if (qualifies.length > 0) {
        html += `<p class="calc-good-news">✓ Based on your income and resources, you may qualify for Medicare Savings Program assistance.</p>`;
        qualifies.forEach(({ key, prog }) => {
          const limits = prog[household];
          html += `
            <div style="margin: 1rem 0; padding: 1rem; background: #edf6ee; border-left: 3px solid #1a7a3c; border-radius: 4px;">
              <strong>${prog.name}</strong><br>
              <span style="color:#1a7a3c;">${prog.benefit}</span><br>
              <small>Income limit: $${limits.income.toLocaleString()}/mo | Resource limit: $${limits.resources.toLocaleString()}</small>
            </div>
          `;
        });
      }

      if (mayQualify.length > 0) {
        html += `<p>You're close to the limits for these programs — apply anyway, as income exclusions may help you qualify:</p>`;
        mayQualify.forEach(({ key, prog }) => {
          const limits = prog[household];
          html += `
            <div style="margin: 0.5rem 0; padding: 0.75rem; background: #fff8e6; border-left: 3px solid #c87800; border-radius: 4px;">
              <strong>${prog.name}</strong> — possibly eligible<br>
              <small>${prog.benefit}</small>
            </div>
          `;
        });
      }

      html += `
        <h4>How to Apply in Utah</h4>
        <p>Apply through the Utah Department of Health and Human Services:
        call <strong>1-800-662-9651</strong> or visit a local DWS office.
        You can also apply through your local SHIP counselor at no cost.</p>
        <p>MSP enrollment also automatically qualifies you for
        <strong>Extra Help</strong> with Part D drug costs — saving most
        people an additional $300–$5,000 per year on prescriptions.</p>
      `;

      resultBody.innerHTML = html;
    }

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['medigap-oe-calculator'] = function(container) {
    /**
 * Medigap Open Enrollment Window Calculator
 * The 6-month guaranteed-issue Medigap window starts when you are BOTH:
 *   1. Age 65 or older
 *   2. Enrolled in Medicare Part B
 * Miss it and insurers can medically underwrite (deny or charge more).
 *
 * Requires: <div id="medigap-oe-calculator"></div>
 */
(function () {
  const container = document.getElementById("medigap-oe-calculator");
  if (!container) return;

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  function addMonths(m, y, n) {
    let total = (m - 1) + n;
    return { month: (total % 12) + 1, year: y + Math.floor(total / 12) };
  }

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        When you first enroll in Medicare Part B at age 65 or older, you have a
        <strong>6-month Medigap Open Enrollment Period</strong> during which no insurer
        can deny you coverage or charge you more based on your health history. This window
        does not come back. If you miss it, you may be subject to medical underwriting.
      </p>
      <div class="calc-fields">
        <label>When does (or did) your Medicare Part B coverage begin?</label>
        <select id="moe-month">
          ${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}
        </select>
        <select id="moe-year" style="max-width:120px; margin-top:0.4rem;">
          ${Array.from({length: 15}, (_, i) => 2020 + i).map(y =>
            `<option value="${y}" ${y === new Date().getFullYear() ? 'selected' : ''}>${y}</option>`
          ).join("")}
        </select>

        <label>How old will you be (or were you) when Part B starts?</label>
        <select id="moe-age">
          <option value="under65">Under 65 (disability enrollment)</option>
          <option value="65plus" selected>65 or older</option>
        </select>
        <small>
          The guaranteed-issue Medigap window only applies when you're 65 or older
          enrolling in Part B. If you enrolled in Part B due to disability before 65,
          you get a second Medigap open enrollment window when you turn 65.
        </small>
      </div>
      <button id="moe-calculate">Show My Medigap Window</button>
      <div id="moe-result" class="calc-result" style="display:none;">
        <h3>Your Medigap Open Enrollment Window</h3>
        <div id="moe-result-body"></div>
        <p class="calc-disclaimer">
          Medigap open enrollment rules vary slightly by state. Most states follow
          federal rules. Utah follows federal rules with no additional state protections
          beyond the 6-month window. Guaranteed issue rights may apply in other limited
          circumstances. Contact a licensed Medicare agent to confirm your specific situation.
        </p>
      </div>
    </div>
  `;

  document.getElementById("moe-calculate").addEventListener("click", function () {
    const startMonth = parseInt(document.getElementById("moe-month").value, 10);
    const startYear  = parseInt(document.getElementById("moe-year").value, 10);
    const age        = document.getElementById("moe-age").value;

    const resultDiv  = document.getElementById("moe-result");
    const resultBody = document.getElementById("moe-result-body");

    if (age === "under65") {
      resultBody.innerHTML = `
        <p>Because you enrolled in Part B before age 65 due to disability, your
        <strong>guaranteed-issue Medigap window starts when you turn 65</strong> —
        not when you first enrolled in Part B.</p>
        <p>At age 65 you will have a fresh 6-month open enrollment window to buy
        any Medigap plan with no medical underwriting. Use our
        <a href="/calculators/initial-enrollment-period">IEP Calculator</a>
        to find when your 65th birthday window opens.</p>
        <p>Some insurers voluntarily offer guaranteed issue for disability enrollees
        under 65, but they are not required to. It's worth shopping, but don't count
        on getting the same protections you'll have at 65.</p>
      `;
      resultDiv.style.display = "block";
      return;
    }

    const windowEnd = addMonths(startMonth, startYear, 5); // 6 months inclusive = +5

    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear  = now.getFullYear();

    // Is window open, future, or past?
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate   = new Date(windowEnd.year, windowEnd.month - 1, 28);
    const today     = new Date(nowYear, nowMonth - 1, 1);

    let status, statusNote;
    if (today < startDate) {
      status = "future";
      statusNote = `Your Medigap open enrollment window hasn't started yet. Mark your calendar — it begins when your Part B coverage starts.`;
    } else if (today > endDate) {
      status = "closed";
      statusNote = `Your Medigap open enrollment window has closed. You can still apply for Medigap, but insurers in most states can now ask health questions and may charge more or deny coverage based on your health history.`;
    } else {
      status = "open";
      statusNote = `Your Medigap open enrollment window is currently open. Act now — this window does not reset or extend.`;
    }

    resultBody.innerHTML = `
      <table class="calc-table">
        <tr><td>Part B start date</td><td><strong>${MONTHS[startMonth-1]} ${startYear}</strong></td></tr>
        <tr class="calc-total"><td>Open enrollment window opens</td><td><strong>${MONTHS[startMonth-1]} ${startYear}</strong></td></tr>
        <tr class="calc-total"><td>Open enrollment window closes</td><td><strong>${MONTHS[windowEnd.month-1]} ${windowEnd.year}</strong></td></tr>
      </table>

      <p class="${status === 'closed' ? 'calc-urgent' : status === 'open' ? 'calc-good-news' : ''}">
        ${status === 'open' ? '✓ ' : status === 'closed' ? '⚠ ' : ''}
        <strong>${statusNote}</strong>
      </p>

      ${status === 'open' ? `
        <h4>What to do now</h4>
        <p>During this window, any Medigap insurer licensed in Utah must sell you any plan
        they offer at the same price as a healthy person your age. No health questions.
        No denials. This is the best time to shop for Medigap.</p>
        <p>Plan G is the most comprehensive option available to new enrollees (Plan F is
        no longer available to people who became Medicare-eligible after Jan 1, 2020).
        Plan N is a lower-premium alternative with some copays.</p>
      ` : ""}

      ${status === 'closed' ? `
        <h4>You may still have options</h4>
        <p>While most insurers can now underwrite, a few situations trigger new guaranteed-issue
        rights even after this window closes:</p>
        <ul>
          <li>Your Medicare Advantage plan is leaving your area</li>
          <li>You're leaving a Medicare Advantage plan you joined when you first became eligible</li>
          <li>You moved and your plan no longer covers your area</li>
        </ul>
        <p>A licensed Medicare agent can review your situation and tell you if any of these apply.</p>
      ` : ""}
    `;

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['parta-calculator'] = function(container) {
    /**
 * Medicare Part A Premium Calculator (2026)
 * Most people get Part A free — but not everyone. This calculates your premium
 * based on how many quarters you (or your spouse) worked and paid Medicare taxes.
 *
 * Requires: <div id="parta-calculator"></div>
 */
(function () {
  const container = document.getElementById("parta-calculator");
  if (!container) return;

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        Most people pay $0 for Medicare Part A because they (or their spouse)
        worked and paid Medicare taxes for at least 10 years. But if you don't
        have enough work credits, you may pay a monthly premium. Find out where
        you stand.
      </p>
      <div class="calc-fields">
        <label>Who are we calculating for?</label>
        <select id="pa-who">
          <option value="self">Myself</option>
          <option value="spouse">Through my spouse's work record</option>
          <option value="both">I'm not sure — check both</option>
        </select>

        <label for="pa-quarters">How many quarters (3-month periods) did you work and pay Medicare taxes?</label>
        <input type="number" id="pa-quarters" min="0" max="200" placeholder="e.g. 35" />
        <small>
          One quarter = one 3-month period of work in which you earned above the
          minimum threshold and paid Medicare taxes. Most full-time workers earn
          4 quarters per year. You can find your work record at
          <a href="https://www.ssa.gov/myaccount/" target="_blank" rel="noopener">ssa.gov/myaccount</a>.
        </small>

        <div id="pa-spouse-field" style="display:none;">
          <label for="pa-spouse-quarters">How many quarters did your spouse work?</label>
          <input type="number" id="pa-spouse-quarters" min="0" max="200" placeholder="e.g. 40" />
          <small>If your spouse has 40+ quarters, you qualify for free Part A based on their record — even if you have zero quarters yourself.</small>
        </div>
      </div>
      <button id="pa-calculate">Calculate My Part A Premium</button>
      <div id="pa-result" class="calc-result" style="display:none;">
        <h3>Your Part A Premium Estimate</h3>
        <div id="pa-result-body"></div>
        <p class="calc-disclaimer">
          2026 Part A premiums: $0 (40+ quarters), $284/month (30–39 quarters),
          $505/month (fewer than 30 quarters). These figures are set by CMS annually.
          Your actual eligibility is determined by SSA. Contact 1-800-MEDICARE or
          a licensed Medicare agent to confirm your situation.
        </p>
      </div>
    </div>
  `;

  document.getElementById("pa-who").addEventListener("change", function () {
    document.getElementById("pa-spouse-field").style.display =
      (this.value === "spouse" || this.value === "both") ? "block" : "none";
  });

  document.getElementById("pa-calculate").addEventListener("click", function () {
    const who = document.getElementById("pa-who").value;
    const selfQ = parseInt(document.getElementById("pa-quarters").value, 10) || 0;
    const spouseQ = parseInt(document.getElementById("pa-spouse-quarters")?.value, 10) || 0;

    const effectiveQ = who === "spouse" ? spouseQ :
                       who === "both"   ? Math.max(selfQ, spouseQ) : selfQ;

    let premium, label, explanation;

    if (effectiveQ >= 40) {
      premium = 0;
      label = "Free — $0/month";
      explanation = `You (or your spouse) have ${effectiveQ} quarters of Medicare-covered work,
      which meets the 40-quarter threshold. You qualify for premium-free Part A.`;
    } else if (effectiveQ >= 30) {
      premium = 284;
      label = "$284/month (2026)";
      explanation = `With ${effectiveQ} quarters of Medicare-covered work, you fall in the
      30–39 quarter range. You pay a reduced Part A premium. You need
      ${40 - effectiveQ} more quarter(s) to qualify for free Part A.`;
    } else {
      premium = 505;
      label = "$505/month (2026)";
      explanation = `With fewer than 30 quarters (you have ${effectiveQ}), you pay the full
      Part A premium. This is $6,060/year. Some people in this situation choose not to
      enroll in Part A until they need it, but there are trade-offs to understand.`;
    }

    const resultDiv = document.getElementById("pa-result");
    const resultBody = document.getElementById("pa-result-body");

    resultBody.innerHTML = `
      <table class="calc-table">
        <tr><td>Quarters of Medicare-covered work</td><td><strong>${effectiveQ}</strong></td></tr>
        <tr class="calc-total"><td>Your Part A monthly premium</td><td><strong>${label}</strong></td></tr>
        ${premium > 0 ? `<tr><td>Annual Part A premium cost</td><td><strong>$${(premium * 12).toLocaleString()}/yr</strong></td></tr>` : ""}
      </table>
      <p>${explanation}</p>
      ${premium === 505 ? `<p><strong>Important:</strong> If you buy Part A without being eligible for
      free Part A, you must also enroll in Part B. And if you delay Part B past your Initial
      Enrollment Period, you'll owe a separate late enrollment penalty on top of the Part A premium.</p>` : ""}
      ${premium === 0 ? `<p class="calc-good-news">✓ You qualify for premium-free Part A.</p>` : ""}
    `;
    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['partb-calculator'] = function(container) {
    /**
 * Medicare Part B Late Enrollment Penalty Calculator
 * Embed: drop this in a Webflow custom code block on the Part B Penalty page.
 * Requires a container div with id="partb-calculator"
 */
(function () {
  const container = document.getElementById("partb-calculator");
  if (!container) return;

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        If you didn't sign up for Medicare Part B when you were first eligible
        and didn't have other qualifying coverage, you may owe a late enrollment
        penalty added to your Part B premium permanently.
      </p>
      <div class="calc-fields">
        <label for="pb-months">How many full 12-month periods did you go without Part B?</label>
        <input type="number" id="pb-months" min="1" max="50" placeholder="e.g. 2" />
        <small>Count each full 12-month period you were without Part B after your Initial Enrollment Period ended.</small>

        <label for="pb-premium">Standard Part B monthly premium ($)</label>
        <input type="number" id="pb-premium" value="185.00" step="0.01" />
        <small>2026 standard premium is $185.00/month.</small>
      </div>
      <button id="pb-calculate">Calculate My Penalty</button>
      <div id="pb-result" class="calc-result" style="display:none;">
        <h3>Your Estimated Penalty</h3>
        <div id="pb-result-body"></div>
        <p class="calc-disclaimer">
          This is an estimate. Your actual penalty is determined by CMS and
          will appear on your Medicare bill. Contact a licensed Medicare agent
          or call 1-800-MEDICARE for your exact amount.
        </p>
      </div>
    </div>
  `;

  document.getElementById("pb-calculate").addEventListener("click", function () {
    const periods = parseInt(document.getElementById("pb-months").value, 10);
    const premium = parseFloat(document.getElementById("pb-premium").value);

    if (!periods || periods < 1 || isNaN(premium)) {
      alert("Please enter the number of 12-month periods and the current premium.");
      return;
    }

    const penaltyPct = periods * 10; // 10% per 12-month period
    const penaltyAmt = (premium * penaltyPct) / 100;
    const newPremium = premium + penaltyAmt;

    const resultDiv = document.getElementById("pb-result");
    const resultBody = document.getElementById("pb-result-body");

    resultBody.innerHTML = `
      <table class="calc-table">
        <tr><td>12-month periods without Part B</td><td><strong>${periods}</strong></td></tr>
        <tr><td>Penalty percentage</td><td><strong>${penaltyPct}%</strong></td></tr>
        <tr><td>Standard Part B premium</td><td><strong>$${premium.toFixed(2)}/mo</strong></td></tr>
        <tr><td>Monthly penalty amount</td><td><strong>$${penaltyAmt.toFixed(2)}/mo</strong></td></tr>
        <tr class="calc-total"><td>Your estimated monthly premium</td><td><strong>$${newPremium.toFixed(2)}/mo</strong></td></tr>
        <tr><td>Annual extra cost</td><td><strong>$${(penaltyAmt * 12).toFixed(2)}/yr</strong></td></tr>
      </table>
      <p>This penalty is permanent — it stays with you as long as you have Part B.
      If you believe you had qualifying employer coverage during that period, you
      may be able to dispute the penalty.</p>
    `;

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['partd-calculator'] = function(container) {
    /**
 * Medicare Part D Late Enrollment Penalty Calculator
 * Embed: drop this in a Webflow custom code block on the Part D Penalty page.
 * Requires a container div with id="partd-calculator"
 */
(function () {
  const container = document.getElementById("partd-calculator");
  if (!container) return;

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        If you went 63 or more consecutive days without creditable prescription
        drug coverage after your Initial Enrollment Period ended, you may owe a
        Part D late enrollment penalty — added to your drug plan premium every month.
      </p>
      <div class="calc-fields">
        <label for="pd-months">How many months were you without creditable drug coverage?</label>
        <input type="number" id="pd-months" min="1" max="300" placeholder="e.g. 18" />
        <small>Count from when your Initial Enrollment Period ended to when you enrolled in Part D. Do not count the first 63 days — only periods of 63+ consecutive days count.</small>

        <label for="pd-base">National base beneficiary premium ($)</label>
        <input type="number" id="pd-base" value="36.78" step="0.01" />
        <small>2026 national base beneficiary premium is $36.78/month. CMS updates this annually.</small>
      </div>
      <button id="pd-calculate">Calculate My Penalty</button>
      <div id="pd-result" class="calc-result" style="display:none;">
        <h3>Your Estimated Penalty</h3>
        <div id="pd-result-body"></div>
        <p class="calc-disclaimer">
          This is an estimate based on the 2026 base premium. The actual penalty
          is recalculated each year as the national base premium changes, so the
          dollar amount can go up or down. Contact 1-800-MEDICARE or a licensed
          Medicare agent for your specific penalty amount.
        </p>
      </div>
    </div>
  `;

  document.getElementById("pd-calculate").addEventListener("click", function () {
    const months = parseInt(document.getElementById("pd-months").value, 10);
    const base = parseFloat(document.getElementById("pd-base").value);

    if (!months || months < 1 || isNaN(base)) {
      alert("Please enter the number of months and the base premium.");
      return;
    }

    // 1% of national base per month without coverage
    const penaltyPct = months * 1;
    const penaltyAmt = Math.round((base * penaltyPct) / 100 * 100) / 100;

    const resultDiv = document.getElementById("pd-result");
    const resultBody = document.getElementById("pd-result-body");

    resultBody.innerHTML = `
      <table class="calc-table">
        <tr><td>Months without creditable coverage</td><td><strong>${months}</strong></td></tr>
        <tr><td>Penalty percentage</td><td><strong>${penaltyPct}%</strong></td></tr>
        <tr><td>2026 national base premium</td><td><strong>$${base.toFixed(2)}/mo</strong></td></tr>
        <tr class="calc-total"><td>Monthly penalty added to your premium</td><td><strong>$${penaltyAmt.toFixed(2)}/mo</strong></td></tr>
        <tr><td>Annual extra cost (at current base)</td><td><strong>$${(penaltyAmt * 12).toFixed(2)}/yr</strong></td></tr>
      </table>
      <p>This penalty is added on top of whatever your chosen Part D plan charges.
      It follows you as long as you have Medicare drug coverage. The dollar amount
      adjusts each year with the national base premium.</p>
    `;

    resultDiv.style.display = "block";
  });
})();
  };

  CALCULATORS['sep-finder'] = function(container) {
    /**
 * Medicare Special Enrollment Period (SEP) Finder
 * Helps users determine if they currently have an SEP and how long it lasts.
 * Different from the IEP calculator — this is for people already past 65
 * or who experienced a qualifying life event.
 *
 * Requires: <div id="sep-finder"></div>
 */
(function () {
  const container = document.getElementById("sep-finder");
  if (!container) return;

  const SEPS = {
    lost_employer: {
      title: "Loss of Employer Coverage SEP",
      window: "8 months",
      details: `You have <strong>8 months</strong> to enroll in Medicare Part B starting
        the month after your employer coverage ends OR the month after your employment ends,
        whichever comes first. Do not wait for COBRA to end — the 8-month clock starts when
        your active employment ends, not when COBRA ends.`,
      warning: `Do not use COBRA as a reason to delay enrolling in Medicare. COBRA does not
        restart or pause the 8-month SEP clock.`,
      urgent: false
    },
    moved_out_of_area: {
      title: "Plan Service Area Change SEP",
      window: "2 months",
      details: `If you moved outside your Medicare Advantage or Part D plan's service area,
        you have a <strong>2-month SEP</strong> to switch to a new plan. This starts the month
        you notify your plan of your move (or the month after, if you notify them after the move).`,
      urgent: false
    },
    lost_medicaid: {
      title: "Loss of Medicaid / Extra Help SEP",
      window: "3 months",
      details: `If you lost Medicaid or Extra Help (Low Income Subsidy) coverage, you have a
        <strong>3-month SEP</strong> to join, switch, or drop a Medicare Advantage or Part D plan.
        This also applies if your level of Extra Help changed.`,
      urgent: false
    },
    gained_medicaid: {
      title: "Gained Medicaid / Extra Help SEP",
      window: "Ongoing",
      details: `If you recently qualified for Medicaid or Extra Help, you can join, switch,
        or drop a Medicare Advantage or Part D plan once per quarter for the first 3 quarters
        of the year, and once during AEP (Oct 15–Dec 7).`,
      urgent: false
    },
    plan_left_area: {
      title: "Plan Discontinued or Left Your Area SEP",
      window: "Until Feb 28 of following year",
      details: `If your Medicare Advantage or Part D plan was discontinued or stopped covering
        your area, you have a Special Enrollment Period that runs from October 1 through
        February 28 of the following year to switch to a new plan.`,
      urgent: false
    },
    five_star: {
      title: "5-Star Plan SEP",
      window: "Dec 8 – Nov 30 (once per year)",
      details: `Once per year, between December 8 and November 30, you can switch to a
        Medicare Advantage or Part D plan that has earned a 5-star quality rating from CMS.
        You can use this SEP once per year — separate from AEP.`,
      urgent: false
    },
    tricare_champva: {
      title: "TRICARE / CHAMPVA SEP",
      window: "Varies",
      details: `Military retirees covered by TRICARE or CHAMPVA have special rules around
        Medicare enrollment. In most cases, you must enroll in Medicare Part B to maintain
        TRICARE/CHAMPVA benefits. Contact your benefit administrator for your specific window.`,
      urgent: true
    },
    none: {
      title: "No Current SEP Identified",
      window: "N/A",
      details: `Based on your answers, you don't appear to have a current Special Enrollment
        Period. Your next opportunity to make Medicare changes is likely the Annual Enrollment
        Period (October 15 – December 7). If you think you may have had a qualifying event,
        contact 1-800-MEDICARE or a licensed Medicare agent to confirm.`,
      urgent: false
    }
  };

  const questions = [
    {
      id: "q_event",
      question: "Which of these has happened to you recently?",
      options: [
        { label: "I lost (or will lose) employer or union health coverage", sep: "lost_employer" },
        { label: "I moved to a new area not covered by my current plan", sep: "moved_out_of_area" },
        { label: "I lost Medicaid or Extra Help (Low Income Subsidy)", sep: "lost_medicaid" },
        { label: "I recently qualified for Medicaid or Extra Help", sep: "gained_medicaid" },
        { label: "My Medicare Advantage or Part D plan is being discontinued", sep: "plan_left_area" },
        { label: "I want to switch to a 5-star rated plan", sep: "five_star" },
        { label: "I have TRICARE or CHAMPVA military coverage", sep: "tricare_champva" },
        { label: "None of these apply to me", sep: "none" },
      ]
    }
  ];

  function render() {
    const q = questions[0];
    let html = `<div class="calc-wrap">
      <p class="calc-desc">
        A Special Enrollment Period (SEP) lets you make Medicare changes outside
        the normal Annual Enrollment Period if you've experienced a qualifying life event.
        Select the situation that applies to you.
      </p>
      <p class="quiz-question"><strong>${q.question}</strong></p>
      <div class="quiz-options">`;
    q.options.forEach((opt, i) => {
      html += `<button class="quiz-btn" data-sep="${opt.sep}">${opt.label}</button>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;

    container.querySelectorAll(".quiz-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        showResult(this.dataset.sep);
      });
    });
  }

  function showResult(sepKey) {
    const sep = SEPS[sepKey];
    const isNone = sepKey === "none";

    let html = `<div class="calc-wrap">
      <div class="calc-result" style="display:block; border-left-color: ${isNone ? '#888' : '#0057a8'};">
        <h3 ${sep.urgent ? 'class="calc-urgent"' : ""}>${sep.title}</h3>
        ${!isNone ? `<p><strong>Enrollment window:</strong> ${sep.window}</p>` : ""}
        <p>${sep.details}</p>
        ${sep.warning ? `<p class="calc-urgent"><strong>Important:</strong> ${sep.warning}</p>` : ""}

        ${!isNone ? `
        <h4>What can you change during this SEP?</h4>
        <ul>
          <li>Join Medicare Part A or Part B (if not already enrolled)</li>
          <li>Switch Medicare Advantage plans</li>
          <li>Switch Part D drug plans</li>
          <li>Return to Original Medicare from Medicare Advantage</li>
        </ul>
        <p>What you <em>can't</em> do during most SEPs: enroll in Medigap with guaranteed
        issue rights (that's a separate window tied to your Part B enrollment date).</p>
        ` : ""}

        <div class="quiz-cta">
          <p>Not sure if your situation qualifies or what to do next? Peter Abilla is a
          licensed Medicare insurance agent in Utah. There is no cost to speak with him.</p>
          <a href="/contact" class="quiz-cta-btn">Get a Free Consultation</a>
        </div>
      </div>
      <button class="quiz-back quiz-restart" style="margin-top:1rem;">← Start Over</button>
    </div>`;

    container.innerHTML = html;
    container.querySelector(".quiz-restart").addEventListener("click", render);
  }

  render();
})();
  };

  CALCULATORS['m3p-calculator'] = function(container) {
    (function () {
  const container = document.getElementById("m3p-calculator");
  if (!container) return;

  const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  let monthOptions = "";
  for (let m = 1; m <= 12; m++) {
    const selected = m === currentMonth ? " selected" : "";
    monthOptions += `<option value="${m}"${selected}>${MONTHS[m]}</option>`;
  }

  container.innerHTML = `
    <div class="calc-wrap">
      <p class="calc-desc">
        The Medicare Prescription Payment Plan (M3P) lets you spread your Part D
        out-of-pocket drug costs evenly over the year instead of paying large bills
        at once. For 2026, the Part D OOP cap is <strong>$2,100</strong>. Use this
        calculator to see what your monthly payment would look like if you enrolled.
      </p>

      <div class="calc-fields">
        <label for="m3p-drug-cost">Estimated monthly drug cost (your OOP share, $)</label>
        <input type="number" id="m3p-drug-cost" min="1" max="2100" step="0.01" placeholder="e.g. 350" />
        <small>Enter what you actually pay out of pocket each month \u2014 copays, coinsurance, and deductibles. Not what the plan pays.</small>

        <label for="m3p-ss-income">Monthly Social Security income ($)</label>
        <input type="number" id="m3p-ss-income" min="0" step="1" placeholder="e.g. 1800" />
        <small>Used to show your estimated disposable income after each M3P payment.</small>

        <label for="m3p-birthday">Day of birth (1\u201331)</label>
        <input type="number" id="m3p-birthday" min="1" max="31" placeholder="e.g. 15" />
        <small>Determines which Wednesday your Social Security check arrives \u2014 helps you line up payment timing.</small>

        <label for="m3p-start-month">Month you plan to enroll in M3P</label>
        <select id="m3p-start-month">${monthOptions}</select>
        <small>Payments are spread from your enrollment month through December. Enrolling earlier = lower monthly payments.</small>
      </div>

      <button id="m3p-calculate">Calculate My Payment Schedule</button>

      <div id="m3p-result" class="calc-result" style="display:none;">
        <h3>Your Estimated M3P Payment Schedule</h3>
        <div id="m3p-summary"></div>
        <div id="m3p-table-wrap"></div>
        <p class="calc-disclaimer">
          This estimate is based on the 2026 Part D OOP cap of $2,100 and the CMS
          M3P formula: <em>(Previous Balance + New OOP Costs) / Remaining Months</em>.
          Actual payments depend on your specific plan, drug costs, and enrollment
          timing. Contact a licensed Medicare agent or your plan for exact figures.
          M3P enrollment opens at the start of each plan year and at certain other
          times \u2014 ask your agent about your eligibility window.
        </p>
      </div>
    </div>
  `;

  function getSSCheckTiming(birthDay) {
    if (birthDay <= 10) return "2nd Wednesday";
    if (birthDay <= 20) return "3rd Wednesday";
    return "4th Wednesday";
  }

  function calculateM3P(monthlyDrugCost, monthlySSIncome, birthDay, startMonth) {
    const ANNUAL_OOP_CAP = 2100;
    const ssCheckTiming = getSSCheckTiming(birthDay);
    let balance = 0;
    let totalPaidYTD = 0;
    const schedule = [];

    for (let m = startMonth; m <= 12; m++) {
      const monthsLeft = 13 - m;
      const newOOP = Math.min(monthlyDrugCost, ANNUAL_OOP_CAP - totalPaidYTD);
      if (newOOP <= 0) break;

      const monthlyPayment = (balance + newOOP) / monthsLeft;
      balance = (balance + newOOP) - monthlyPayment;
      totalPaidYTD += monthlyPayment;

      schedule.push({
        month: MONTHS[m],
        newOOP: newOOP.toFixed(2),
        m3pPayment: monthlyPayment.toFixed(2),
        totalPaid: totalPaidYTD.toFixed(2),
        ssDate: ssCheckTiming,
        disposableIncome: (monthlySSIncome - monthlyPayment).toFixed(2)
      });
    }
    return schedule;
  }

  document.getElementById("m3p-calculate").addEventListener("click", function () {
    const drugCost = parseFloat(document.getElementById("m3p-drug-cost").value);
    const ssIncome = parseFloat(document.getElementById("m3p-ss-income").value);
    const birthday = parseInt(document.getElementById("m3p-birthday").value, 10);
    const startMonth = parseInt(document.getElementById("m3p-start-month").value, 10);

    if (!drugCost || drugCost <= 0) { alert("Please enter your estimated monthly drug cost."); return; }
    if (isNaN(ssIncome) || ssIncome < 0) { alert("Please enter your monthly Social Security income (enter 0 if none)."); return; }
    if (!birthday || birthday < 1 || birthday > 31) { alert("Please enter a valid day of birth (1\u201331)."); return; }

    const schedule = calculateM3P(drugCost, ssIncome, birthday, startMonth);
    const resultDiv = document.getElementById("m3p-result");
    const summaryDiv = document.getElementById("m3p-summary");
    const tableWrap = document.getElementById("m3p-table-wrap");

    const withM3P = schedule.length > 0 ? parseFloat(schedule[0].m3pPayment) : 0;
    const savings = drugCost - withM3P;
    const ssCheckLabel = getSSCheckTiming(birthday);

    summaryDiv.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div style="flex:1;min-width:150px;padding:1rem;background:#fff;border:1.5px solid #dde6f0;border-radius:8px;text-align:center;">
          <div style="font-size:0.8rem;color:#666;margin-bottom:0.25rem;">Without M3P (first month)</div>
          <div style="font-size:1.5rem;font-weight:700;color:#b00020;">$${drugCost.toFixed(2)}</div>
        </div>
        <div style="flex:1;min-width:150px;padding:1rem;background:#fff;border:1.5px solid #dde6f0;border-radius:8px;text-align:center;">
          <div style="font-size:0.8rem;color:#666;margin-bottom:0.25rem;">With M3P (first month)</div>
          <div style="font-size:1.5rem;font-weight:700;color:#1a7a3c;">$${withM3P.toFixed(2)}</div>
        </div>
        <div style="flex:1;min-width:150px;padding:1rem;background:#fff;border:1.5px solid #dde6f0;border-radius:8px;text-align:center;">
          <div style="font-size:0.8rem;color:#666;margin-bottom:0.25rem;">Monthly savings (first month)</div>
          <div style="font-size:1.5rem;font-weight:700;color:#0057a8;">$${savings.toFixed(2)}</div>
        </div>
      </div>
      <p style="margin-bottom:1rem;font-size:0.9rem;color:#444;">
        Your Social Security check arrives on the <strong>${ssCheckLabel}</strong> of each month
        (based on your birth date). Your first M3P payment would be <strong>$${withM3P.toFixed(2)}</strong>,
        leaving you approximately <strong>$${(ssIncome - withM3P).toFixed(2)}</strong> after drug costs.
      </p>
    `;

    let rows = "";
    schedule.forEach(function(row) {
      const dispColor = parseFloat(row.disposableIncome) < 0 ? 'style="color:#b00020;"' : 'style="color:#1a7a3c;"';
      rows += `<tr><td>${row.month}</td><td>$${row.newOOP}</td><td><strong>$${row.m3pPayment}</strong></td><td>$${row.totalPaid}</td><td>${row.ssDate}</td><td ${dispColor}>$${row.disposableIncome}</td></tr>`;
    });

    tableWrap.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="calc-table">
          <thead><tr><th>Month</th><th>New OOP Costs</th><th>M3P Payment</th><th>Total Paid YTD</th><th>SS Check Arrives</th><th>Disposable Income</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    resultDiv.style.display = "block";
    resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
  };

  CALCULATORS['signup-quiz'] = function(container) {
    /**
 * "When Should I Sign Up for Medicare?" Decision Quiz
 * Routes users to the right enrollment path based on their situation.
 * Embed: drop this in a Webflow custom code block.
 * Requires a container div with id="signup-quiz"
 */
(function () {
  const container = document.getElementById("signup-quiz");
  if (!container) return;

  const OUTCOMES = {
    enroll_now: {
      title: "You should enroll in Medicare now.",
      body: `You're turning 65 and don't have qualifying employer coverage. Missing your
      Initial Enrollment Period (IEP) can result in permanent late enrollment penalties
      for Part B and gaps in coverage. Your IEP is the 7-month window around your 65th
      birthday — 3 months before, your birthday month, and 3 months after. Use our
      <a href="/calculators/initial-enrollment-period">IEP Calculator</a> to find your
      exact window.`,
      cta: true
    },
    employer_active: {
      title: "You may be able to delay Medicare without penalty.",
      body: `If you're still working and covered under an employer health plan through your
      own job (or your spouse's job) at a company with 20 or more employees, you generally
      have a Special Enrollment Period to sign up for Medicare when that coverage ends.
      You do not need to enroll at 65 to avoid penalties — but confirm this with your HR
      department and a Medicare agent before assuming you're covered. If your employer
      has fewer than 20 employees, Medicare may become your primary insurance at 65
      regardless. This is worth double-checking.`,
      cta: true
    },
    retiring_soon: {
      title: "Start planning your Medicare enrollment now.",
      body: `When you retire and lose employer coverage, you enter a Special Enrollment
      Period (SEP) that gives you 8 months to sign up for Part A and Part B without
      penalty. Don't wait until the last minute — coordinating your last day of employer
      coverage with your Medicare start date takes planning. If you want a Medigap plan,
      you also have a 6-month open enrollment window starting the month you turn 65 and
      enroll in Part B. Missing that window can affect your ability to get Medigap coverage
      without medical underwriting.`,
      cta: true
    },
    cobra_retiree: {
      title: "Important: COBRA does not count as qualifying coverage.",
      body: `COBRA continuation coverage does not qualify as "employer coverage" for
      purposes of delaying Medicare without penalty. If you're on COBRA and turning 65,
      you need to sign up for Medicare during your Initial Enrollment Period or you risk
      a permanent late enrollment penalty. Do not assume COBRA protects you from the
      penalty — it does not. Contact a licensed Medicare agent before your IEP closes.`,
      cta: true,
      urgent: true
    },
    already_65_no_penalty: {
      title: "You have a Special Enrollment Period.",
      body: `If you're over 65 and just lost qualifying employer coverage, you have an
      8-month Special Enrollment Period to sign up for Medicare Part B without penalty.
      That window starts the month after your coverage ends (or the month after your
      employment ends — whichever comes first). Don't wait — this window doesn't reset
      and there's no grace period after it closes.`,
      cta: true,
      urgent: true
    },
    already_65_with_penalty: {
      title: "You may owe a late enrollment penalty.",
      body: `If you're over 65, not currently enrolled in Medicare, and don't have
      qualifying employer coverage, you've likely missed your enrollment window and
      may owe a permanent late enrollment penalty. You can typically only enroll during
      the General Enrollment Period (January 1 – March 31 each year), with coverage
      starting July 1. Use our <a href="/calculators/part-b-penalty">Part B Penalty
      Calculator</a> to estimate what you might owe. Talk to a licensed Medicare agent
      — there may be options depending on your situation.`,
      cta: true,
      urgent: true
    },
    under_65_disability: {
      title: "You may qualify for Medicare before 65.",
      body: `If you've been receiving Social Security Disability Insurance (SSDI) for
      24 months, you automatically become eligible for Medicare regardless of age.
      Medicare Part A and Part B are automatically enrolled at that point. Contact
      Social Security or a licensed Medicare agent to confirm your enrollment status.`,
      cta: true
    }
  };

  // Quiz steps
  const steps = [
    {
      id: "q1",
      question: "How old are you?",
      options: [
        { label: "Under 65", next: "q_under65" },
        { label: "Turning 65 in the next 7 months", next: "q_turning65" },
        { label: "65 or older", next: "q_over65" }
      ]
    },
    {
      id: "q_under65",
      question: "Are you receiving Social Security Disability Insurance (SSDI)?",
      options: [
        { label: "Yes — for 24 months or more", outcome: "under_65_disability" },
        { label: "No", answer: `<p>You're not yet eligible for Medicare based on age or disability. Medicare eligibility generally begins at 65, or earlier if you've been on SSDI for 24+ months or have a qualifying condition like ESRD or ALS. Stay tuned as you approach 65 — your Initial Enrollment Period starts 3 months before your 65th birthday.</p>` }
      ]
    },
    {
      id: "q_turning65",
      question: "Do you currently have health insurance through an employer (yours or a spouse's)?",
      options: [
        { label: "Yes — active employer coverage", next: "q_employer_size" },
        { label: "I have COBRA", outcome: "cobra_retiree" },
        { label: "No — I'll lose coverage or don't have any", outcome: "enroll_now" }
      ]
    },
    {
      id: "q_employer_size",
      question: "How many employees does the company (yours or your spouse's) have?",
      options: [
        { label: "20 or more employees", outcome: "employer_active" },
        { label: "Fewer than 20 employees", answer: `<p class="calc-urgent"><strong>Important:</strong> If your employer has fewer than 20 employees, Medicare becomes your primary insurer at 65. Your employer plan becomes secondary. You should enroll in Medicare Part B at 65 to avoid gaps. Failing to do so can mean your employer plan pays almost nothing. Contact a licensed Medicare agent before your 65th birthday.</p>` },
        { label: "Not sure", answer: `<p>Check with your HR department to confirm your company's size and whether your employer plan is primary or secondary to Medicare at age 65. This matters a lot — if Medicare is primary and you're not enrolled, you could face large unexpected bills. A licensed Medicare agent can help you sort this out.</p>` }
      ]
    },
    {
      id: "q_over65",
      question: "Are you currently enrolled in Medicare?",
      options: [
        { label: "Yes, I'm enrolled", answer: `<p>You're already enrolled — great. If you're looking to change plans, your next opportunity is the Annual Enrollment Period (October 15 – December 7). If you had a qualifying life event, you may have a Special Enrollment Period available now. A licensed Medicare agent can review your options at no cost.</p>`, cta: true },
        { label: "No, not yet", next: "q_over65_coverage" }
      ]
    },
    {
      id: "q_over65_coverage",
      question: "Do you currently have qualifying employer health coverage (from your own job or a spouse's job)?",
      options: [
        { label: "Yes — still working with active employer coverage", outcome: "employer_active" },
        { label: "I just lost employer coverage", outcome: "already_65_no_penalty" },
        { label: "No employer coverage and never enrolled", outcome: "already_65_with_penalty" },
        { label: "I'm about to retire in the next few months", outcome: "retiring_soon" }
      ]
    }
  ];

  const stepMap = {};
  steps.forEach(s => { stepMap[s.id] = s; });

  let history = [];

  function render(stepId) {
    const step = stepMap[stepId];
    if (!step) return;

    history.push(stepId);

    let html = `<div class="quiz-step" data-step="${stepId}">`;
    html += `<p class="quiz-question"><strong>${step.question}</strong></p>`;
    html += `<div class="quiz-options">`;
    step.options.forEach((opt, i) => {
      html += `<button class="quiz-btn" data-index="${i}">${opt.label}</button>`;
    });
    html += `</div></div>`;

    if (history.length > 1) {
      html += `<button class="quiz-back">← Back</button>`;
    }

    container.innerHTML = html;

    container.querySelectorAll(".quiz-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const opt = step.options[parseInt(this.dataset.index)];
        if (opt.outcome) {
          showOutcome(opt.outcome);
        } else if (opt.next) {
          render(opt.next);
        } else if (opt.answer) {
          showAnswer(opt.answer, opt.cta);
        }
      });
    });

    const backBtn = container.querySelector(".quiz-back");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        history.pop();
        const prev = history.pop();
        render(prev);
      });
    }
  }

  function showOutcome(outcomeKey) {
    const o = OUTCOMES[outcomeKey];
    showAnswer(
      `<h3 class="${o.urgent ? 'calc-urgent' : ''}">${o.title}</h3><p>${o.body}</p>`,
      o.cta
    );
  }

  function showAnswer(html, showCta) {
    let out = `<div class="quiz-result">${html}`;
    if (showCta) {
      out += `<div class="quiz-cta">
        <p>Have questions about your specific situation? Peter Abilla is a licensed
        Medicare insurance agent in Utah. There is no cost to work with him.</p>
        <a href="/contact" class="quiz-cta-btn">Get a Free Consultation</a>
      </div>`;
    }
    out += `<button class="quiz-back quiz-restart">← Start Over</button></div>`;
    container.innerHTML = out;
    container.querySelector(".quiz-restart").addEventListener("click", function () {
      history = [];
      render("q1");
    });
  }

  // Init
  container.innerHTML = `<div class="calc-wrap">
    <p class="calc-desc">Answer a few questions to find out when you should sign up for Medicare
    and what happens if you wait.</p>
    <div id="quiz-body"></div>
  </div>`;

  const body = container.querySelector("#quiz-body");
  // Re-render inside the wrap
  const origContainer = container;
  const quizContainer = document.createElement("div");
  origContainer.appendChild(quizContainer);

  // Replace container reference for render
  Object.defineProperty(window, "_quizContainer", { value: quizContainer });
  render("q1");

  // Fix: render directly into the calc-wrap
  container.querySelector(".calc-wrap").appendChild(quizContainer);
})();
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * Helper: shared quiz engine (avoids duplicating logic across tools)
   * ───────────────────────────────────────────────────────────────────────── */
  function buildQuiz(container, steps, outcomes, introText) {
    var stepMap = {};
    steps.forEach(function (s) { stepMap[s.id] = s; });
    var history = [];

    function render(stepId) {
      var step = stepMap[stepId];
      if (!step) return;
      history.push(stepId);

      var html = '<p class="quiz-question"><strong>' + step.question + '</strong></p>';
      html += '<div class="quiz-options">';
      step.options.forEach(function (opt, i) {
        html += '<button class="quiz-btn" data-index="' + i + '">' + opt.label + '</button>';
      });
      html += '</div>';
      if (history.length > 1) {
        html += '<button class="quiz-back">\u2190 Back</button>';
      }
      container.innerHTML = html;

      container.querySelectorAll('.quiz-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var opt = step.options[parseInt(this.dataset.index)];
          if (opt.outcome) {
            showOutcome(opt.outcome);
          } else if (opt.next) {
            render(opt.next);
          } else if (opt.answer) {
            showAnswer(opt.answer, opt.cta);
          }
        });
      });

      var back = container.querySelector('.quiz-back');
      if (back) {
        back.addEventListener('click', function () {
          history.pop();
          var prev = history.pop();
          render(prev);
        });
      }
    }

    function showOutcome(key) {
      var o = outcomes[key];
      showAnswer(
        '<h3 class="' + (o.urgent ? 'calc-urgent' : '') + '">' + o.title + '</h3><p>' + o.body + '</p>',
        o.cta
      );
    }

    function showAnswer(html, showCta) {
      var out = '<div class="quiz-result">' + html;
      if (showCta) {
        out += '<div class="quiz-cta"><p>Have questions about your specific situation? ' +
          'A licensed Medicare agent can review your options at no cost to you.</p>' +
          '<a href="/contact" class="quiz-cta-btn">Get a Free Consultation</a></div>';
      }
      out += '<button class="quiz-back quiz-restart">\u2190 Start Over</button></div>';
      container.innerHTML = out;
      container.querySelector('.quiz-restart').addEventListener('click', function () {
        history = [];
        render(steps[0].id);
      });
    }

    // init
    container.innerHTML = introText || '';
    render(steps[0].id);
  }

  /* =========================================================================
   * 1. MEDIGAP FIT ASSESSMENT
   * ========================================================================= */
  

  function initMedigapFit(container) {
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.className = 'calc-wrap';
    wrap.innerHTML = '<p class="calc-desc">Medigap (Medicare Supplement) plans cover the gaps Original Medicare leaves behind, but they are not the right fit for everyone. Answer a few questions to see whether Medigap makes sense for your situation.</p>';
    container.appendChild(wrap);

    var outcomes = {
      good_fit: {
        title: 'Medigap may be a strong fit for you.',
        body: 'Based on your answers, you have characteristics that often make Medigap a good choice: predictable monthly costs, freedom to see any Medicare-accepting doctor without referrals, and protection against large unexpected bills. Plan G is the most comprehensive option available to new Medicare enrollees. Your monthly Medigap premium will depend on your age, gender, location, and tobacco use. A licensed agent can pull quotes from multiple carriers in your area.',
        cta: true
      },
      maybe_fit: {
        title: 'Medigap is worth comparing, but Medicare Advantage may also work for you.',
        body: 'Your situation does not point strongly in either direction. Medigap gives you cost predictability and broad provider access. Medicare Advantage typically has lower monthly premiums but involves networks, referrals, and variable cost-sharing. The Medicare Advantage vs Medigap Cost Calculator on this site can show you a side-by-side cost estimate based on how much healthcare you actually use.',
        cta: true
      },
      poor_fit_low_income: {
        title: 'Medigap may not be the right fit right now.',
        body: 'Medigap premiums can be $100 to $250 per month depending on where you live and the plan you choose. If that does not fit your budget, Medicare Advantage plans often have $0 or low monthly premiums. You may also qualify for a Medicare Savings Program that helps cover Part B costs, which would free up room in your budget. Use the Medicare Savings Program Calculator on this site to check eligibility.',
        cta: true
      },
      poor_fit_advantage: {
        title: 'You may be better served by Medicare Advantage.',
        body: 'If you are generally healthy and focused on keeping monthly costs low, Medicare Advantage often makes financial sense. You get additional benefits like dental and vision, and your annual out-of-pocket maximum protects you against catastrophic costs. The trade-off is that you work within a network. If you ever want to switch to Medigap later, be aware that you may need to go through medical underwriting, so plan ahead.',
        cta: true
      },
      window_open: {
        title: 'You are in your Medigap Open Enrollment window right now.',
        body: 'This is the most important window of your Medicare journey for Medigap. During your six-month open enrollment period (which starts when Part B begins), insurers must accept your application regardless of health conditions. You cannot be charged more or denied based on pre-existing conditions. Once this window closes, medical underwriting applies. If Medigap is on your radar at all, this is the time to compare and apply.',
        cta: true
      }
    };

    var steps = [
      {
        id: 'q1',
        question: 'Where are you in your Medicare journey?',
        options: [
          { label: 'I am new to Medicare (Part B just started or starts soon)', next: 'q_window' },
          { label: 'I have been on Medicare for a while', next: 'q_health' },
          { label: 'I am not on Medicare yet but planning ahead', next: 'q_health' }
        ]
      },
      {
        id: 'q_window',
        question: 'Did your Part B coverage start within the last 6 months?',
        options: [
          { label: 'Yes — Part B started recently', outcome: 'window_open' },
          { label: 'No — it has been more than 6 months', next: 'q_health' }
        ]
      },
      {
        id: 'q_health',
        question: 'How would you describe your overall health?',
        options: [
          { label: 'I have ongoing health conditions and see specialists regularly', next: 'q_budget' },
          { label: 'Generally healthy, occasional doctor visits', next: 'q_budget' },
          { label: 'Very healthy, rarely see a doctor', next: 'q_budget' }
        ]
      },
      {
        id: 'q_budget',
        question: 'How do you feel about a fixed monthly Medigap premium of roughly $120 to $220 per month?',
        options: [
          { label: 'That is manageable for me', next: 'q_travel' },
          { label: 'It is tight but possible', next: 'q_travel' },
          { label: 'That does not fit my budget', outcome: 'poor_fit_low_income' }
        ]
      },
      {
        id: 'q_travel',
        question: 'Do you travel frequently or split time between states?',
        options: [
          { label: 'Yes — I travel a lot or live in two places', outcome: 'good_fit' },
          { label: 'No — I stay in one area', next: 'q_providers' }
        ]
      },
      {
        id: 'q_providers',
        question: 'How important is it to see any doctor or specialist without a referral?',
        options: [
          { label: 'Very important — I want total provider freedom', outcome: 'good_fit' },
          { label: 'Somewhat important', outcome: 'maybe_fit' },
          { label: 'Not a priority — I am fine with a network', outcome: 'poor_fit_advantage' }
        ]
      }
    ];

    buildQuiz(wrap, steps, outcomes, '');
  }

  /* =========================================================================
   * 2. EMPLOYER COVERAGE VS MEDICARE COMPARISON
   * ========================================================================= */
  function initEmployerComparison(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Still covered by an employer health plan? This tool helps you compare whether to
          keep that coverage, drop it for Medicare, or coordinate both — based on your
          specific situation.
        </p>
        <div class="calc-fields">
          <label>How old are you?</label>
          <select id="ec-age">
            <option value="under65">Under 65</option>
            <option value="65">65</option>
            <option value="over65">Over 65</option>
          </select>

          <label>How many employees does the company have?</label>
          <select id="ec-size">
            <option value="large">20 or more employees</option>
            <option value="small">Fewer than 20 employees</option>
            <option value="unsure">Not sure</option>
          </select>

          <label>Whose job provides the coverage?</label>
          <select id="ec-source">
            <option value="mine">My own active employment</option>
            <option value="spouse">My spouse's active employment</option>
            <option value="retired">Retiree coverage from a former employer</option>
          </select>

          <label>Are you currently enrolled in Medicare?</label>
          <select id="ec-enrolled">
            <option value="no">No</option>
            <option value="part_a">Part A only</option>
            <option value="both">Part A and Part B</option>
          </select>

          <label>Are you contributing to an HSA?</label>
          <select id="ec-hsa">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label>Estimated monthly employer plan premium (your share)</label>
          <input type="number" id="ec-premium" placeholder="e.g. 350" min="0" max="3000">
          <small>Your out-of-pocket monthly cost, not what your employer pays</small>

          <label>Estimated annual deductible on employer plan</label>
          <input type="number" id="ec-deductible" placeholder="e.g. 1500" min="0" max="15000">
        </div>
        <button id="ec-calculate">Compare My Options</button>
        <div id="ec-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('ec-calculate').addEventListener('click', function () {
      var age = document.getElementById('ec-age').value;
      var size = document.getElementById('ec-size').value;
      var source = document.getElementById('ec-source').value;
      var enrolled = document.getElementById('ec-enrolled').value;
      var hsa = document.getElementById('ec-hsa').value;
      var premiumRaw = parseFloat(document.getElementById('ec-premium').value) || 0;
      var deductible = parseFloat(document.getElementById('ec-deductible').value) || 0;

      var result = document.getElementById('ec-result');
      result.style.display = 'block';

      // Medicare Part B 2025 standard premium
      var partBPremium = 185;
      var annualPartB = partBPremium * 12;
      var annualEmployer = premiumRaw * 12;

      var situation = [];
      var recommendation = [];
      var warnings = [];

      // Small employer — Medicare is primary
      if (size === 'small' && (age === '65' || age === 'over65')) {
        warnings.push('<strong class="calc-urgent">⚠ Critical: Small employer alert.</strong> If your employer has fewer than 20 employees, Medicare is your primary insurer at 65. Your employer plan pays secondary. If you are not enrolled in Medicare, your employer plan may pay as if Medicare were in place — leaving you responsible for what Medicare would have covered. Enroll in Part B now.');
      }

      // Retiree coverage
      if (source === 'retired') {
        situation.push('Retiree coverage is <strong>not</strong> considered active employer coverage for Medicare delay purposes. You should enroll in Medicare during your Initial Enrollment Period or a Special Enrollment Period. Retiree coverage typically works alongside Medicare, not instead of it.');
      }

      // Active large employer — can delay
      if (size === 'large' && (source === 'mine' || source === 'spouse') && enrolled === 'no') {
        situation.push('Your employer plan from an active large employer qualifies you to delay Medicare Part B without a late enrollment penalty. You can keep your employer coverage as primary and enroll in Medicare when employment or coverage ends.');
        recommendation.push('You generally do not need to enroll in Part B right now. Consider enrolling in Part A if it is free (most people qualify), since it costs nothing and provides a backup layer for hospital coverage.');
      }

      // HSA warning
      if (hsa === 'yes' && (enrolled === 'part_a' || enrolled === 'both')) {
        warnings.push('<strong class="calc-urgent">⚠ HSA conflict.</strong> You are enrolled in Medicare and still contributing to an HSA. This is not allowed. Contributions made after your Medicare enrollment date are excess contributions subject to a 6% IRS penalty. Stop contributions and consult a tax advisor.');
      }

      if (hsa === 'yes' && enrolled === 'no' && (age === '65' || age === 'over65')) {
        situation.push('You are contributing to an HSA. When you eventually enroll in Medicare Part A, your HSA contributions must stop. Stop contributing at least 6 months before your planned Medicare start date to avoid the retroactive coverage trap.');
      }

      // Cost comparison
      var html = '<h3>Employer Plan vs Medicare: Your Comparison</h3>';

      html += '<table class="calc-table">';
      html += '<tr><th>Coverage</th><th>Annual Premium Cost</th><th>Deductible</th></tr>';
      html += '<tr><td>Your employer plan</td><td>$' + annualEmployer.toLocaleString() + '/yr</td><td>$' + deductible.toLocaleString() + '</td></tr>';
      html += '<tr><td>Medicare Part B alone</td><td>$' + annualPartB.toLocaleString() + '/yr</td><td>$257 (Part B deductible)</td></tr>';
      html += '<tr><td>Medicare Part B + Plan G Medigap (est.)</td><td>~$' + (annualPartB + 1800).toLocaleString() + '/yr</td><td>$257 only</td></tr>';
      html += '<tr><td>Medicare Part B + Medicare Advantage (est.)</td><td>~$' + annualPartB.toLocaleString() + '–$' + (annualPartB + 600).toLocaleString() + '/yr</td><td>Varies by plan</td></tr>';
      html += '</table>';

      if (warnings.length > 0) {
        html += '<h4 class="calc-urgent">Action Required</h4>';
        warnings.forEach(function (w) { html += '<p>' + w + '</p>'; });
      }

      if (situation.length > 0) {
        html += '<h4>Your Situation</h4>';
        situation.forEach(function (s) { html += '<p>' + s + '</p>'; });
      }

      if (recommendation.length > 0) {
        html += '<h4>Recommendation</h4>';
        recommendation.forEach(function (r) { html += '<p>' + r + '</p>'; });
      }

      html += '<div class="quiz-cta"><p>Want a side-by-side comparison with real plan options in your area? A licensed Medicare agent can pull actual quotes at no cost to you.</p><a href="/contact" class="quiz-cta-btn">Get a Free Comparison</a></div>';

      html += '<p class="calc-disclaimer">This is a general educational comparison. Medicare coordination with employer plans involves specific rules that vary by employer size, plan type, and your situation. Verify your employer\'s coverage rules with your HR department and consult a licensed Medicare agent before making changes.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 3. MEDICARE COST SCENARIO PLANNER
   * ========================================================================= */
  function initCostScenarioPlanner(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Medicare costs vary a lot depending on how much healthcare you use. This tool
          runs three scenarios — a light year, a typical year, and a heavy year — so you
          can see what your estimated annual Medicare costs would look like under each plan
          type before you commit to one.
        </p>
        <div class="calc-fields">
          <label>Which plan type are you evaluating?</label>
          <select id="csp-plan">
            <option value="ma">Medicare Advantage ($0 premium plan)</option>
            <option value="ma_premium">Medicare Advantage (premium plan ~$50/mo)</option>
            <option value="medigap_g">Original Medicare + Medigap Plan G</option>
            <option value="medigap_n">Original Medicare + Medigap Plan N</option>
          </select>

          <label>Estimated monthly Medigap premium (if applicable)</label>
          <input type="number" id="csp-medigap-premium" placeholder="e.g. 165" min="0" max="500">
          <small>Leave blank if you selected a Medicare Advantage plan above</small>

          <label>Do you take regular prescription medications?</label>
          <select id="csp-rx">
            <option value="none">No or very few (generics only)</option>
            <option value="moderate">A few brand-name drugs</option>
            <option value="high">Multiple brand-name or specialty drugs</option>
          </select>
        </div>
        <button id="csp-calculate">Run My Cost Scenarios</button>
        <div id="csp-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('csp-calculate').addEventListener('click', function () {
      var plan = document.getElementById('csp-plan').value;
      var medigapPremiumInput = parseFloat(document.getElementById('csp-medigap-premium').value) || 0;
      var rx = document.getElementById('csp-rx').value;

      var result = document.getElementById('csp-result');
      result.style.display = 'block';

      var partB = 185 * 12; // $2,220/yr
      var partBDeductible = 257;

      // RX addon estimate for Part D
      var rxCostLight = { none: 120, moderate: 480, high: 1200 }[rx];
      var rxCostTypical = { none: 240, moderate: 960, high: 2400 }[rx];
      var rxCostHeavy = { none: 360, moderate: 1800, high: 4200 }[rx];

      var scenarios = {};

      if (plan === 'ma' || plan === 'ma_premium') {
        var maPremiumMonthly = plan === 'ma_premium' ? 50 : 0;
        var maPremiumAnnual = maPremiumMonthly * 12;
        // MA: copays per use case
        scenarios.light = partB + maPremiumAnnual + 400 + rxCostLight;   // few copays
        scenarios.typical = partB + maPremiumAnnual + 1800 + rxCostTypical; // moderate use
        scenarios.heavy = partB + maPremiumAnnual + 5500 + rxCostHeavy;   // near MOOP
        scenarios.moop = 'In-network MOOP typically $4,000–$7,000 (plan-specific)';
        scenarios.note = 'Medicare Advantage copays vary significantly by plan. These estimates use common in-network copay structures. Always check your specific plan\'s Summary of Benefits.';
      } else {
        // Medigap
        var mgPremium = (medigapPremiumInput || (plan === 'medigap_g' ? 165 : 130)) * 12;
        var planNCoinsurance = plan === 'medigap_n' ? 20 : 0; // Plan N has $20 office visit copay
        scenarios.light = partB + mgPremium + partBDeductible + rxCostLight + (planNCoinsurance * 4);
        scenarios.typical = partB + mgPremium + partBDeductible + rxCostTypical + (planNCoinsurance * 12);
        scenarios.heavy = partB + mgPremium + partBDeductible + rxCostHeavy + (planNCoinsurance * 24);
        scenarios.moop = 'No MOOP cap — but Medigap covers most cost-sharing, so real exposure is minimal';
        scenarios.note = plan === 'medigap_n'
          ? 'Plan N includes a $20 copay for office visits and $50 for ER visits that do not result in admission. Everything else (hospital, specialist, procedures) is covered after the Part B deductible.'
          : 'Plan G covers all cost-sharing after the annual Part B deductible of $257. No copays, no coinsurance, no network restrictions.';
      }

      var html = '<h3>Your Cost Scenarios</h3>';
      html += '<table class="calc-table">';
      html += '<tr><th>Scenario</th><th>Est. Annual Cost</th><th>What this assumes</th></tr>';
      html += '<tr><td><strong>Light year</strong></td><td>$' + Math.round(scenarios.light).toLocaleString() + '</td><td>A few routine visits, no major procedures</td></tr>';
      html += '<tr><td><strong>Typical year</strong></td><td>$' + Math.round(scenarios.typical).toLocaleString() + '</td><td>Regular visits, one specialist, basic labs</td></tr>';
      html += '<tr class="calc-total"><td><strong>Heavy year</strong></td><td>$' + Math.round(scenarios.heavy).toLocaleString() + '</td><td>Surgery, hospitalization, or serious illness</td></tr>';
      html += '</table>';

      html += '<p><strong>Out-of-pocket maximum:</strong> ' + scenarios.moop + '</p>';
      html += '<p><em>' + scenarios.note + '</em></p>';

      html += '<h4>What this means for you</h4>';
      var diff = scenarios.heavy - scenarios.light;
      html += '<p>The spread between your lightest and heaviest year is <strong>$' + Math.round(diff).toLocaleString() + '</strong>. ';
      if (plan.startsWith('ma')) {
        html += 'Medicare Advantage keeps your low-use years affordable, but a serious health event in a given year can bring costs close to your plan\'s out-of-pocket maximum. Knowing that number before you enroll matters.';
      } else {
        html += 'Medigap keeps your costs predictable across all three scenarios. Your biggest variable is prescription drug spending, which depends on your specific medications and the Part D plan you pair with your Medigap coverage.';
      }
      html += '</p>';

      html += '<div class="quiz-cta"><p>Want to run this comparison with actual plans available in your zip code? A licensed Medicare agent can pull real quotes at no cost.</p><a href="/contact" class="quiz-cta-btn">Get Real Plan Quotes</a></div>';
      html += '<p class="calc-disclaimer">Cost estimates are for general educational purposes based on 2025 Medicare figures. Actual costs depend on your specific plan, location, and healthcare usage. Prescription drug costs vary significantly by medication and plan formulary.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 4. LATE ENROLLMENT PENALTY CHECKER
   * ========================================================================= */
  function initLatePenaltyChecker(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Missing Medicare enrollment deadlines can result in permanent monthly penalties
          on your Part B and Part D premiums. This tool checks whether you are at risk
          for a penalty, estimates what you might owe, and tells you what to do next.
        </p>
        <div class="calc-fields">
          <label>Which penalty are you checking?</label>
          <select id="lp-type">
            <option value="both">Check both Part B and Part D</option>
            <option value="partb">Part B only</option>
            <option value="partd">Part D only</option>
          </select>

          <label>When did you turn 65? (or become Medicare-eligible)</label>
          <input type="month" id="lp-eligible" max="2030-12">
          <small>If eligible through disability, use the month your Medicare began</small>

          <label>When did you (or do you plan to) enroll in Part B?</label>
          <input type="month" id="lp-partb-enroll" max="2030-12">
          <small>Leave blank if you have not enrolled yet</small>

          <label>Did you have qualifying employer health coverage after 65?</label>
          <select id="lp-employer">
            <option value="no">No</option>
            <option value="yes_large">Yes — employer had 20 or more employees</option>
            <option value="yes_small">Yes — employer had fewer than 20 employees</option>
          </select>

          <label>If you had employer coverage, when did it end?</label>
          <input type="month" id="lp-employer-end" max="2030-12">
          <small>Leave blank if still active or not applicable</small>

          <label>When did you (or do you plan to) enroll in Part D?</label>
          <input type="month" id="lp-partd-enroll" max="2030-12">
          <small>Leave blank if not enrolled yet</small>

          <label>Did you have creditable drug coverage after becoming eligible?</label>
          <select id="lp-creditable">
            <option value="no">No</option>
            <option value="yes">Yes — employer plan, VA, TRICARE, or other qualifying coverage</option>
            <option value="unsure">Not sure</option>
          </select>
        </div>
        <button id="lp-calculate">Check My Penalty Risk</button>
        <div id="lp-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('lp-calculate').addEventListener('click', function () {
      var type = document.getElementById('lp-type').value;
      var eligibleStr = document.getElementById('lp-eligible').value;
      var partBStr = document.getElementById('lp-partb-enroll').value;
      var employer = document.getElementById('lp-employer').value;
      var employerEndStr = document.getElementById('lp-employer-end').value;
      var partDStr = document.getElementById('lp-partd-enroll').value;
      var creditable = document.getElementById('lp-creditable').value;

      var result = document.getElementById('lp-result');
      result.style.display = 'block';

      var partBStandard = 185;
      var partDBase = 36.78; // 2025 national base beneficiary premium

      function monthDiff(from, to) {
        var f = from.split('-').map(Number);
        var t = to.split('-').map(Number);
        return (t[0] - f[0]) * 12 + (t[1] - f[1]);
      }

      function today() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      }

      if (!eligibleStr) {
        result.innerHTML = '<p class="calc-urgent">Please enter your Medicare eligibility date to continue.</p>';
        return;
      }

      var html = '<h3>Your Late Enrollment Penalty Analysis</h3>';

      // ── PART B ──
      if (type === 'both' || type === 'partb') {
        html += '<h4>Medicare Part B</h4>';

        var coverageStartsB = employer === 'yes_large' && employerEndStr ? employerEndStr : eligibleStr;
        var enrolledB = partBStr || today();
        var gapMonthsB = Math.max(0, monthDiff(coverageStartsB, enrolledB));
        var penaltyPeriodsB = Math.floor(gapMonthsB / 12);

        if (employer === 'yes_large' && !partBStr) {
          html += '<p class="calc-good-news">✓ You have qualifying employer coverage from a large employer. You can delay Part B without a penalty while that coverage is active. Enroll within 8 months of losing that coverage to stay penalty-free.</p>';
        } else if (employer === 'yes_large' && employerEndStr && gapMonthsB <= 8) {
          html += '<p class="calc-good-news">✓ You enrolled within your 8-month Special Enrollment Period after losing employer coverage. No Part B penalty applies.</p>';
        } else if (penaltyPeriodsB === 0) {
          html += '<p class="calc-good-news">✓ No Part B penalty detected. You enrolled within your allowable window.</p>';
        } else {
          var bPenaltyPct = penaltyPeriodsB * 10;
          var bPenaltyMonthly = (partBStandard * bPenaltyPct / 100).toFixed(2);
          var bTotalPremium = (partBStandard + parseFloat(bPenaltyMonthly)).toFixed(2);
          html += '<table class="calc-table">';
          html += '<tr><td>Gap period (uncovered months)</td><td>' + gapMonthsB + ' months</td></tr>';
          html += '<tr><td>Full 12-month periods</td><td>' + penaltyPeriodsB + '</td></tr>';
          html += '<tr><td>Penalty percentage</td><td class="calc-urgent">' + bPenaltyPct + '%</td></tr>';
          html += '<tr><td>Monthly penalty amount</td><td class="calc-urgent">+$' + bPenaltyMonthly + '</td></tr>';
          html += '<tr class="calc-total"><td>Your estimated Part B premium</td><td>$' + bTotalPremium + '/month</td></tr>';
          html += '</table>';
          html += '<p class="calc-urgent">This penalty is permanent. Over 20 years, this adds approximately $' + Math.round(parseFloat(bPenaltyMonthly) * 240).toLocaleString() + ' in extra premiums.</p>';
        }
      }

      // ── PART D ──
      if (type === 'both' || type === 'partd') {
        html += '<h4>Medicare Part D</h4>';

        var enrolledD = partDStr || today();
        var gapMonthsD = Math.max(0, monthDiff(eligibleStr, enrolledD));

        if (creditable === 'yes') {
          html += '<p class="calc-good-news">✓ You had creditable drug coverage. As long as you have documentation, no Part D penalty should apply for that period.</p>';
        } else if (creditable === 'unsure') {
          html += '<p>⚠ You may have had creditable coverage. Check with your prior insurer — they are required to send you an annual creditable coverage notice. If you have that letter, keep it. If your coverage was not creditable, a penalty may apply.</p>';
        } else if (gapMonthsD < 63) {
          html += '<p class="calc-good-news">✓ Your gap is under 63 days. No Part D penalty applies.</p>';
        } else {
          var dPenaltyMonths = Math.floor(gapMonthsD / 1); // every full month counts
          var dPenaltyPct = dPenaltyMonths * 0.01;
          var dPenaltyMonthly = (dPenaltyPct * partDBase).toFixed(2);
          html += '<table class="calc-table">';
          html += '<tr><td>Uncovered months</td><td>' + dPenaltyMonths + '</td></tr>';
          html += '<tr><td>Penalty percentage</td><td class="calc-urgent">' + (dPenaltyPct * 100).toFixed(0) + '%</td></tr>';
          html += '<tr><td>Monthly penalty (based on $' + partDBase + ' base)</td><td class="calc-urgent">+$' + dPenaltyMonthly + '/month</td></tr>';
          html += '</table>';
          html += '<p>The Part D penalty is permanent and recalculated each year as the national base beneficiary premium changes. Your penalty amount may increase over time even if the percentage stays the same.</p>';
        }
      }

      html += '<div class="quiz-cta"><p>If you have a penalty or think you might, a licensed Medicare agent can review your situation and explain your options.</p><a href="/contact" class="quiz-cta-btn">Talk to an Agent</a></div>';
      html += '<p class="calc-disclaimer">Penalty calculations are estimates based on 2025 Medicare figures. Actual penalties are determined by CMS and Social Security based on your specific enrollment history. If you believe a penalty was assessed in error, you have the right to appeal.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 5. DOCTOR AND DRUG PRESCRIPTION ASSESSMENT
   * ========================================================================= */
  function initDoctorDrugAssessment(container) {
    if (!container) return;

    var drugs = [];
    var doctors = [];

    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Before you pick a Medicare plan, it is worth checking two things: whether your
          current doctors accept it, and whether your prescriptions are covered at a
          reasonable cost. This tool helps you gather and organize that information before
          you enroll or switch plans.
        </p>

        <h4>Step 1: Your Prescriptions</h4>
        <div id="drug-list"></div>
        <div class="calc-fields" style="flex-direction:row;align-items:flex-end;gap:0.5rem;flex-wrap:wrap;">
          <div>
            <label>Drug name</label>
            <input type="text" id="drug-name" placeholder="e.g. Metformin" style="max-width:180px;">
          </div>
          <div>
            <label>Dosage</label>
            <input type="text" id="drug-dose" placeholder="e.g. 500mg" style="max-width:100px;">
          </div>
          <div>
            <label>Frequency</label>
            <select id="drug-freq" style="max-width:140px;">
              <option value="daily">Once daily</option>
              <option value="twice">Twice daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="asneeded">As needed</option>
            </select>
          </div>
          <button id="drug-add" style="margin-top:1.25rem;">+ Add Drug</button>
        </div>

        <h4 style="margin-top:1.5rem;">Step 2: Your Doctors</h4>
        <div id="doctor-list"></div>
        <div class="calc-fields" style="flex-direction:row;align-items:flex-end;gap:0.5rem;flex-wrap:wrap;">
          <div>
            <label>Doctor name</label>
            <input type="text" id="doc-name" placeholder="e.g. Dr. Sarah Kim" style="max-width:180px;">
          </div>
          <div>
            <label>Specialty</label>
            <input type="text" id="doc-specialty" placeholder="e.g. Cardiologist" style="max-width:150px;">
          </div>
          <button id="doc-add" style="margin-top:1.25rem;">+ Add Doctor</button>
        </div>

        <div style="margin-top:2rem;">
          <button id="dda-generate">Generate My Assessment Checklist</button>
        </div>
        <div id="dda-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    function renderDrugs() {
      var el = document.getElementById('drug-list');
      if (drugs.length === 0) { el.innerHTML = '<p style="color:#888;font-size:0.9rem;">No drugs added yet.</p>'; return; }
      el.innerHTML = '<table class="calc-table"><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th></th></tr>' +
        drugs.map(function (d, i) {
          return '<tr><td>' + d.name + '</td><td>' + d.dose + '</td><td>' + d.freq + '</td>' +
            '<td><button data-i="' + i + '" class="drug-remove" style="background:none;border:none;color:#b00020;cursor:pointer;">Remove</button></td></tr>';
        }).join('') + '</table>';
      el.querySelectorAll('.drug-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { drugs.splice(parseInt(this.dataset.i), 1); renderDrugs(); });
      });
    }

    function renderDoctors() {
      var el = document.getElementById('doctor-list');
      if (doctors.length === 0) { el.innerHTML = '<p style="color:#888;font-size:0.9rem;">No doctors added yet.</p>'; return; }
      el.innerHTML = '<table class="calc-table"><tr><th>Doctor</th><th>Specialty</th><th></th></tr>' +
        doctors.map(function (d, i) {
          return '<tr><td>' + d.name + '</td><td>' + d.specialty + '</td>' +
            '<td><button data-i="' + i + '" class="doc-remove" style="background:none;border:none;color:#b00020;cursor:pointer;">Remove</button></td></tr>';
        }).join('') + '</table>';
      el.querySelectorAll('.doc-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { doctors.splice(parseInt(this.dataset.i), 1); renderDoctors(); });
      });
    }

    renderDrugs();
    renderDoctors();

    document.getElementById('drug-add').addEventListener('click', function () {
      var name = document.getElementById('drug-name').value.trim();
      var dose = document.getElementById('drug-dose').value.trim();
      var freq = document.getElementById('drug-freq').value;
      if (!name) return;
      drugs.push({ name: name, dose: dose || '—', freq: freq });
      document.getElementById('drug-name').value = '';
      document.getElementById('drug-dose').value = '';
      renderDrugs();
    });

    document.getElementById('doc-add').addEventListener('click', function () {
      var name = document.getElementById('doc-name').value.trim();
      var specialty = document.getElementById('doc-specialty').value.trim();
      if (!name) return;
      doctors.push({ name: name, specialty: specialty || 'General' });
      document.getElementById('doc-name').value = '';
      document.getElementById('doc-specialty').value = '';
      renderDoctors();
    });

    document.getElementById('dda-generate').addEventListener('click', function () {
      var result = document.getElementById('dda-result');
      result.style.display = 'block';

      var html = '<h3>Your Medicare Plan Shopping Checklist</h3>';
      html += '<p>Use this checklist when comparing Medicare Advantage or Part D plans on <a href="https://www.medicare.gov/plan-compare" target="_blank" rel="noopener">medicare.gov/plan-compare</a>.</p>';

      html += '<h4>Prescriptions to Check (' + drugs.length + ')</h4>';
      if (drugs.length === 0) {
        html += '<p style="color:#888;">No prescriptions entered. Add your drugs above to include them here.</p>';
      } else {
        html += '<table class="calc-table"><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>What to check</th></tr>';
        drugs.forEach(function (d) {
          html += '<tr><td>' + d.name + '</td><td>' + d.dose + '</td><td>' + d.freq + '</td>' +
            '<td>Formulary tier, copay, prior auth required?</td></tr>';
        });
        html += '</table>';
        html += '<p><strong>Tip:</strong> On medicare.gov/plan-compare, enter your drugs exactly as listed here. The tool will show you your estimated annual drug costs for each plan.</p>';
      }

      html += '<h4>Doctors to Check (' + doctors.length + ')</h4>';
      if (doctors.length === 0) {
        html += '<p style="color:#888;">No doctors entered. Add your providers above to include them here.</p>';
      } else {
        html += '<table class="calc-table"><tr><th>Doctor</th><th>Specialty</th><th>What to verify</th></tr>';
        doctors.forEach(function (d) {
          html += '<tr><td>' + d.name + '</td><td>' + d.specialty + '</td>' +
            '<td>In-network for the plan? Accepting new patients?</td></tr>';
        });
        html += '</table>';
        html += '<p><strong>Tip:</strong> For Medicare Advantage, always verify directly with the doctor\'s office that they accept the specific plan, not just "Medicare." Networks change and the plan directory can lag behind.</p>';
      }

      html += '<h4>Before You Enroll: Questions to Ask Any Plan</h4>';
      html += '<ul style="padding-left:1.25rem;line-height:1.9;">';
      html += '<li>Are all of my doctors in-network?</li>';
      html += '<li>Are all of my drugs on the formulary, and at what tier?</li>';
      html += '<li>What is the annual out-of-pocket maximum?</li>';
      html += '<li>Do any of my drugs require prior authorization or step therapy?</li>';
      html += '<li>Is my preferred pharmacy in-network?</li>';
      html += '<li>What is the copay or coinsurance for specialist visits?</li>';
      html += '</ul>';

      html += '<div class="quiz-cta"><p>A licensed Medicare agent can run a drug cost comparison across all plans in your area and check your doctors for you — at no cost.</p><a href="/contact" class="quiz-cta-btn">Get Help Comparing Plans</a></div>';
      html += '<p class="calc-disclaimer">This checklist is for informational purposes only. Always verify drug coverage and provider participation directly with the plan before enrolling.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 6. COBRA VS MEDICARE TOOL
   * ========================================================================= */
  function initCobraVsMedicare(container) {
    if (!container) return;

    var outcomes = {
      enroll_medicare: {
        title: 'Enroll in Medicare — do not rely on COBRA as your primary coverage.',
        body: 'COBRA does not count as qualifying employer coverage for Medicare delay purposes. If you are 65 or older and on COBRA, Medicare is the coverage you should have. Failing to enroll in Part B during your Initial Enrollment Period or Special Enrollment Period will likely result in a permanent late enrollment penalty. You can keep COBRA as a supplement after enrolling in Medicare, but Medicare must come first.',
        cta: true
      },
      sep_window: {
        title: 'You have a Special Enrollment Period — act within 8 months.',
        body: 'When active employer coverage ends, you get an 8-month window to enroll in Part B without a penalty. COBRA does not extend this window. The clock started when your job or active employer coverage ended, not when COBRA began. If more than 8 months have passed since you left your job, you may have a penalty. Enroll as soon as possible.',
        cta: true
      },
      cobra_can_supplement: {
        title: 'You can keep COBRA alongside Medicare.',
        body: 'Once you are enrolled in Medicare, COBRA becomes secondary coverage. It can help cover Medicare cost-sharing like deductibles and copays, essentially acting like a Medigap plan while it is in effect. COBRA coverage typically lasts 18 months from the qualifying event. When it ends, you can shop for a Medigap plan — though you may need to qualify medically at that point since your Medigap open enrollment window likely passed. Plan ahead.',
        cta: true
      },
      delay_ok: {
        title: 'You can delay Medicare while on active employer coverage.',
        body: 'If you are covered by an active employer group health plan from a company with 20 or more employees, you can delay Medicare without penalty. COBRA is not active employer coverage — but if you are still employed and covered by your own or your spouse\'s active group plan, you are in a protected delay window. When that employment ends, your 8-month Special Enrollment Period begins.',
        cta: true
      },
      needs_review: {
        title: 'Your situation needs a closer look.',
        body: 'The interaction between COBRA and Medicare involves timing, employer size, and enrollment history that can be hard to untangle. A licensed Medicare agent or your State Health Insurance Assistance Program (SHIP) counselor can review your specific dates and help you understand your options and any penalty risk.',
        cta: true
      }
    };

    var steps = [
      {
        id: 'q1',
        question: 'How old are you?',
        options: [
          { label: 'Under 65', next: 'q_under65_cobra' },
          { label: '65 or older', next: 'q_enrolled' }
        ]
      },
      {
        id: 'q_under65_cobra',
        question: 'Are you on COBRA right now?',
        options: [
          { label: 'Yes', answer: '<p>Under 65 and on COBRA: you are not yet Medicare-eligible based on age. COBRA coverage can bridge the gap until you turn 65. When you turn 65, your Medicare Initial Enrollment Period begins, and you will need to decide whether to enroll in Medicare and drop COBRA, or continue COBRA temporarily. A licensed agent can help you plan the transition before your 65th birthday.</p>', cta: true },
          { label: 'No', answer: '<p>You are under 65 and not on COBRA. Unless you qualify for Medicare through disability or a condition like ESRD or ALS, you are not yet Medicare-eligible. Your main options are marketplace coverage, a spouse\'s employer plan, or Medicaid if you qualify.</p>' }
        ]
      },
      {
        id: 'q_enrolled',
        question: 'Are you currently enrolled in Medicare?',
        options: [
          { label: 'Yes — I have Medicare', next: 'q_cobra_alongside' },
          { label: 'No — I am not on Medicare', next: 'q_why_not' }
        ]
      },
      {
        id: 'q_cobra_alongside',
        question: 'Are you also on COBRA right now?',
        options: [
          { label: 'Yes', outcome: 'cobra_can_supplement' },
          { label: 'No — just Medicare', answer: '<p>You are enrolled in Medicare without COBRA. If you are looking to reduce your cost-sharing, you may want to consider a Medigap plan or Medicare Advantage. A licensed agent can explain your options.</p>', cta: true }
        ]
      },
      {
        id: 'q_why_not',
        question: 'Why are you not enrolled in Medicare yet?',
        options: [
          { label: 'I am relying on COBRA instead of Medicare', outcome: 'enroll_medicare' },
          { label: 'I just lost active employer coverage and am within 8 months', outcome: 'sep_window' },
          { label: 'I am still on active employer coverage (not COBRA)', outcome: 'delay_ok' },
          { label: 'I am not sure about my situation', outcome: 'needs_review' }
        ]
      }
    ];

    var wrap = document.createElement('div');
    wrap.className = 'calc-wrap';
    wrap.innerHTML = '<p class="calc-desc">COBRA and Medicare interact in ways that trip up a lot of people. COBRA does not replace Medicare and does not extend your enrollment window. This tool helps you figure out what you should be doing right now.</p>';
    container.appendChild(wrap);
    buildQuiz(wrap, steps, outcomes, '');
  }

  /* =========================================================================
   * 7. DOCUMENT GATHERER BUILDER
   * ========================================================================= */
  function initDocumentGatherer(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Enrolling in Medicare or helping a parent navigate it involves gathering a
          surprising number of documents. Answer a few questions and this tool will build
          a personalized checklist of exactly what you need — and why.
        </p>
        <div class="calc-fields">
          <label>Who is this checklist for?</label>
          <select id="dg-who">
            <option value="self">Myself — I am enrolling in Medicare</option>
            <option value="parent">A parent or family member I am helping</option>
          </select>

          <label>What stage are you in?</label>
          <select id="dg-stage">
            <option value="first">Just enrolling in Medicare for the first time</option>
            <option value="switching">Switching from one Medicare plan to another</option>
            <option value="appeal">Filing an appeal or disputing a bill</option>
            <option value="msp">Applying for help with costs (Medicare Savings Program)</option>
            <option value="medigap">Applying for a Medigap (Medicare Supplement) plan</option>
          </select>

          <label>Do any of these apply?</label>
          <select id="dg-extra">
            <option value="none">None of the below</option>
            <option value="employer">Currently or recently had employer health insurance</option>
            <option value="disability">Enrolling through disability (under 65)</option>
            <option value="immigrant">Non-citizen or limited work history in the US</option>
            <option value="veteran">Veteran with VA benefits</option>
          </select>
        </div>
        <button id="dg-generate">Build My Document Checklist</button>
        <div id="dg-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('dg-generate').addEventListener('click', function () {
      var who = document.getElementById('dg-who').value;
      var stage = document.getElementById('dg-stage').value;
      var extra = document.getElementById('dg-extra').value;
      var result = document.getElementById('dg-result');
      result.style.display = 'block';

      var pronoun = who === 'self' ? 'you' : 'them';
      var possessive = who === 'self' ? 'your' : 'their';

      var docs = [];

      // Always needed
      docs.push({ doc: 'Social Security card or number', why: 'Required for all Medicare applications and enrollment forms.' });
      docs.push({ doc: 'Government-issued photo ID (driver\'s license or passport)', why: 'Required to verify identity for enrollment and benefit applications.' });
      docs.push({ doc: 'Birth certificate or proof of age', why: 'Medicare eligibility is age-based. Social Security may need this if age has not already been verified.' });

      if (stage === 'first' || stage === 'switching') {
        docs.push({ doc: 'Medicare card (red, white, and blue)', why: 'Shows ' + possessive + ' Medicare number and Part A/B effective dates. Required when enrolling in Advantage or Part D plans.' });
        docs.push({ doc: 'List of current prescriptions (name, dosage, frequency)', why: 'Needed to compare Part D plans and Medicare Advantage drug coverage on medicare.gov.' });
        docs.push({ doc: 'List of current doctors and their NPI numbers', why: 'Needed to verify in-network status when comparing Medicare Advantage plans.' });
      }

      if (stage === 'first') {
        docs.push({ doc: 'Social Security benefit award letter (if receiving SS)', why: 'Confirms benefit status. If receiving SS, Part A enrollment may be automatic.' });
      }

      if (stage === 'appeal') {
        docs.push({ doc: 'Medicare Summary Notice (MSN) or Explanation of Benefits (EOB)', why: 'The MSN or EOB contains the claim details, service dates, and denial reason needed to file an appeal.' });
        docs.push({ doc: 'Doctor\'s letter or clinical notes supporting the appeal', why: 'A written statement from ' + possessive + ' physician explaining the medical necessity of the denied service strengthens the appeal.' });
        docs.push({ doc: 'Copy of the denial notice', why: 'The denial letter contains the appeal deadline and instructions. Appeals must typically be filed within 120 days of the date on this notice.' });
      }

      if (stage === 'msp') {
        docs.push({ doc: 'Proof of income: Social Security award letter, pension statement, bank statements', why: 'Medicare Savings Programs have income limits. ' + (who === 'self' ? 'Your' : 'Their') + ' monthly income from all sources must be documented.' });
        docs.push({ doc: 'Proof of assets: bank account balances, investment account statements', why: 'Most MSP programs have asset limits. Recent statements (within 3 months) are typically required.' });
        docs.push({ doc: 'Proof of Medicare enrollment (Medicare card)', why: 'MSP eligibility requires being enrolled in Medicare Parts A and B.' });
      }

      if (stage === 'medigap') {
        docs.push({ doc: 'Medicare card showing Part B effective date', why: 'Medigap insurers need ' + possessive + ' Part B start date to determine if ' + pronoun + ' are in open enrollment (no health questions) or need underwriting.' });
        docs.push({ doc: 'Health history (list of diagnoses, medications, hospitalizations)', why: 'Required if applying outside open enrollment and the insurer requires medical underwriting.' });
        if (extra === 'employer') {
          docs.push({ doc: 'Letter of creditable coverage from prior employer plan', why: 'If ' + pronoun + ' lost employer coverage recently, this letter may trigger guaranteed issue rights for Medigap.' });
        }
      }

      if (extra === 'employer') {
        docs.push({ doc: 'Letter of creditable coverage from employer health plan', why: 'Needed to document that ' + pronoun + ' had qualifying coverage and can enroll in Part B or Part D without a late penalty.' });
        docs.push({ doc: 'COBRA election notice or coverage end date letter', why: 'Documents when active employer coverage ended. This starts ' + possessive + ' 8-month Special Enrollment Period for Part B.' });
      }

      if (extra === 'disability') {
        docs.push({ doc: 'SSDI award letter from Social Security', why: 'Documents disability status. Medicare becomes available after 24 months of SSDI. The award letter shows the benefit start date.' });
      }

      if (extra === 'immigrant') {
        docs.push({ doc: 'Proof of lawful permanent residence or citizenship (green card, naturalization certificate)', why: 'Medicare eligibility for non-citizens requires 5 years of lawful permanent residence. This must be documented.' });
        docs.push({ doc: 'Work history documentation (W-2s, SSA earnings record)', why: 'If work history is limited, this determines whether ' + pronoun + ' qualify for premium-free Part A or need to pay a premium.' });
      }

      if (extra === 'veteran') {
        docs.push({ doc: 'VA benefits letter or VA card', why: 'VA coverage is creditable for Part D purposes, so ' + pronoun + ' may be able to delay Part D without a penalty while VA coverage is active.' });
        docs.push({ doc: 'DD-214 (Certificate of Release or Discharge from Active Duty)', why: 'May be needed for certain VA-Medicare coordination situations or to establish veteran status.' });
      }

      var html = '<h3>Your Medicare Document Checklist</h3>';
      html += '<p>' + docs.length + ' documents identified for your situation.</p>';
      html += '<table class="calc-table"><tr><th>Document</th><th>Why you need it</th></tr>';
      docs.forEach(function (d) {
        html += '<tr><td><strong>' + d.doc + '</strong></td><td>' + d.why + '</td></tr>';
      });
      html += '</table>';

      html += '<h4>Tips for Gathering These Documents</h4>';
      html += '<ul style="padding-left:1.25rem;line-height:1.9;">';
      html += '<li>Request a copy of your Social Security earnings record at <a href="https://ssa.gov/myaccount" target="_blank" rel="noopener">ssa.gov/myaccount</a>.</li>';
      html += '<li>If you have lost your Medicare card, call 1-800-MEDICARE or log in to your MyMedicare account to request a replacement.</li>';
      html += '<li>If you need a copy of a prior employer\'s creditable coverage letter, contact that plan\'s HR department directly — they are required to provide it.</li>';
      html += '<li>Keep physical and digital copies of everything. Medicare appeals and MSP applications often require documentation that can be hard to reconstruct later.</li>';
      html += '</ul>';

      html += '<div class="quiz-cta"><p>Have all your documents and ready to enroll? A licensed Medicare agent can walk you through the process at no cost.</p><a href="/contact" class="quiz-cta-btn">Get Help Enrolling</a></div>';
      html += '<p class="calc-disclaimer">This checklist is for general educational purposes. Required documents may vary by state, situation, and the specific office or insurer processing your application. Always confirm document requirements directly with Medicare, Social Security, or your state Medicaid office.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 8. CAREGIVER CHECKLIST BUILDER
   * ========================================================================= */
  function initCaregiverChecklist(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Helping a parent or loved one navigate Medicare is a lot to manage. This tool
          builds a personalized action checklist based on where your family member is in
          the Medicare journey — so nothing falls through the cracks.
        </p>
        <div class="calc-fields">
          <label>How old is your family member?</label>
          <select id="cc-age">
            <option value="approaching">Approaching 65 (within 12 months)</option>
            <option value="just65">Just turned 65</option>
            <option value="enrolled">Already enrolled in Medicare</option>
            <option value="review">On Medicare and due for an annual review</option>
          </select>

          <label>Do they currently have health insurance?</label>
          <select id="cc-coverage">
            <option value="employer">Employer plan (still working)</option>
            <option value="cobra">COBRA</option>
            <option value="marketplace">Marketplace plan</option>
            <option value="none">No coverage</option>
            <option value="medicare_only">Medicare only</option>
          </select>

          <label>Do they take regular prescription medications?</label>
          <select id="cc-rx">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label>Do they see specialists or have chronic conditions?</label>
          <select id="cc-health">
            <option value="yes">Yes</option>
            <option value="no">No — generally healthy</option>
          </select>

          <label>Are you helping with finances or have power of attorney?</label>
          <select id="cc-poa">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <button id="cc-generate">Build My Caregiver Checklist</button>
        <div id="cc-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('cc-generate').addEventListener('click', function () {
      var age = document.getElementById('cc-age').value;
      var coverage = document.getElementById('cc-coverage').value;
      var rx = document.getElementById('cc-rx').value;
      var health = document.getElementById('cc-health').value;
      var poa = document.getElementById('cc-poa').value;
      var result = document.getElementById('cc-result');
      result.style.display = 'block';

      var items = [];

      if (age === 'approaching') {
        items.push({ priority: 'High', task: 'Confirm their Medicare eligibility date', detail: 'Medicare eligibility begins at 65. Their Initial Enrollment Period (IEP) starts 3 months before their 65th birthday. Missing this window can result in a permanent Part B penalty.' });
        items.push({ priority: 'High', task: 'Determine whether they can delay Medicare', detail: coverage === 'employer' ? 'They have employer coverage. If the employer has 20+ employees, they can delay Part B without penalty while that coverage is active.' : 'Based on their current coverage, they should likely enroll in Medicare during their IEP to avoid penalties.' });
        items.push({ priority: 'Medium', task: 'Research Medicare plan options in their area', detail: 'Use medicare.gov/plan-compare to view Medicare Advantage and Part D plans available at their address. Compare based on their doctors and medications.' });
        if (coverage === 'employer') {
          items.push({ priority: 'Medium', task: 'Get a creditable coverage letter from their employer', detail: 'This letter documents that their employer plan is creditable. They will need it to enroll in Part D penalty-free when they eventually leave employer coverage.' });
        }
      }

      if (age === 'just65') {
        items.push({ priority: 'High', task: 'Check their IEP window — it may be closing', detail: 'The Initial Enrollment Period is 7 months total: 3 months before, the birth month, and 3 months after. Enrollment in the last 3 months delays coverage start by 1–3 months.' });
        items.push({ priority: 'High', task: 'Decide between Medicare Advantage and Original Medicare + Medigap', detail: 'This is the most important coverage decision they will make. Use the Medicare Advantage vs Medigap Cost Calculator on this site to compare.' });
        if (rx === 'yes') {
          items.push({ priority: 'High', task: 'Enroll in Part D or a Medicare Advantage plan with drug coverage', detail: 'Going without drug coverage for more than 63 days after becoming eligible will result in a permanent Part D penalty.' });
        }
      }

      if (age === 'enrolled' || age === 'review') {
        items.push({ priority: 'High', task: 'Review their current plan during Annual Enrollment (Oct 15 – Dec 7)', detail: 'Plans change every year. Premiums, formularies, and networks are updated annually. A plan that was right last year may not be the best fit this year.' });
        items.push({ priority: 'Medium', task: 'Check whether their doctors are still in-network', detail: 'Provider networks change annually. Verify that all of their specialists accept the current plan before the AEP deadline.' });
        if (rx === 'yes') {
          items.push({ priority: 'Medium', task: 'Run a drug cost comparison for next year', detail: 'Medicare plan formularies change each year. Even if the same drugs are covered, the tier and copay can change. Use medicare.gov/plan-compare with their drug list.' });
        }
      }

      if (health === 'yes') {
        items.push({ priority: 'Medium', task: 'Verify specialist coverage and referral requirements', detail: 'If they see multiple specialists, a Medigap plan or Medicare Advantage plan with broad specialist access may serve them better. Confirm referral requirements for any Medicare Advantage plan.' });
        items.push({ priority: 'Low', task: 'Ask about prior authorization requirements', detail: 'Some Medicare Advantage plans require prior authorization for specialist visits, procedures, or certain drugs. Know this before they need care urgently.' });
      }

      if (poa === 'yes') {
        items.push({ priority: 'High', task: 'Ensure you have a valid, signed Power of Attorney on file with Medicare', detail: 'Without POA on file, Medicare and Social Security cannot discuss their account with you. Contact Medicare at 1-800-MEDICARE to add an authorized representative.' });
        items.push({ priority: 'Medium', task: 'Set up access to their MyMedicare account', detail: 'medicare.gov accounts allow you to view claims, print summary notices, and manage information. You can be added as an authorized representative.' });
      }

      items.push({ priority: 'Low', task: 'Check for Medicare Savings Program eligibility', detail: 'If their income is limited, they may qualify for a program that pays their Part B premium or reduces cost-sharing. Use the Medicare Savings Program Calculator on this site.' });
      items.push({ priority: 'Low', task: 'Ask about Extra Help for Part D costs', detail: 'Extra Help is a federal program that significantly reduces Part D drug costs for people with limited income and resources. Apply through Social Security at ssa.gov.' });

      var html = '<h3>Your Caregiver Action Checklist</h3>';
      html += '<p>' + items.length + ' action items based on their situation.</p>';

      ['High', 'Medium', 'Low'].forEach(function (level) {
        var filtered = items.filter(function (i) { return i.priority === level; });
        if (filtered.length === 0) return;
        var color = level === 'High' ? '#b00020' : level === 'Medium' ? '#0057a8' : '#444';
        html += '<h4 style="color:' + color + ';">' + level + ' Priority</h4>';
        html += '<table class="calc-table"><tr><th>Task</th><th>Why it matters</th></tr>';
        filtered.forEach(function (item) {
          html += '<tr><td><strong>' + item.task + '</strong></td><td>' + item.detail + '</td></tr>';
        });
        html += '</table>';
      });

      html += '<div class="quiz-cta"><p>Navigating Medicare for a family member is a lot to manage. A licensed Medicare agent can sit with you and your family member at no cost to review their options.</p><a href="/contact" class="quiz-cta-btn">Schedule a Family Consultation</a></div>';
      html += '<p class="calc-disclaimer">This checklist is educational and based on general Medicare rules. Individual situations vary. Always verify enrollment deadlines and plan details at medicare.gov or through a licensed Medicare professional.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * 9. MEDICARE TRAVEL NETWORK RISK ASSESSMENT
   * ========================================================================= */
  function initTravelNetworkRisk(container) {
    if (!container) return;

    var outcomes = {
      high_risk: {
        title: 'High network risk — your travel plans may conflict with your coverage.',
        body: 'Medicare Advantage plans use regional or local networks. If you spend significant time outside your plan\'s service area, you may only have access to emergency care at in-network rates. Routine care outside the network could cost you full price or be denied entirely. Medigap (Medicare Supplement) plans work with any Medicare-accepting doctor in the United States, which makes them a much better fit for frequent travelers or people who split time between states.',
        cta: true
      },
      moderate_risk: {
        title: 'Moderate network risk — some planning needed.',
        body: 'Your situation carries some network risk. If you are on Medicare Advantage, confirm that your plan has national or broad regional coverage, or that your travel destinations fall within your plan\'s service area. Some Medicare Advantage plans offer national PPO networks that provide in-network access across the country, which reduces this risk significantly. Ask your plan for a service area map before you travel.',
        cta: true
      },
      low_risk_ma: {
        title: 'Your travel patterns are likely manageable with Medicare Advantage.',
        body: 'Short or infrequent trips generally do not pose a major network problem. Most Medicare Advantage plans cover emergency and urgent care nationwide. For planned care while traveling, call your plan in advance to confirm what is covered and at what cost-sharing level outside your service area.',
        cta: false
      },
      low_risk_medigap: {
        title: 'Medigap is the right coverage for your travel lifestyle.',
        body: 'Medigap plans cover services at any provider that accepts Original Medicare, anywhere in the United States. Since virtually all hospitals and most doctors accept Medicare, you have broad access wherever you travel. For international travel, Plans C, D, F, G, M, and N include emergency care abroad (80% of covered costs after a $250 deductible, up to a $50,000 lifetime maximum). Check your specific plan for details.',
        cta: true
      },
      international: {
        title: 'International travel requires special attention.',
        body: 'Original Medicare and most Medicare Advantage plans do not cover care outside the United States. Some Medigap plans (C, D, F, G, M, N) include a foreign travel emergency benefit that covers 80% of emergency costs abroad after a $250 deductible, up to a $50,000 lifetime limit. For extended international travel, a dedicated travel health insurance policy may be needed to supplement your Medicare coverage. Talk to your agent about the right combination.',
        cta: true
      }
    };

    var steps = [
      {
        id: 'q1',
        question: 'What type of Medicare coverage do you currently have or are considering?',
        options: [
          { label: 'Medicare Advantage', next: 'q_ma_travel' },
          { label: 'Original Medicare + Medigap', outcome: 'low_risk_medigap' },
          { label: 'Original Medicare only (no Medigap)', next: 'q_om_travel' },
          { label: 'Not yet enrolled — evaluating options', next: 'q_travel_style' }
        ]
      },
      {
        id: 'q_ma_travel',
        question: 'How often do you travel or spend time outside your home area?',
        options: [
          { label: 'Rarely — a trip or two a year', next: 'q_international' },
          { label: 'Several times a year for a week or more', next: 'q_snow_bird' },
          { label: 'I split time between two states or travel frequently', outcome: 'high_risk' }
        ]
      },
      {
        id: 'q_snow_bird',
        question: 'Do you travel to the same region or destination regularly?',
        options: [
          { label: 'Yes — a specific state or region', outcome: 'moderate_risk' },
          { label: 'No — varies a lot', outcome: 'high_risk' }
        ]
      },
      {
        id: 'q_om_travel',
        question: 'Do you have any supplemental coverage for cost-sharing?',
        options: [
          { label: 'No — I pay my own deductibles and coinsurance', answer: '<p>Without a Medigap plan, you have no cap on out-of-pocket costs under Original Medicare. While you can see any Medicare-accepting provider nationwide, a serious illness or hospital stay could leave you with very large bills. Consider a Medigap plan to cap your exposure.</p>', cta: true },
          { label: 'Yes — Medicaid or other assistance', outcome: 'low_risk_medigap' }
        ]
      },
      {
        id: 'q_travel_style',
        question: 'What best describes your travel habits in retirement?',
        options: [
          { label: 'Mostly staying home, short trips occasionally', next: 'q_international' },
          { label: 'Frequent domestic travel or living in two states', outcome: 'high_risk' },
          { label: 'Significant international travel', outcome: 'international' }
        ]
      },
      {
        id: 'q_international',
        question: 'Do you travel internationally?',
        options: [
          { label: 'Yes — at least once a year', outcome: 'international' },
          { label: 'No — domestic only', outcome: 'low_risk_ma' }
        ]
      }
    ];

    var wrap = document.createElement('div');
    wrap.className = 'calc-wrap';
    wrap.innerHTML = '<p class="calc-desc">Medicare coverage works differently depending on how often you travel and where you go. Medicare Advantage plans have networks and service areas. Medigap plans work with any Medicare-accepting provider nationwide. This tool assesses your network risk based on your travel habits.</p>';
    container.appendChild(wrap);
    buildQuiz(wrap, steps, outcomes, '');
  }

  /* =========================================================================
   * 10. MEDICARE PART D SHOPPING GUIDE TOOL
   * ========================================================================= */
  function initPartDShopping(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="calc-wrap">
        <p class="calc-desc">
          Part D drug plans are not all the same — and picking the wrong one can cost you
          significantly more than the cheapest premium would suggest. This tool guides you
          through the key factors to evaluate when shopping for a Part D plan, so you can
          make an informed comparison on medicare.gov.
        </p>

        <div class="calc-fields">
          <label>Are you currently enrolled in Part D?</label>
          <select id="pd-status">
            <option value="new">No — first time enrolling</option>
            <option value="switching">Yes — thinking about switching plans</option>
            <option value="reviewing">Yes — reviewing my current plan for next year</option>
          </select>

          <label>Do you take brand-name or specialty medications?</label>
          <select id="pd-rx-type">
            <option value="generics">Mostly or all generics</option>
            <option value="some_brand">Some brand-name drugs</option>
            <option value="specialty">Specialty or high-cost medications</option>
          </select>

          <label>How do you typically get your prescriptions?</label>
          <select id="pd-pharmacy">
            <option value="retail">Local retail pharmacy</option>
            <option value="mail">Mail order (90-day supply)</option>
            <option value="both">Both retail and mail order</option>
          </select>

          <label>Are you enrolled in Extra Help (Low Income Subsidy)?</label>
          <select id="pd-lis">
            <option value="no">No</option>
            <option value="yes">Yes</option>
            <option value="unsure">Not sure</option>
          </select>
        </div>
        <button id="pd-generate">Get My Shopping Guide</button>
        <div id="pd-result" class="calc-result" style="display:none;"></div>
      </div>
    `;

    document.getElementById('pd-generate').addEventListener('click', function () {
      var status = document.getElementById('pd-status').value;
      var rxType = document.getElementById('pd-rx-type').value;
      var pharmacy = document.getElementById('pd-pharmacy').value;
      var lis = document.getElementById('pd-lis').value;
      var result = document.getElementById('pd-result');
      result.style.display = 'block';

      var html = '<h3>Your Part D Shopping Guide</h3>';

      // LIS first — big impact
      if (lis === 'yes') {
        html += '<p class="calc-good-news">✓ You have Extra Help. Your Part D costs are already significantly reduced. When choosing a plan, focus on whether your specific drugs are on the formulary and whether your preferred pharmacy is in the plan\'s network. Premiums matter less for you since Extra Help subsidizes them.</p>';
      } else if (lis === 'unsure') {
        html += '<p>⚠ You may qualify for Extra Help and not know it. Extra Help pays for most Part D premiums, deductibles, and copays for people with limited income and resources. Apply at ssa.gov or through your local Social Security office. It takes about 30 minutes and can save you thousands per year.</p>';
      }

      html += '<h4>The 5 Things That Actually Determine Your True Cost</h4>';

      html += '<table class="calc-table">';
      html += '<tr><th>#</th><th>Factor</th><th>What to look for</th></tr>';
      html += '<tr><td>1</td><td><strong>Monthly premium</strong></td><td>The most visible cost — but not the most important one for heavy drug users. A $0 premium plan with high drug copays can cost more than a $45 premium plan with lower copays.</td></tr>';
      html += '<tr><td>2</td><td><strong>Annual deductible</strong></td><td>In 2025, the maximum Part D deductible is $590. Some plans waive it for generics. If you take brand-name drugs, a plan with a low or $0 deductible saves you money right at the start of the year.</td></tr>';
      html += '<tr><td>3</td><td><strong>Drug formulary</strong></td><td>Each plan has its own drug list (formulary) with different tiers and copays. A drug covered at Tier 2 ($15) on one plan may be Tier 4 ($100+) on another. Always check the formulary for your specific drugs.</td></tr>';
      html += '<tr><td>4</td><td><strong>Pharmacy network</strong></td><td>Part D plans negotiate preferred pricing with specific pharmacies. Your copay at a preferred pharmacy can be significantly lower than at a non-preferred one. Check whether your current pharmacy is preferred — not just in-network.</td></tr>';
      html += '<tr><td>5</td><td><strong>Coverage gap and catastrophic phase</strong></td><td>Since 2024, the Part D coverage gap ("donut hole") has changed significantly. In 2025, your out-of-pocket maximum is $2,000 — after which you pay nothing for the rest of the year. This cap matters most if you take high-cost medications.</td></tr>';
      html += '</table>';

      html += '<h4>Tailored Tips for Your Situation</h4>';

      if (rxType === 'generics') {
        html += '<p>Since you mainly take generics, focus on plans with low or no deductible for generic drugs and preferred pricing at your pharmacy. Many low-premium plans work well for generic-only users. Premiums matter more for you since your per-drug costs are low.</p>';
      } else if (rxType === 'some_brand') {
        html += '<p>Brand-name drugs land on higher tiers (Tier 3–4) with higher copays. Run the drug cost comparison on medicare.gov using your actual drug list to find which plans place your specific brands on lower tiers. A slightly higher premium often pays for itself in lower drug copays.</p>';
      } else if (rxType === 'specialty') {
        html += '<p>Specialty drugs are Tier 5 on most formularies — the highest copay tier. Focus on whether your specific specialty drugs are on the formulary at all, what tier they are placed on, and whether the plan requires prior authorization or step therapy before covering them. The $2,000 out-of-pocket cap in 2025 is particularly valuable for specialty drug users.</p>';
      }

      if (pharmacy === 'mail') {
        html += '<p>Mail order pharmacies almost always offer lower copays than retail, especially for 90-day supplies. Make sure the plan\'s preferred mail order pharmacy can fill your specific medications and that the plan does not require a prior authorization that would slow down your first fill.</p>';
      } else if (pharmacy === 'retail') {
        html += '<p>Check the plan\'s preferred retail pharmacy list carefully. The difference between a preferred and non-preferred pharmacy within the same plan can be $10 to $40 per drug per month. CVS, Walgreens, and Walmart are preferred pharmacies for many plans — but this varies.</p>';
      }

      if (status === 'switching') {
        html += '<p><strong>Switching plans:</strong> You can switch Part D plans during the Annual Enrollment Period (October 15 – December 7). Your new coverage starts January 1. If you are switching to a plan with a deductible, remember that the clock resets on January 1 — you will owe the deductible before coverage kicks in.</p>';
      }

      if (status === 'reviewing') {
        html += '<p><strong>Annual review tip:</strong> Do not assume your current plan is still the best fit. Formularies, premiums, and pharmacy networks change every year. Even if your plan seems fine, running the drug cost comparison on medicare.gov each October can surface a better option in a few minutes.</p>';
      }

      html += '<h4>How to Compare Plans on Medicare.gov</h4>';
      html += '<ol style="padding-left:1.25rem;line-height:1.9;">';
      html += '<li>Go to <a href="https://www.medicare.gov/plan-compare" target="_blank" rel="noopener">medicare.gov/plan-compare</a></li>';
      html += '<li>Enter your zip code and indicate you want to see drug plans</li>';
      html += '<li>Add your prescriptions (drug name, dosage, and quantity per fill)</li>';
      html += '<li>Enter your preferred pharmacy</li>';
      html += '<li>Sort results by "lowest drug + premium cost" — not just lowest premium</li>';
      html += '<li>Check the Star Rating (4+ stars is a reliable target)</li>';
      html += '</ol>';

      html += '<div class="quiz-cta"><p>Want help running a drug cost comparison across every plan in your area? A licensed Medicare agent can do this for you at no cost.</p><a href="/contact" class="quiz-cta-btn">Get Help Comparing Part D Plans</a></div>';
      html += '<p class="calc-disclaimer">Part D plan details, formularies, and costs change annually. Always verify your plan\'s drug coverage for the upcoming year at medicare.gov. Information here reflects 2025 Medicare Part D rules.</p>';

      result.innerHTML = html;
    });
  }

  /* =========================================================================
   * REGISTRATION & SLUG MAP EXTENSION
   * Attach each tool to a div ID when the page loads.
   * ========================================================================= */
  var TOOL_MAP = {
    'medigap-fit':                 initMedigapFit,
    'employer-coverage-comparison': initEmployerComparison,
    'cost-scenario-planner':       initCostScenarioPlanner,
    'late-penalty-checker':        initLatePenaltyChecker,
    'doctor-drug-assessment':      initDoctorDrugAssessment,
    'cobra-vs-medicare':           initCobraVsMedicare,
    'document-gatherer':           initDocumentGatherer,
    'caregiver-checklist':         initCaregiverChecklist,
    'travel-network-risk':         initTravelNetworkRisk,
    'part-d-shopping':             initPartDShopping
  };

  var SLUG_EXTENSIONS = {
    'medigap-fit-assessment':              'medigap-fit',
    'employer-coverage-vs-medicare':       'employer-coverage-comparison',
    'employer-coverage-vs-medicare-comparison': 'employer-coverage-comparison',
    'medicare-cost-scenario-planner':      'cost-scenario-planner',
    'late-enrollment-penalty-checker':     'late-penalty-checker',
    'doctor-and-drug-assessment':          'doctor-drug-assessment',
    'doctor-drug-prescription-assessment': 'doctor-drug-assessment',
    'cobra-vs-medicare':                   'cobra-vs-medicare',
    'cobra-vs-medicare-tool':              'cobra-vs-medicare',
    'document-gatherer':                   'document-gatherer',
    'document-gatherer-builder':           'document-gatherer',
    'caregiver-checklist':                 'caregiver-checklist',
    'caregiver-checklist-builder':         'caregiver-checklist',
    'medicare-travel-network-risk':        'travel-network-risk',
    'medicare-travel-network-risk-assessment': 'travel-network-risk',
    'medicare-part-d-shopping-tool':       'part-d-shopping',
    'part-d-shopping-tool':                'part-d-shopping'
  };

  // Auto-init: find matching div by ID, or find div with data-tool attribute,
  // or detect from URL slug
  function autoInit() {
    // Check div IDs directly
    Object.keys(TOOL_MAP).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        TOOL_MAP[id](el);
        return;
      }
      // data-tool attribute fallback
      el = document.querySelector('[data-tool="' + id + '"]');
      if (el) {
        el.id = id;
        TOOL_MAP[id](el);
      }
    });

    // URL slug fallback (same pattern as main calculator-loader.js)
    var slug = window.location.pathname.split('/').filter(Boolean).pop();
    var divId = SLUG_EXTENSIONS[slug];
    if (divId && TOOL_MAP[divId]) {
      var el = document.getElementById(divId);
      if (!el) {
        el = document.querySelector('.div-id-field');
        if (el) { el.id = divId; }
      }
      if (el && !el.dataset.initialized) {
        el.dataset.initialized = '1';
        TOOL_MAP[divId](el);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  function normalizeLegacyInternalLinks() {
    var statePlanHubs = {
      '/medicare/plans/ohio': true,
      '/medicare/plans/utah': true,
      '/medicare/plans/pennsylvania': true
    };

    var leafPattern = /^\/medicare\/(zip-codes|question|plan-type|plan|doctor|provider|carrier|carriers|specialty|specialties)\/[^/?#]+\/$/;

    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function(anchor) {
      var raw = anchor.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|sms):/i.test(raw)) return;

      var url;
      try {
        url = new URL(raw, window.location.origin);
      } catch (e) {
        return;
      }

      var isInternal = raw.charAt(0) === '/' || url.hostname === window.location.hostname || url.hostname === 'www.restingsycamore.com' || url.hostname === 'restingsycamore.com';
      if (!isInternal) return;

      var nextPath = url.pathname.replace(/\/+/g, '/');

      if (nextPath.indexOf('/medicare/plans/') === 0 && !statePlanHubs[nextPath]) {
        nextPath = nextPath.replace('/medicare/plans/', '/medicare/plan/');
      }
      if (nextPath.indexOf('/medicare/plan-types/') === 0) {
        nextPath = nextPath.replace('/medicare/plan-types/', '/medicare/plan-type/');
      }
      if (nextPath.indexOf('/resources/calculators/') === 0) {
        nextPath = nextPath.replace('/resources/calculators/', '/medicare/resources/interactive-tools/');
      }
      if (leafPattern.test(nextPath)) {
        nextPath = nextPath.slice(0, -1);
      }

      if (nextPath === url.pathname) return;

      var next = nextPath + url.search + url.hash;
      if (/^https?:\/\//i.test(raw)) {
        next = url.origin + next;
      } else if (raw.indexOf('//') === 0) {
        next = '//' + url.host + next;
      }
      anchor.setAttribute('href', next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeLegacyInternalLinks);
  } else {
    normalizeLegacyInternalLinks();
  }
  CALCULATORS['medigap-fit'] = function(container) { initMedigapFit(container || document.getElementById('medigap-fit')); };
  CALCULATORS['employer-coverage-comparison'] = function(container) { initEmployerComparison(container || document.getElementById('employer-coverage-comparison')); };
  CALCULATORS['cost-scenario-planner'] = function(container) { initCostScenarioPlanner(container || document.getElementById('cost-scenario-planner')); };
  CALCULATORS['late-penalty-checker'] = function(container) { initLatePenaltyChecker(container || document.getElementById('late-penalty-checker')); };
  CALCULATORS['doctor-drug-assessment'] = function(container) { initDoctorDrugAssessment(container || document.getElementById('doctor-drug-assessment')); };
  CALCULATORS['cobra-vs-medicare'] = function(container) { initCobraVsMedicare(container || document.getElementById('cobra-vs-medicare')); };
  CALCULATORS['document-gatherer'] = function(container) { initDocumentGatherer(container || document.getElementById('document-gatherer')); };
  CALCULATORS['caregiver-checklist'] = function(container) { initCaregiverChecklist(container || document.getElementById('caregiver-checklist')); };
  CALCULATORS['travel-network-risk'] = function(container) { initTravelNetworkRisk(container || document.getElementById('travel-network-risk')); };
  CALCULATORS['part-d-shopping'] = function(container) { initPartDShopping(container || document.getElementById('part-d-shopping')); };

  var SLUG_MAP = {
    'hsa-compatibility': 'hsa-calculator',
    'iep-calculator': 'iep-calculator',
    'initial-enrollment-period': 'iep-calculator',
    'irmaa-calculator': 'irmaa-calculator',
    'medicare-advantage-vs-medigap-cost': 'cost-calculator',
    'medicare-savings-program': 'msp-calculator',
    'medigap-open-enrollment': 'medigap-oe-calculator',
    'part-a-premium': 'parta-calculator',
    'part-b-penalty': 'partb-calculator',
    'part-d-penalty': 'partd-calculator',
    'special-enrollment-period': 'sep-finder',
    'when-should-i-sign-up-for-medicare': 'signup-quiz',
    'm3p-payment-smoothing': 'm3p-calculator',
    'm3p-calculator': 'm3p-calculator',
    'medicare-prescription-payment-plan-m3p-calculator': 'm3p-calculator',
    'medigap-fit-assessment': 'medigap-fit',
    'employer-coverage-vs-medicare': 'employer-coverage-comparison',
    'medicare-cost-scenario-planner': 'cost-scenario-planner',
    'late-enrollment-penalty-checker': 'late-penalty-checker',
    'doctor-and-drug-assessment': 'doctor-drug-assessment',
    'cobra-vs-medicare': 'cobra-vs-medicare',
    'document-gatherer': 'document-gatherer',
    'caregiver-checklist': 'caregiver-checklist',
    'medicare-travel-network-risk': 'travel-network-risk',
    'medicare-part-d-shopping-tool': 'part-d-shopping',
  };

  // Detect current page from URL slug
  var slug = window.location.pathname.split('/').pop();
  var divId = SLUG_MAP[slug];
  if (divId && CALCULATORS[divId]) {
    // Ensure the target div exists
    var container = document.getElementById(divId);
    if (!container) {
      // Try to find div-id-field and set its id correctly
      var placeholder = document.querySelector('.div-id-field');
      if (placeholder) { placeholder.id = divId; }
    }
    CALCULATORS[divId]();
  }
})();