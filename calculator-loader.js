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