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
    ],
    timber: {
      timberedAcres: 6537,
      inventoryDate: 'March 2026',
      pricingDate: 'Q2 2026',
      totalTons: 600000,
      value: 10310000,
      lowValue: 8800000,
      highValue: 11900000,
      annualGrowthTons: 31000,
      products: [
        ['Pine sawtimber', 250000, 23.00, 5750000],
        ['Pine chip-n-saw', 120000, 18.00, 2160000],
        ['Pine pulpwood', 180000, 5.50, 990000],
        ['Hardwood sawtimber', 30000, 38.00, 1140000],
        ['Hardwood pulpwood', 20000, 13.50, 270000]
      ]
    }
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
    return '<div class="heading"><div><h1>' + title + '</h1><p>' + subtitle + '</p></div><div class="updated">Updated July 29, 2026</div></div>';
  }

  function limitation() {
    return '<div class="limitation"><strong>Demonstration data.</strong> Wildlife records, timber inventory, work history, costs, and outcomes are representative sample data built for this private-property portal. Timber value is an illustrative stumpage estimate—not land value or a guaranteed sale price. Survey estimates are not a complete census, and property boundaries are not a legal survey.</div>';
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
      heading('Owner Dashboard', 'What has been done, what it is changing, what comes next, and where the property is headed') +
      '<div class="callout"><strong>Overall status: On track.</strong> The 2026 burn program and winter wildlife survey are complete. Timber and habitat work are progressing, deer body and age trends are improving, and the next owner decisions are fall planting, the 2026–27 harvest target, and the 2027 timber-sale review.</div>' +
      '<div class="metrics">' +
        metric('2026 Program', 'On track', 'three major projects complete · two active') +
        metric('Wildlife Trend', 'Improving', 'doe weight 88 → 93 lb · older-buck share rising') +
        metric('Standing Timber', '$10.3M', 'illustrative stumpage · $8.8M–$11.9M range') +
        metric('2026 Owner Cost', '$239,000', 'after $126,000 predicted cost share') +
      '</div>' +
      '<div class="grid-2"><div class="panel"><div class="panel-head"><h2>What Has Changed</h2><button class="btn ghost" data-go="wildlife">Wildlife details</button></div><div class="panel-body">' +
        '<div class="task"><i class="dot"></i><div><strong>More usable wildlife cover</strong><span>Rotating young cover increased from 31 to 302 acres.</span></div><span class="chip">+271 ac</span></div>' +
        '<div class="task"><i class="dot"></i><div><strong>More open, productive pine habitat</strong><span>1,274 acres now carry the open understory needed for forage and brood cover.</span></div><span class="chip">Improved</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>Deer numbers need restraint</strong><span>The 2026 estimate equals 31.1 deer per square mile, just above the 20–30 working range.</span></div><span class="chip gold">Watch</span></div>' +
        '<div class="task"><i class="dot"></i><div><strong>Hunt quality is improving</strong><span>Average buck age rose from 2.7 to 3.3 years; 57% of harvested bucks were 3.5+.</span></div><span class="chip">Positive</span></div>' +
      '</div></div><div class="panel"><div class="panel-head"><h2>Next Through Year End</h2><button class="btn ghost" data-go="work">Full schedule</button></div><div class="panel-body">' +
        '<div class="task"><i class="dot amber"></i><div><strong>August–September</strong><span>Finish vegetation response checks and update the timber inventory with current Alabama prices.</span></div><span class="chip gold">Active</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>September–October</strong><span>Maintain and plant 30 acres of permanent openings; inspect firebreaks and access roads.</span></div><span class="chip gold">Next</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>November–February</strong><span>Target 65–75 adult does and protect most bucks younger than 3.5 years.</span></div><span class="chip gold">Planned</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>January–February</strong><span>Prepare 2027 burn units and repeat the standardized winter thermal survey.</span></div><span class="chip gold">Planned</span></div>' +
      '</div></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Owner Decisions</h2></div><div class="panel-body"><div class="budget-line"><span>Approve fall opening maintenance and seed</span><strong>By Aug. 15</strong></div><div class="budget-line"><span>Confirm 2026–27 harvest target with hunt club</span><strong>By Oct. 1</strong></div><div class="budget-line"><span>Authorize 2027 timber-sale review</span><strong>By Dec. 15</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Where This Is Headed</h2><button class="btn ghost" data-go="plan">Long-range plan</button></div><div class="panel-body"><div class="objective"><div><span>Open pine with productive groundcover</span><strong>1,274 / 1,500–2,000 ac</strong></div><div class="progress target"><i style="width:73%"></i></div></div><div class="objective"><div><span>Rotating young cover</span><strong>302 / 600–760 ac</strong></div><div class="progress target"><i style="width:43%"></i></div></div><div class="objective"><div><span>Standing timber protected and tracked</span><strong>Annual inventory update</strong></div><div class="progress target"><i style="width:68%"></i></div></div></div></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Property Management Map</h2><button class="btn ghost" data-go="map">Open map</button></div>' + managementMap(true) + '</div>' +
      limitation() +
    '</div>';
  };

  views.property = function () {
    var habitatCards = property.habitats.map(function (h) {
      return '<article class="unit" style="border-top:4px solid ' + h.color + '"><h3>' + h.name + '</h3><span class="chip">' + h.condition + '</span><p>' + h.meaning + '</p><div class="kv"><div><small>ACREAGE</small><strong>' + h.acres.toLocaleString('en-US') + ' acres</strong></div><div><small>PROPERTY SHARE</small><strong>' + h.percent.toFixed(1) + '%</strong></div></div><div class="habitat-bar"><i style="width:' + h.percent + '%;background:' + h.color + '"></i></div></article>';
    }).join('');
    var timberRows = property.timber.products.map(function (p) {
      return '<tr><td><strong>' + p[0] + '</strong></td><td>' + p[1].toLocaleString('en-US') + ' tons</td><td class="money">' + money(p[2]) + ' / ton</td><td class="money"><strong>' + money(p[3]) + '</strong></td></tr>';
    }).join('');
    var overlays = property.overlays.map(function (row) {
      return '<tr><td><strong>' + row[0] + '</strong></td><td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Timber & Habitat', 'Current asset value, timber decisions, habitat condition, and the balance between income and wildlife') +
      '<div class="metrics">' +
        metric('Estimated Stumpage', '$10.3M', 'midpoint of an $8.8M–$11.9M planning range') +
        metric('Timbered Acres', '6,537', 'pine and mixed-forest acres in the demo inventory') +
        metric('Standing Volume', '600,000 tons', 'illustrative March 2026 inventory') +
        metric('Next Timber Decision', '2027 review', 'update cruise, solicit bids, then decide') +
      '</div>' +
      '<div class="callout"><strong>What this number means:</strong> $10.3 million is an illustrative value for standing timber before a sale, using the sample inventory volumes below and rounded Q2 2026 Alabama statewide stumpage benchmarks. It is not total land value, does not include hunting or conservation value, and is not counted as revenue in the management budget.</div>' +
      '<div class="grid-equal"><div class="panel"><div class="panel-head"><h2>Timber Position</h2><span class="chip">Current estimate</span></div><div class="panel-body"><div class="budget-line"><span>Estimated standing value</span><strong>$10,310,000</strong></div><div class="budget-line"><span>Planning range</span><strong>$8.8M–$11.9M</strong></div><div class="budget-line"><span>Projected biological growth</span><strong>31,000 tons / year</strong></div><div class="budget-line"><span>Inventory valuation date</span><strong>March 2026</strong></div><p class="mini-note">A consulting forester should update merchantable volume, product class, access, and local mill competition before any sale.</p></div></div><div class="panel"><div class="panel-head"><h2>Owner Meaning</h2></div><div class="panel-body"><div class="survey"><h3>Protect value now</h3><p>Continue access maintenance, pine-beetle checks, prescribed fire, and stand-level records.</p></div><div class="survey"><h3>Do not rush weak pulpwood</h3><p>Alabama pine pulpwood is near a ten-year low; harvest timing should be driven by stand need and local bids, not the statewide average alone.</p></div><div class="survey"><h3>Review sale blocks in 2027</h3><p>Update the cruise and compare timber income, growth, and habitat response before scheduling the next thinning.</p></div></div></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>How the Timber Estimate Is Built</h2><a class="btn ghost" href="https://timbermart-south.com/resources/state-stumpage-prices/alabama-stumpage-price/" target="_blank" rel="noopener">Alabama price source</a></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Sample Inventory</th><th>Rounded Q2 2026 Alabama Benchmark</th><th>Illustrative Value</th></tr></thead><tbody>' + timberRows + '<tr><td><strong>Total</strong></td><td><strong>600,000 tons</strong></td><td>Weighted by product</td><td class="money"><strong>$10,310,000</strong></td></tr></tbody></table></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Habitat Condition</h2><span class="chip gray">Field and map summary</span></div><div class="panel-body"><p class="mini-note">The cards below remain available for owners who want the acreage detail. The dashboard above carries the decision-level summary.</p></div></div>' +
      '<div class="unit-grid section-gap">' + habitatCards + '</div>' +
      '<details class="panel section-gap"><summary class="panel-head" style="cursor:pointer"><h2 style="display:inline">Show mapped management overlays</h2></summary><div class="table-wrap"><table><thead><tr><th>Overlay</th><th>Extent</th><th>Property Share</th><th>Management Interpretation</th></tr></thead><tbody>' + overlays + '</tbody></table></div></details>' +
      limitation() +
    '</div>';
  };

  views.work = function () {
    var rows = property.projects.map(function (p) {
      return '<tr><td><strong>' + p[0] + '</strong></td><td>' + p[1] + '</td><td>' + p[2] + '</td><td><span class="chip ' + statusClass(p[3]) + '">' + p[3] + '</span></td><td>' + p[4] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Work & Schedule', 'What Southern Habitat has completed, what is active now, and what is scheduled next') +
      '<div class="metrics">' + metric('2026 Status', 'On track', 'major winter and spring work complete') + metric('Prescribed Fire', '924 ac', 'seven units completed in 2026') + metric('Timber & Cover Work', '333 ac', '260 thinned · 61 young cover · 12 openings') + metric('Next Milestone', 'Fall planting', 'September–October 2026') + '</div>' +
      '<div class="panel"><div class="panel-head"><h2>Rest of 2026</h2><span class="chip gold">Owner schedule</span></div><div class="table-wrap"><table><thead><tr><th>Timing</th><th>Work</th><th>Why It Matters</th><th>Owner Action</th></tr></thead><tbody>' +
        '<tr><td><strong>Aug.–Sept.</strong></td><td>Vegetation response and timber inventory update</td><td>Confirms whether habitat work is producing usable groundcover and refreshes timber value.</td><td>Review updated summary</td></tr>' +
        '<tr><td><strong>Sept.–Oct.</strong></td><td>Opening maintenance, fall planting, roads, and firebreaks</td><td>Supports hunting access, cool-season forage, and safe 2027 burn delivery.</td><td>Approve scope by Aug. 15</td></tr>' +
        '<tr><td><strong>Nov.–Feb.</strong></td><td>Deer harvest and check-station data</td><td>Moves the doe-heavy herd toward balance while protecting improving buck age structure.</td><td>Adopt 65–75 adult-doe target</td></tr>' +
        '<tr><td><strong>Dec.–Feb.</strong></td><td>2027 burn and thinning layout</td><td>Keeps work sequenced around timber value, cover needs, and access constraints.</td><td>Approve 2027 work plan</td></tr>' +
      '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Management Decisions</h2></div><div class="panel-body"><div class="survey"><h3>Deer harvest</h3><p>Target 65–75 adult does and approximately 105–120 total deer in 2026–27, then adjust after the midseason check and winter survey. This moves closer to Alabama guidance that roughly one-third of a stable herd may be removed annually while site data control the final number.</p></div><div class="survey"><h3>Timber and wildlife balance</h3><p>Thin wildlife-priority pine toward roughly 40–60 ft² of basal area where stand age, windfirmness, and product objectives allow; retain higher stocking in timber-priority blocks.</p></div><div class="survey"><h3>Turkey habitat</h3><p>Continue patchwork fire, brood-cover monitoring, and roost-tree protection. Treat the improved harvest rate as encouraging—not proof the turkey population doubled.</p></div></div></div><div class="panel"><div class="panel-head"><h2>Delivered Since 2024</h2></div><div class="panel-body"><div class="budget-line"><span>Prescribed-fire entries</span><strong>2,684 ac</strong></div><div class="budget-line"><span>Thinning / selective midstory</span><strong>1,258 ac</strong></div><div class="budget-line"><span>Rotating young cover</span><strong>302 ac</strong></div><div class="budget-line"><span>Permanent openings</span><strong>30 ac</strong></div><div class="budget-line"><span>Waterfowl impoundments</span><strong>46 ac / 4 units</strong></div></div></div></div>' +
      '<details class="panel section-gap"><summary class="panel-head" style="cursor:pointer"><h2 style="display:inline">Show complete project history</h2></summary><div class="table-wrap"><table><thead><tr><th>Timing</th><th>Project</th><th>Scope</th><th>Status</th><th>Result / Deliverable</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>' +
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
      heading('Wildlife Condition', 'A plain-language reading of the herd, hunt quality, and the management decision for this season') +
      '<div class="metrics">' +
        metric('Deer Abundance', 'Slightly high', '31.1 deer / mi² · working range 20–30') +
        metric('Deer Condition', 'Improving', 'adult-doe weight 88 → 93 lb') +
        metric('Buck Structure', 'Improving', 'average age 2.7 → 3.3 years') +
        metric('Turkey Result', 'Encouraging', 'effort-adjusted harvest rate up 54%') +
      '</div>' +
      '<div class="callout"><strong>Bottom line for the owner:</strong> Habitat and buck-age results are moving in the right direction, but deer abundance remains a little above the working range and the herd is still doe-heavy. The 2026–27 recommendation is 65–75 adult does, continued protection of most bucks younger than 3.5 years, and another winter survey before changing direction.</div>' +
      '<div class="panel"><div class="panel-head"><h2>How We Judge the Herd</h2><span class="chip">Multiple lines of evidence</span></div><div class="table-wrap"><table><thead><tr><th>Measure</th><th>Pine Ridge</th><th>Alabama / Coastal Plain Context</th><th>Owner Meaning</th></tr></thead><tbody>' +
        '<tr><td><strong>Deer abundance</strong></td><td>371 estimated · 31.1 / mi²</td><td>20–30 / mi² working range for this pine-dominated demonstration</td><td>Slightly above target; increase doe harvest carefully.</td></tr>' +
        '<tr><td><strong>Adult-doe weight</strong></td><td>93 lb · up from 88</td><td>Within the lower portion of Alabama\'s broad healthy-adult range</td><td>Direction is positive, but habitat and browse pressure still matter.</td></tr>' +
        '<tr><td><strong>Fawns per doe</strong></td><td>0.54</td><td>Near the 0.50 long-term Coastal Plain reference</td><td>Recruitment is adequate to sustain the herd.</td></tr>' +
        '<tr><td><strong>Buck-to-doe ratio</strong></td><td>1 : 2.0 · improved from 1 : 2.3</td><td>Balanced herds compress breeding and reduce late fawning</td><td>Still doe-heavy; continue selective antlerless harvest.</td></tr>' +
        '<tr><td><strong>Older-buck share</strong></td><td>57% age 3.5+ · up from 38%</td><td>Age is the first requirement for mature body and antler expression</td><td>Voluntary young-buck protection is working.</td></tr>' +
      '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>This Season</h2></div><div class="panel-body"><div class="budget-line"><span>Adult-doe target</span><strong>65–75</strong></div><div class="budget-line"><span>Total deer target</span><strong>105–120</strong></div><div class="budget-line"><span>Buck guideline</span><strong>Protect most &lt;3.5</strong></div><div class="budget-line"><span>Midseason review</span><strong>After 35 adult does</strong></div><p class="mini-note">The target is a property recommendation, not a statewide prescription. It is adjusted with browse pressure, hunter effort, weights, age structure, and the next winter estimate.</p></div></div><div class="panel"><div class="panel-head"><h2>Turkey Reading</h2></div><div class="panel-body"><div class="budget-line"><span>Gobblers harvested</span><strong>4 → 8</strong></div><div class="budget-line"><span>Harvest / 100 hunter-days</span><strong>16.7 → 25.8</strong></div><div class="budget-line"><span>Management conclusion</span><strong>Encouraging trend</strong></div><p class="mini-note">The effort-adjusted result improved, but harvest alone cannot prove the population doubled. Brood counts, cameras, gobbling activity, and habitat response remain part of the annual review.</p></div></div></div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Research & Benchmark Sources</h2></div><div class="panel-body"><ul class="prescription-list"><li><a href="https://www.outdooralabama.com/wildlife-management-programs/deer-management-assistance-program" target="_blank" rel="noopener">Alabama Deer Management Assistance Program</a>: site-specific decisions using harvest, health, survey, and habitat data.</li><li><a href="https://www.outdooralabama.com/node/1490" target="_blank" rel="noopener">Outdoor Alabama doe-management guidance</a>: balanced sex ratios and harvest composition.</li><li><a href="https://www.outdooralabama.com/ungulates/white-tailed-deer" target="_blank" rel="noopener">Outdoor Alabama white-tailed deer profile</a>: Alabama body-weight context.</li><li><a href="https://www.jonesctr.org/wp-content/uploads/2022/02/deer_pub.pdf" target="_blank" rel="noopener">Coastal Plain Whitetails</a>: long-term density, adult weight, lactation, and recruitment reference.</li></ul></div></div>' +
      '<details class="panel section-gap"><summary class="panel-head" style="cursor:pointer"><h2 style="display:inline">Show technical survey and harvest data</h2><span class="chip gray">Optional detail</span></summary>' +
        '<div class="panel-head"><h2>Thermal Drone Surveys</h2><a class="btn ghost" href="' + thermalDataPath + '" download>Download survey data</a></div><div class="table-wrap"><table><thead><tr><th>Survey</th><th>Sample Coverage</th><th>Estimated Deer</th><th>Deer / 1,000 ac</th><th>Buck : Doe</th><th>Fawns / Doe</th></tr></thead><tbody>' + thermalRows + '</tbody></table></div>' +
        '<div class="panel-head"><h2>Two-Year Harvest Summary</h2><a class="btn ghost" href="' + deerDataPath + '" download>Download 153 records</a></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Total</th><th>Antlered</th><th>Antlerless</th><th>Harvest / 1,000 ac</th><th>Avg. Buck Age</th><th>Bucks 3.5+</th><th>Avg. Buck Weight</th><th>Adult Doe Weight</th><th>Adult Doe KFI</th></tr></thead><tbody>' + harvestRows + '</tbody></table></div>' +
        '<div class="panel-body"><p class="protocol-formula">KFI (%) = perirenal fat mass ÷ kidney mass × 100</p><p class="mini-note">KFI is retained as a supporting, season-sensitive condition measure. It is not used as a stand-alone pass/fail grade.</p></div>' +
        '<div class="panel-head"><h2>Age, Weight & Condition Detail</h2></div><div class="table-wrap table-tall"><table><thead><tr><th>Season</th><th>Harvest Class</th><th>Age</th><th>n</th><th>Average Weight (lb)</th><th>Average KFI</th></tr></thead><tbody>' + ageRows + '</tbody></table></div>' +
        '<div class="panel-head"><h2>Turkey Harvest Log</h2><a class="btn ghost" href="' + turkeyDataPath + '" download>Download harvest log</a></div><div class="table-wrap"><table><thead><tr><th>Spring Season</th><th>Program Phase</th><th>Hunter-Days</th><th>Gobblers</th><th>Adults</th><th>Jakes</th><th>Harvest / 100 Hunter-Days</th></tr></thead><tbody>' + turkeyRows + '</tbody></table></div>' +
      '</details>' +
      limitation() +
    '</div>';
  };

  views.plan = function () {
    var yearRows = property.years.map(function (y) {
      return '<tr><td><strong>' + y[0] + '</strong></td><td><span class="chip ' + statusClass(y[1]) + '">' + y[1] + '</span></td><td>' + y[2] + '</td><td>' + y[3] + '</td><td>' + y[4] + '</td><td>' + y[5] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Long-Range Property Plan', 'What is planned for the rest of 2026, the next two years, and the following management cycle') +
      '<div class="callout"><strong>Long-term objective:</strong> protect timber value while building a more open, fire-maintained property with better native forage, young cover, wetland protection, and reliable access. The plan is reviewed annually rather than locked in for five years.</div>' +
      '<div class="panel"><div class="panel-head"><h2>2024–2028 Implementation Schedule</h2><a class="btn" href="' + planPath + '" target="_blank" rel="noopener">Open original prescription</a></div><div class="table-wrap"><table><thead><tr><th>Year</th><th>Status</th><th>Prescribed Fire</th><th>Thinning / Midstory</th><th>Early Cover / Openings</th><th>Key Decision</th></tr></thead><tbody>' + yearRows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Silviculture & Fire</h2></div><div class="panel-body"><ul class="prescription-list"><li>Wildlife-priority pine is generally thinned toward 40–60 square feet of basal area per acre where stand and timber objectives allow.</li><li>The current fire-priority pool covers 3,420 acres.</li><li>Annual fire delivery is increasing toward 1,200–1,600 acres on a two- to three-year return interval.</li><li>Dormant- and growing-season burns are mixed while unburned refugia remain in every unit.</li><li>Quality crop trees, mast hardwoods, cavity and den trees, safe snags, and soft-mast shrubs are retained.</li></ul></div></div><div class="panel"><div class="panel-head"><h2>Spatial Guardrails</h2></div><div class="panel-body"><ul class="prescription-list"><li>Field-verified wetland and stream buffers are included in treatment maps and contractor work orders.</li><li>One hundred to 150 feet of wooded or brushy cover remains at monitored corridors and pinch points.</li><li>Five low-entry bedding zones retain 412 acres of security cover.</li><li>Roads are assigned maintain, seasonal, or close-and-restore status.</li><li>Mowing and planted food plots remain support tools rather than the primary habitat strategy.</li></ul></div></div></div>' +
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
      heading('Costs & Assistance', 'What the owner is responsible for this year and the forecast for future years') +
      '<div class="metrics">' + metric('2026 Contracted Plan', '$365,000', 'paid and committed demonstration work') + metric('Predicted Assistance', '$126,000', 'estimated EQIP offset · not guaranteed') + metric('2026 Owner Share', '$239,000', '$31.26 per property acre') + metric('Five-Year Owner Share', '$1.165M', 'current 2024–2028 projection') + '</div>' +
      '<div class="callout"><strong>Owner reading:</strong> The 2026 program is forecast at $365,000, with $126,000 of potential cost share and $239,000 remaining for the owner. Standing timber value is shown separately in Timber & Habitat and is not used here as assumed revenue.</div>' +
      '<div class="grid-equal"><div class="panel"><div class="panel-head"><h2>This Year</h2></div><div class="panel-body"><div class="budget-line"><span>Contracted and committed work</span><strong>$365,000</strong></div><div class="budget-line"><span>Predicted cost-share assistance</span><strong>($126,000)</strong></div><div class="budget-line"><span>Projected owner responsibility</span><strong>$239,000</strong></div><div class="budget-line"><span>Owner cost per property acre</span><strong>$31.26</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Budget Guardrails</h2></div><div class="panel-body"><ul class="prescription-list"><li>Cost share is shown only as a prediction until an eligible practice is approved and certified.</li><li>Future-year scopes change after annual timber, habitat, and wildlife review.</li><li>Timber sale proceeds remain separate from management costs.</li><li>Owner approval is required for change orders or work outside the annual plan.</li></ul></div></div></div>' +
      '<details class="panel section-gap"><summary class="panel-head" style="cursor:pointer"><h2 style="display:inline">Show five-year budget detail</h2></summary><div class="table-wrap"><table><thead><tr><th>Year</th><th>Primary Program</th><th>Contracted Plan</th><th>Predicted EQIP Offset</th><th>Projected Owner Cost</th></tr></thead><tbody>' + rows + '<tr><td colspan="2"><strong>Five-Year Total</strong></td><td class="money"><strong>' + money(totals[0]) + '</strong></td><td class="money"><strong>(' + money(totals[1]) + ')</strong></td><td class="money"><strong>' + money(totals[2]) + '</strong></td></tr></tbody></table></div></details>' +
      limitation() +
    '</div>';
  };

  views.reports = function () {
    return '<div class="page">' +
      heading('Reports & Data', 'Owner-ready reports first, with technical exports available when needed') +
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
