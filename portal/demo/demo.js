(function () {
  'use strict';

  var property = {
    name: 'Pine Ridge Demonstration Tract',
    location: 'South Alabama',
    acres: 7645,
    habitats: [
      { name: 'Pine / evergreen forest', acres: 6502, percent: 85.0, condition: 'Active management', color: '#5e7954', meaning: 'Dominant upland matrix after establishment of 30 acres of permanent wildlife openings; 1,258 acres have received thinning or selective midstory work.' },
      { name: 'Woody wetland', acres: 512, percent: 6.7, condition: 'Protected', color: '#3e7882', meaning: 'Remaining natural hydrologic and security cover outside the four managed waterfowl impoundments; equipment exclusions and buffers remain in effect.' },
      { name: 'Open / developed', acres: 324, percent: 4.2, condition: 'Managed access', color: '#b79a61', meaning: 'Rights-of-way, facilities, and the primary access network are inspected and maintained separately from managed wildlife openings.' },
      { name: 'Open water', acres: 144, percent: 1.9, condition: 'Protect', color: '#3f88a4', meaning: 'Reservoir and pond surface; retain shoreline protection and stable crossings.' },
      { name: 'Shrub / grass / barren', acres: 52, percent: 0.7, condition: 'Retain and rotate', color: '#c6ae57', meaning: 'Original mapped young cover; treatment within adjacent pine now brings the rotating early-cover footprint to 302 acres.' },
      { name: 'Mixed forest', acres: 35, percent: 0.5, condition: 'Retain diversity', color: '#726f4a', meaning: 'Potential mast and diversity component; retain quality hardwoods and soft mast.' },
      { name: 'Wildlife openings', acres: 30, percent: 0.4, condition: 'Managed', color: '#a99345', meaning: 'Permanent openings distributed across the tract and maintained with planting, mowing, disking, or prescribed fire according to site objectives.' },
      { name: 'Waterfowl impoundments', acres: 46, percent: 0.6, condition: 'Managed wetland', color: '#4f9a91', meaning: 'Four managed shallow-water units with seasonal drawdown, moist-soil vegetation, and protected levee and water-control access.' }
    ],
    overlays: [
      ['NWI non-riverine wetland', '472 acres', '6.2%', 'Documented planning constraint; overlaps the land-cover classes.'],
      ['Field-confirmed bedding zones', '412 acres', '5.4%', 'Five low-entry zones with repeated bed, track, camera, and winter thermal evidence.'],
      ['Managed early-cover footprint', '302 acres', '4.0%', 'Current rotating footprint, increased from the 31-acre mapped baseline.'],
      ['Monitored travel corridors', '4 routes', '—', 'All four routes have repeat camera or field-sign use; wooded screening is retained.'],
      ['Native / gravel forest roads', '31 segments', '—', 'Eighteen maintain, seven seasonal, and six closed or scheduled for restoration.']
    ],
    projects: [
      ['2024', 'Baseline field inventory and monitoring network', 'Entire tract', 'Complete', 'Verified stands, roads, wetlands, five bedding zones, four corridors, 36 photo points, and 12 thermal survey blocks'],
      ['2024', 'Prescribed fire and understory recovery', '612 acres', 'Complete', 'First entry completed with security-cover refugia retained'],
      ['2024', 'Thinning and selective midstory control', '386 acres', 'Complete', 'Closed-canopy uplands opened toward the 60–80 ft²/ac basal-area target'],
      ['2025', 'Expanded prescribed-fire rotation', '1,148 acres', 'Complete', 'Burned nine units; permanent vegetation plots documented first-year response'],
      ['2025', 'Thinning, early cover, and openings', '762 acres', 'Complete', '612 acres thinned, 132 acres of young cover established, and 18 acres of permanent openings completed'],
      ['2026', 'Winter thermal drone survey', '2,690 sampled acres', 'Complete', 'Second standardized survey completed across 13 flight blocks'],
      ['2026', 'Prescribed fire', '924 acres', 'Complete', 'Seven units completed; unburned pockets retained in each treatment block'],
      ['2026', 'Thinning, early cover, and openings', '333 acres to date', 'Active', '260 acres thinned, 61 acres of young cover treated, and 12 acres of openings completed through July'],
      ['2026', 'Waterfowl impoundment program', '46 acres / 4 units', 'Complete', 'Levees, water-control structures, seasonal drawdown zones, and monitoring points established']
    ],
    years: [
      [2024, 'Complete', '612 ac', '386 ac', '78 ac', 'Established the field baseline, monitoring stations, and first treatment blocks.'],
      [2025, 'Complete', '1,148 ac', '612 ac', '132 ac + 18 ac openings', 'Expanded the burn rotation and confirmed use of all four travel corridors.'],
      [2026, 'Active', '924 ac to date', '260 ac to date', '61 ac + 12 ac openings', 'Second thermal survey and harvest analysis are complete; summer vegetation monitoring is active.'],
      [2027, 'Planned', '1,200–1,600 ac', '500–700 ac', '100–150 ac', 'Re-enter priority fire units and shift work toward underrepresented areas.'],
      [2028, 'Planned', '1,200–1,600 ac', 'Maintenance / gap fill', 'Reach 600–760 ac', 'Complete the outcome review and revise the next five-year cycle.']
    ],
    budgets: [
      [2024, 'Field verification and program foundation', 325000, 92000, 233000],
      [2025, 'First full-scale treatment year', 385000, 140000, 245000],
      [2026, 'Fire rotation and habitat expansion', 365000, 126000, 239000],
      [2027, 'Adaptive treatment and access work', 330000, 105000, 225000],
      [2028, 'Complete targets and next-cycle inventory', 305000, 82000, 223000]
    ],
    thermalSurveys: [
      ['Winter 2025', 'Feb. 20–22, 2025', '2,520 ac / 12 blocks', 342, '306–381', '44.7', '1:2.3', '0.51'],
      ['Winter 2026', 'Feb. 18–21, 2026', '2,690 ac / 13 blocks', 371, '333–414', '48.5', '1:2.0', '0.54']
    ],
    deerHarvest: [
      ['2024–25', 72, 26, 46, '9.4', '2.7', '38%', 122, 38, 88, 36],
      ['2025–26', 81, 30, 51, '10.6', '3.3', '57%', 134, 44, 93, 41]
    ],
    deerAgeRows: [
      ['2024–25', 'Antlered buck', '1.5', 9, 100, 32],
      ['2024–25', 'Antlered buck', '2.5', 7, 122, 37],
      ['2024–25', 'Antlered buck', '3.5', 6, 138, 42],
      ['2024–25', 'Antlered buck', '4.5', 3, 145, 46],
      ['2024–25', 'Antlered buck', '5.5+', 1, 149, 44],
      ['2024–25', 'Adult doe', '1.5', 10, 77, 31],
      ['2024–25', 'Adult doe', '2.5', 16, 89, 36],
      ['2024–25', 'Adult doe', '3.5', 9, 95, 39],
      ['2024–25', 'Adult doe', '4.5+', 5, 97, 37],
      ['2024–25', 'Fawn', '0.5', 6, 51, 26],
      ['2025–26', 'Antlered buck', '1.5', 6, 104, 36],
      ['2025–26', 'Antlered buck', '2.5', 7, 127, 41],
      ['2025–26', 'Antlered buck', '3.5', 8, 143, 47],
      ['2025–26', 'Antlered buck', '4.5', 6, 151, 50],
      ['2025–26', 'Antlered buck', '5.5+', 3, 155, 48],
      ['2025–26', 'Adult doe', '1.5', 10, 81, 36],
      ['2025–26', 'Adult doe', '2.5', 18, 94, 41],
      ['2025–26', 'Adult doe', '3.5', 11, 99, 44],
      ['2025–26', 'Adult doe', '4.5+', 7, 100, 42],
      ['2025–26', 'Fawn', '0.5', 5, 54, 31]
    ],
    turkeyHarvest: [
      [2024, 'Pre-management baseline', 24, 4, 3, 1, '16.7'],
      [2025, 'Post-management · Year 1', 27, 6, 5, 1, '22.2'],
      [2026, 'Post-management · Year 2', 31, 8, 7, 1, '25.8']
    ]
  };

  var views = {};
  var mapPath = '/portal/demo/assets/pine-ridge-whitetail-habitat-map-complete.jpg';
  var planPath = '/portal/demo/files/pine-ridge-property-management-prescription.pdf';
  var deerDataPath = '/portal/demo/files/pine-ridge-deer-harvest-log.csv';
  var thermalDataPath = '/portal/demo/files/pine-ridge-thermal-drone-surveys.csv';
  var turkeyDataPath = '/portal/demo/files/pine-ridge-turkey-harvest-log.csv';

  function money(n) {
    return '$' + n.toLocaleString('en-US');
  }

  function metric(label, value, detail) {
    return '<div class="metric"><small>' + label + '</small><strong>' + value + '</strong><span>' + detail + '</span></div>';
  }

  function heading(title, subtitle) {
    return '<div class="heading"><div><h1>' + title + '</h1><p>' + subtitle + '</p></div><div class="updated">Updated July 17, 2026</div></div>';
  }

  function limitation() {
    return '<div class="limitation"><strong>Demonstration data.</strong> Wildlife records and management outcomes are representative sample data built for this private-property portal. Survey estimates are not a complete census, harvest metrics should be interpreted with effort and season timing, and property boundaries are not a legal survey.</div>';
  }

  function managementMap(compact) {
    return '<figure class="actual-map ' + (compact ? 'compact' : '') + '">' +
      '<div class="map-toolbar"><div><strong>Demo Property Management Map</strong><span>Verified resources, habitat features, and management priorities</span></div><div class="map-actions"><a class="btn ghost" href="' + mapPath + '" target="_blank" rel="noopener">Open full map</a><a class="btn" href="' + mapPath + '" download>Download PNG</a></div></div>' +
      '<div class="map-frame"><img src="' + mapPath + '" alt="Pine Ridge demo property map showing wildlife openings, four waterfowl impoundments, wetlands, bedding zones, travel corridors, roads, creeks, and the property boundary"></div>' +
      '<figcaption>Layers shown: property boundary, NWI wetlands, creeks, wildlife openings, four waterfowl impoundments, early-successional cover, field-supported bedding zones BED-1 through BED-5, four monitored travel corridors, and native or gravel roads.</figcaption>' +
    '</figure>';
  }

  function statusClass(status) {
    if (status === 'Priority') return 'gold';
    if (status === 'Active') return 'gold';
    if (status === 'Complete') return '';
    if (status === 'Recurring') return '';
    return 'blue';
  }

  views.overview = function () {
    return '<div class="page">' +
      heading('Property Overview', property.name + ' · ' + property.location + ' · Active management program · Year 3') +
      '<div class="metrics">' +
        metric('Analysis Boundary', '7,645', 'acres in the demonstration tract') +
        metric('Treatment Delivered', '2,684 ac', 'prescribed-fire entries since 2024') +
        metric('Winter Deer Estimate', '371', '48.5 deer per 1,000 acres') +
        metric('Spring Turkey Harvest', '8 gobblers', 'up from 4 before management') +
      '</div>' +
      '<div class="callout"><strong>Two-year response:</strong> the rotating young-cover footprint has increased from 31 to 302 acres, 1,274 acres now meet the open-pine understory standard, all four travel corridors show repeated use, and the winter deer estimate remains inside the working population target. <button class="btn" data-go="wildlife">View wildlife results</button></div>' +
      '<div class="grid-2"><div class="panel"><div class="panel-head"><h2>Current Program Activity</h2><button class="btn ghost" data-go="work">All work</button></div><div class="panel-body">' +
        '<div class="task"><i class="dot"></i><div><strong>Winter thermal survey complete</strong><span>2,690 sampled acres · 13 flight blocks · February 2026</span></div><span class="chip">Complete</span></div>' +
        '<div class="task"><i class="dot"></i><div><strong>2025–26 harvest analysis complete</strong><span>81 deer records with age, whole weight, and KFI</span></div><span class="chip">Complete</span></div>' +
        '<div class="task"><i class="dot"></i><div><strong>2026 prescribed-fire work complete</strong><span>924 acres across seven treatment units</span></div><span class="chip">Complete</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>Summer vegetation response monitoring</strong><span>Permanent plots, photo points, browse, and brood-cover structure</span></div><span class="chip gold">Active</span></div>' +
      '</div></div><div><div class="panel"><div class="panel-head"><h2>Year 5 Habitat Targets</h2><button class="btn ghost" data-go="plan">Five-year plan</button></div><div class="panel-body">' +
        '<div class="objective"><div><span>Rotating early succession</span><strong>302 / 600–760 ac</strong></div><div class="progress target"><i style="width:43%"></i></div><small>40–50% of Year 5 range achieved</small></div>' +
        '<div class="objective"><div><span>Open pine / fire-maintained understory</span><strong>1,274 / 1,500–2,000 ac</strong></div><div class="progress target"><i style="width:73%"></i></div><small>64–85% of Year 5 range achieved</small></div>' +
        '<div class="objective"><div><span>Bedding and security cover</span><strong>412 / 350–500 ac</strong></div><div class="progress target"><i style="width:82%"></i></div><small>Five field-confirmed low-entry zones retained</small></div>' +
        '<div class="objective"><div><span>Permanent openings</span><strong>30 / 40–75 ac</strong></div><div class="progress target"><i style="width:52%"></i></div><small>Ten distributed openings completed</small></div>' +
      '</div></div></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>Property Management Map</h2><button class="btn ghost" data-go="map">Map details</button></div>' + managementMap(true) + '</div>' +
      limitation() +
    '</div>';
  };

  views.property = function () {
    var habitatCards = property.habitats.map(function (h) {
      return '<article class="unit" style="border-top:4px solid ' + h.color + '"><h3>' + h.name + '</h3><span class="chip">' + h.condition + '</span><p>' + h.meaning + '</p><div class="kv"><div><small>ACREAGE</small><strong>' + h.acres.toLocaleString('en-US') + ' acres</strong></div><div><small>PROPERTY SHARE</small><strong>' + h.percent.toFixed(1) + '%</strong></div></div><div class="habitat-bar"><i style="width:' + h.percent + '%;background:' + h.color + '"></i></div></article>';
    }).join('');
    var overlays = property.overlays.map(function (row) {
      return '<tr><td><strong>' + row[0] + '</strong></td><td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('My Property', 'Field-verified habitat composition, protected resources, and monitored wildlife features') +
      '<div class="unit-grid">' + habitatCards + '</div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Mapped Management Overlays</h2><span class="chip gray">Non-additive acreage</span></div><div class="table-wrap"><table><thead><tr><th>Overlay</th><th>Extent</th><th>Property Share</th><th>Management Interpretation</th></tr></thead><tbody>' + overlays + '</tbody></table></div></div>' +
      '<div class="callout section-gap"><strong>How to read these figures:</strong> Land-cover classes total 7,645 acres. Wetland, bedding, treated early cover, travel, and road overlays cross those classes and must not be added to the property total.</div>' +
      limitation() +
    '</div>';
  };

  views.work = function () {
    var rows = property.projects.map(function (p) {
      return '<tr><td><strong>' + p[0] + '</strong></td><td>' + p[1] + '</td><td>' + p[2] + '</td><td><span class="chip ' + statusClass(p[3]) + '">' + p[3] + '</span></td><td>' + p[4] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Work & Projects', 'Completed treatments, current field work, and documented program deliverables') +
      '<div class="panel"><div class="panel-head"><h2>Property Work Program</h2><span class="chip gold">Year 3 active</span></div><div class="table-wrap"><table><thead><tr><th>Timing</th><th>Project</th><th>Scope</th><th>Status</th><th>Result / Deliverable</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Cumulative Delivery</h2></div><div class="panel-body"><div class="budget-line"><span>Prescribed-fire entries</span><strong>2,684 ac</strong></div><div class="budget-line"><span>Thinning / selective midstory</span><strong>1,258 ac</strong></div><div class="budget-line"><span>Rotating young cover</span><strong>302 ac footprint</strong></div><div class="budget-line"><span>Permanent wildlife openings</span><strong>30 ac</strong></div><div class="budget-line"><span>Field-confirmed bedding cover</span><strong>412 ac</strong></div><div class="budget-line"><span>Monitored travel corridors</span><strong>4 of 4 active</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Adaptive Decisions</h2></div><div class="panel-body"><div class="survey"><h3>Burn response</h3><p>Native herbaceous cover reached 28–41% in second-entry units. Units below 25% are receiving targeted midstory follow-up before reburning.</p></div><div class="survey"><h3>Security cover</h3><p>BED-3 and BED-5 showed the heaviest winter use. Vehicle access remains limited and each burn block retains an unburned refuge.</p></div><div class="survey"><h3>Deer harvest</h3><p>The 2026 recommendation holds antlerless harvest near 48–54 deer and continues voluntary protection of most bucks younger than 3.5 years.</p></div><div class="survey"><h3>Turkey habitat</h3><p>Growing-season fire and light disking are being concentrated near brood-use areas while mature roost trees and wetland buffers remain protected.</p></div></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.wildlife = function () {
    var thermalRows = property.thermalSurveys.map(function (s) {
      return '<tr><td><strong>' + s[0] + '</strong><span class="cell-note">' + s[1] + '</span></td><td>' + s[2] + '</td><td><strong>' + s[3] + '</strong><span class="cell-note">90% CI: ' + s[4] + '</span></td><td>' + s[5] + '</td><td>' + s[6] + '</td><td>' + s[7] + '</td></tr>';
    }).join('');
    var harvestRows = property.deerHarvest.map(function (h) {
      return '<tr><td><strong>' + h[0] + '</strong></td><td>' + h[1] + '</td><td>' + h[2] + '</td><td>' + h[3] + '</td><td>' + h[4] + '</td><td>' + h[5] + '</td><td>' + h[6] + '</td><td>' + h[7] + '</td><td>' + h[9] + '</td><td>' + h[10] + '%</td></tr>';
    }).join('');
    var ageRows = property.deerAgeRows.map(function (h) {
      return '<tr><td>' + h[0] + '</td><td><strong>' + h[1] + '</strong></td><td>' + h[2] + '</td><td>' + h[3] + '</td><td>' + h[4] + '</td><td>' + h[5] + '%</td></tr>';
    }).join('');
    var turkeyRows = property.turkeyHarvest.map(function (t) {
      return '<tr><td><strong>' + t[0] + '</strong></td><td>' + t[1] + '</td><td>' + t[2] + '</td><td><strong>' + t[3] + '</strong></td><td>' + t[4] + '</td><td>' + t[5] + '</td><td>' + t[6] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Wildlife Analysis', 'Two years of thermal surveys and harvest monitoring, plus pre- and post-management turkey results') +
      '<div class="metrics">' +
        metric('Winter Deer Estimate', '371', '333–414 · 90% confidence interval') +
        metric('Buck : Doe', '1 : 2.0', 'improved from 1 : 2.3') +
        metric('Adult Doe KFI', '41%', 'up from 36% in the baseline season') +
        metric('2026 Turkey Harvest', '8', '25.8 gobblers per 100 hunter-days') +
      '</div>' +
      '<div class="callout"><strong>Management interpretation:</strong> deer abundance increased modestly while the sex ratio, harvested-buck age structure, whole weights, and condition indices all moved in the desired direction. The change is encouraging, but two years is an early trend; weather, mast production, hunting effort, and seasonal KFI variation remain important.</div>' +
      '<div class="panel"><div class="panel-head"><h2>Thermal Drone Survey Results</h2><a class="btn ghost" href="' + thermalDataPath + '" download>Download survey data</a></div><div class="table-wrap"><table><thead><tr><th>Survey</th><th>Sample Coverage</th><th>Estimated Deer</th><th>Deer / 1,000 ac</th><th>Buck : Doe</th><th>Fawns / Doe</th></tr></thead><tbody>' + thermalRows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Population Trend</h2></div><div class="panel-body"><div class="trend-row"><div><span>Winter 2025</span><strong>342 estimated deer</strong></div><div class="trend-track"><i style="width:84%"></i></div></div><div class="trend-row"><div><span>Winter 2026</span><strong>371 estimated deer</strong></div><div class="trend-track"><i style="width:91%"></i></div></div><div class="budget-line"><span>Estimated population change</span><strong>+8.5%</strong></div><div class="budget-line"><span>Density change</span><strong>44.7 → 48.5 / 1,000 ac</strong></div><div class="budget-line"><span>Recruitment index</span><strong>0.51 → 0.54 fawns / doe</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Survey Design</h2></div><div class="panel-body"><div class="survey"><h3>Repeated stratified sample</h3><p>The same upland pine, wetland-edge, opening, and corridor strata were sampled after deer season. Coverage increased from 2,520 to 2,690 acres.</p></div><div class="survey"><h3>Classification and duplication control</h3><p>Flight blocks, timestamps, movement direction, and identifiable antler or group characteristics were used to screen duplicate observations.</p></div><div class="survey"><h3>Use of the result</h3><p>The density estimate is paired with harvest, camera, browse, and condition data. It is a management estimate—not a claim that every deer on 7,645 acres was counted.</p></div></div></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Two-Year Deer Harvest Summary</h2><a class="btn ghost" href="' + deerDataPath + '" download>Download 153 records</a></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Total</th><th>Antlered</th><th>Antlerless</th><th>Harvest / 1,000 ac</th><th>Avg. Buck Age</th><th>Bucks 3.5+</th><th>Avg. Buck Weight</th><th>Adult Doe Weight</th><th>Adult Doe KFI</th></tr></thead><tbody>' + harvestRows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Harvest Findings</h2></div><div class="panel-body"><div class="budget-line"><span>Total deer harvest</span><strong>72 → 81</strong></div><div class="budget-line"><span>Bucks aged 3.5 years or older</span><strong>38% → 57%</strong></div><div class="budget-line"><span>Average harvested-buck weight</span><strong>122 → 134 lb</strong></div><div class="budget-line"><span>Average adult-doe weight</span><strong>88 → 93 lb</strong></div><div class="budget-line"><span>Average adult-doe KFI</span><strong>36% → 41%</strong></div><p class="mini-note">Weights are whole-body weights. Ages are based on tooth replacement and wear, with selected mature deer checked by cementum annuli.</p></div></div><div class="panel"><div class="panel-head"><h2>Kidney Fat Index Protocol</h2></div><div class="panel-body"><p class="protocol-formula">KFI (%) = perirenal fat mass ÷ kidney mass × 100</p><p class="mini-note">Kidney and attached fat were collected at the property check station and weighed separately. KFI is interpreted within sex, age class, and harvest timing; it is not used as a stand-alone herd-health grade.</p><div class="survey"><h3>What the second year suggests</h3><p>Higher adult weights and KFI are consistent with improved nutritional condition, while the parallel thermal and harvest results do not indicate an abrupt population increase beyond the working target.</p></div></div></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Harvest Age, Weight & Condition Detail</h2><span class="chip gray">Whole weight · KFI percent</span></div><div class="table-wrap table-tall"><table><thead><tr><th>Season</th><th>Harvest Class</th><th>Age</th><th>n</th><th>Average Weight (lb)</th><th>Average KFI</th></tr></thead><tbody>' + ageRows + '</tbody></table></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Turkey Harvest: Before and After Management</h2><a class="btn ghost" href="' + turkeyDataPath + '" download>Download harvest log</a></div><div class="table-wrap"><table><thead><tr><th>Spring Season</th><th>Program Phase</th><th>Hunter-Days</th><th>Gobblers Harvested</th><th>Adults</th><th>Jakes</th><th>Harvest / 100 Hunter-Days</th></tr></thead><tbody>' + turkeyRows + '</tbody></table></div><div class="panel-body turkey-result"><div><strong>4 → 8</strong><span>gobblers harvested</span></div><div><strong>+54%</strong><span>effort-adjusted harvest rate</span></div><p>The 2024 season establishes the pre-management baseline. The 2025 and 2026 seasons show higher harvest after the first two habitat-treatment years even after accounting for increased hunter effort. Continue brood surveys and do not use harvest alone as a population index.</p></div></div>' +
      limitation() +
    '</div>';
  };

  views.plan = function () {
    var yearRows = property.years.map(function (y) {
      return '<tr><td><strong>' + y[0] + '</strong></td><td><span class="chip ' + statusClass(y[1]) + '">' + y[1] + '</span></td><td>' + y[2] + '</td><td>' + y[3] + '</td><td>' + y[4] + '</td><td>' + y[5] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Five-Year Habitat Plan', 'Acreage ranges, treatment sequence, and outcome targets for the 7,645-acre tract') +
      '<div class="callout"><strong>Management objective:</strong> increase usable forage and young cover while retaining wetland function, travel connectivity, and secure bedding cover.</div>' +
      '<div class="panel"><div class="panel-head"><h2>2024–2028 Implementation Schedule</h2><a class="btn" href="' + planPath + '" target="_blank" rel="noopener">Open original prescription</a></div><div class="table-wrap"><table><thead><tr><th>Year</th><th>Status</th><th>Prescribed Fire</th><th>Thinning / Midstory</th><th>Early Cover / Openings</th><th>Key Decision</th></tr></thead><tbody>' + yearRows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Silviculture & Fire</h2></div><div class="panel-body"><ul class="prescription-list"><li>Suitable upland pine is being thinned toward 60–80 square feet of basal area per acre.</li><li>The current fire-priority pool covers 3,420 acres.</li><li>Annual fire delivery is increasing toward 1,200–1,600 acres on a two- to three-year return interval.</li><li>Dormant- and growing-season burns are mixed while unburned refugia remain in every unit.</li><li>Quality crop trees, mast hardwoods, cavity and den trees, safe snags, and soft-mast shrubs are retained.</li></ul></div></div><div class="panel"><div class="panel-head"><h2>Spatial Guardrails</h2></div><div class="panel-body"><ul class="prescription-list"><li>Field-verified wetland and stream buffers are included in treatment maps and contractor work orders.</li><li>One hundred to 150 feet of wooded or brushy cover remains at monitored corridors and pinch points.</li><li>Five low-entry bedding zones retain 412 acres of security cover.</li><li>Roads are assigned maintain, seasonal, or close-and-restore status.</li><li>Mowing and planted food plots remain support tools rather than the primary habitat strategy.</li></ul></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.budget = function () {
    var totals = property.budgets.reduce(function (acc, b) {
      acc[0] += b[2]; acc[1] += b[3]; acc[2] += b[4]; return acc;
    }, [0, 0, 0]);
    var rows = property.budgets.map(function (b) {
      return '<tr><td><strong>' + b[0] + '</strong></td><td>' + b[1] + '</td><td class="money">' + money(b[2]) + '</td><td class="money">(' + money(b[3]) + ')</td><td class="money"><strong>' + money(b[4]) + '</strong></td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Sample Program Budget', 'Demonstration planning figures for contracted management, predicted cost share, and landowner responsibility') +
      '<div class="callout"><strong>Demonstration estimate only:</strong> These figures illustrate portal budgeting at this property scale and are not a proposal. EQIP cost share is a prediction, not guaranteed; funding requires application, ranking, approval, implementation, and certification. No timber revenue is included.</div>' +
      '<div class="panel"><div class="panel-head"><h2>2024–2028 Demonstration Budget</h2><span class="chip gray">Sample data</span></div><div class="table-wrap"><table><thead><tr><th>Year</th><th>Primary Program</th><th>Contracted Plan</th><th>Predicted EQIP Offset</th><th>Projected Landowner Cost</th></tr></thead><tbody>' + rows + '<tr><td colspan="2"><strong>Five-Year Total</strong></td><td class="money"><strong>' + money(totals[0]) + '</strong></td><td class="money"><strong>(' + money(totals[1]) + ')</strong></td><td class="money"><strong>' + money(totals[2]) + '</strong></td></tr></tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Five-Year Funding Summary</h2></div><div class="panel-body"><div class="budget-line"><span>Total contracted program</span><strong>' + money(totals[0]) + '</strong></div><div class="budget-line"><span>Predicted EQIP cost share</span><strong>(' + money(totals[1]) + ')</strong></div><div class="budget-line"><span>Projected landowner responsibility</span><strong>' + money(totals[2]) + '</strong></div><div class="budget-line"><span>Average gross program cost</span><strong>$44.73 / ac / year</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Budget Notes</h2></div><div class="panel-body"><ul class="prescription-list"><li>2024 and 2025 illustrate completed-year costs; 2026 combines paid and committed work.</li><li>2027 and 2028 remain planning forecasts and will be updated after annual monitoring.</li><li>Timber revenue remains separate from service costs and is not assumed here.</li><li>EQIP cost share is shown only after an eligible practice is approved and scheduled.</li><li>Invoices, approved change orders, and cost-share documentation would remain available in the client account.</li></ul></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.reports = function () {
    return '<div class="page">' +
      heading('Reports & Files', 'Published property documents, current monitoring exports, and wildlife harvest records') +
      '<div class="report-grid">' +
        '<article class="report"><span class="type">BASELINE MANAGEMENT PLAN</span><h3>Original Five-Year Property Management Prescription</h3><div class="meta">Program Year 1 · 6 pages · PDF</div><p>The original condition assessment, acreage targets, treatment sequence, monitoring thresholds, and operating limitations used to launch the program.</p><a class="btn" href="' + planPath + '" target="_blank" rel="noopener">Open PDF</a> <a class="btn ghost" href="' + planPath + '" download>Download</a></article>' +
        '<article class="report"><span class="type">PROPERTY MAP</span><h3>Demo Property Management Map</h3><div class="meta">Updated July 2026 · JPEG</div><p>Property boundary, wildlife openings, four waterfowl impoundments, wetlands, creeks, roads, early cover, five bedding zones, and four monitored travel corridors.</p><a class="btn" href="' + mapPath + '" target="_blank" rel="noopener">Open map</a> <a class="btn ghost" href="' + mapPath + '" download>Download</a></article>' +
        '<article class="report"><span class="type">THERMAL DRONE SURVEY</span><h3>Winter Deer Survey Results</h3><div class="meta">2025 and 2026 · 2 survey records · CSV</div><p>Sampling coverage, unique detections, population estimates, confidence intervals, density, sex ratio, and recruitment.</p><a class="btn" href="' + thermalDataPath + '" download>Download CSV</a></article>' +
        '<article class="report"><span class="type">DEER HARVEST</span><h3>Two-Year Deer Harvest Log</h3><div class="meta">2024–25 and 2025–26 · 153 records · CSV</div><p>Harvest date, sex, age, age method, whole weight, kidney and fat weights, calculated KFI, antler points, and management unit.</p><a class="btn" href="' + deerDataPath + '" download>Download CSV</a></article>' +
        '<article class="report"><span class="type">TURKEY HARVEST</span><h3>Pre/Post Turkey Harvest Log</h3><div class="meta">Spring 2024–2026 · 18 records · CSV</div><p>Pre-management baseline and two post-management seasons with age class, whole weight, beard, spurs, and management unit.</p><a class="btn" href="' + turkeyDataPath + '" download>Download CSV</a></article>' +
        '<article class="report"><span class="type">ANNUAL REVIEW</span><h3>2026 Habitat & Wildlife Outcome Dashboard</h3><div class="meta">Updated July 2026 · Portal dashboard</div><p>Completed treatments, thermal estimates, harvest trends, turkey response, habitat target progress, and next-year decisions.</p><button class="btn" data-go="wildlife">Open dashboard</button></article>' +
      '</div>' + limitation() +
    '</div>';
  };

  views.photos = function () {
    var photos = [
      ['Bedding-zone cover check', 'BED-3 · August 2024 · Baseline verification'],
      ['Thermal survey staging', 'West Drainage · February 2025 · Flight block 04'],
      ['Second-entry burn response', 'South Ridge · May 2025 · 41% herbaceous cover'],
      ['Wetland buffer inspection', 'East Wetland Edge · April 2026 · Post-burn review'],
      ['Harvest check station', 'Central Pine · December 2025 · Age, weight, and KFI'],
      ['Turkey brood-cover plot', 'Opening Complex · June 2026 · Structure monitoring']
    ];
    return '<div class="page">' + heading('Field Documentation', 'Selected monitoring locations and completed field-work records from 2024–2026') +
      '<div class="photo-grid">' + photos.map(function (p, index) {
        return '<article class="photo"><div class="photo-art photo-' + (index + 1) + '"><span>FIELD RECORD ' + String(index + 1).padStart(2, '0') + '</span><strong>' + p[0] + '</strong></div><div class="photo-info"><strong>' + p[0] + '</strong><span>' + p[1] + '</span></div></article>';
      }).join('') + '</div>' + limitation() + '</div>';
  };

  views.map = function () {
    return '<div class="page">' +
      heading('Property Map', 'Verified resources and monitored habitat features across the 7,645-acre demonstration tract') +
      managementMap(false) +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Documented Layers</h2></div><div class="panel-body layer-list"><span><i class="wetland"></i>NWI wetland</span><span><i class="creek"></i>Creeks and drainages</span><span><i class="early"></i>Early-successional cover</span><span><i class="road"></i>Native / gravel roads</span><span><i class="boundary"></i>Property boundary</span></div></div><div class="panel"><div class="panel-head"><h2>Monitored Habitat Features</h2></div><div class="panel-body layer-list"><span><i class="bedding"></i>BED-1 through BED-5</span><span><i class="travel"></i>Four travel corridors</span><p class="mini-note">The bedding and travel layers began as desktop hypotheses. Repeated cameras, field sign, and thermal observations now support all five bedding zones and all four routes; geometry remains adjustable as new evidence is collected.</p></div></div></div>' +
      limitation() +
    '</div>';
  };

  function render(viewName) {
    document.querySelectorAll('#nav button').forEach(function (button) {
      button.classList.toggle('active', button.dataset.view === viewName);
    });
    document.getElementById('content').innerHTML = (views[viewName] || views.overview)();
    document.querySelectorAll('[data-go]').forEach(function (button) {
      button.onclick = function () { render(button.dataset.go); };
    });
    window.scrollTo(0, 0);
    if (window.innerWidth < 801) document.getElementById('sidebar').classList.remove('open');
  }

  document.querySelectorAll('#nav button').forEach(function (button) {
    button.onclick = function () { render(button.dataset.view); };
  });
  document.getElementById('menu').onclick = function () {
    document.getElementById('sidebar').classList.toggle('open');
  };
  render('overview');
})();
