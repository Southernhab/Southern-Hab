(function () {
  'use strict';

  var property = {
    name: 'Pine Ridge Demonstration Tract',
    location: 'South Alabama',
    acres: 7645,
    habitats: [
      { name: 'Pine / evergreen forest', acres: 6532, percent: 85.4, condition: 'Primary opportunity', color: '#5e7954', meaning: 'Dominant upland matrix; inventory suitable stands for thinning, midstory work, and recurring fire.' },
      { name: 'Woody wetland', acres: 558, percent: 7.3, condition: 'Protect', color: '#3e7882', meaning: 'Hydrologic and security cover; avoid soil disturbance and field-verify buffers.' },
      { name: 'Open / developed', acres: 324, percent: 4.2, condition: 'Verify', color: '#b79a61', meaning: 'Rights-of-way and open ground; confirm condition and treatment value in the field.' },
      { name: 'Open water', acres: 144, percent: 1.9, condition: 'Protect', color: '#3f88a4', meaning: 'Reservoir and pond surface; retain shoreline protection and stable crossings.' },
      { name: 'Shrub / grass / barren', acres: 52, percent: 0.7, condition: 'Retain and rotate', color: '#c6ae57', meaning: 'Scarce young-cover resource; retain useful patches and rotate disturbance nearby.' },
      { name: 'Mixed forest', acres: 35, percent: 0.5, condition: 'Retain diversity', color: '#726f4a', meaning: 'Potential mast and diversity component; retain quality hardwoods and soft mast.' }
    ],
    overlays: [
      ['NWI non-riverine wetland', '472 acres', '6.2%', 'Documented planning constraint; overlaps the land-cover classes.'],
      ['Modeled bedding zones', '385 acres', '5.0%', 'Five predicted security-cover zones; field confirmation is required.'],
      ['Mapped early cover', '31 acres', '0.4%', 'The primary habitat deficit; likely understates open understory beneath pine canopy.'],
      ['Modeled travel corridors', '4 routes', '—', 'Connections modeled along cover, drainages, and terrain.'],
      ['Native / gravel forest roads', '31 segments', '—', 'Access network to classify as maintain, seasonal, or close and restore.']
    ],
    projects: [
      ['Year 1', 'Field verification and baseline inventory', 'Entire tract', 'Priority', 'Wetlands, streams, stands, roads, bedding, corridors, photo points, and vegetation plots'],
      ['Year 1', 'Initial prescribed-fire entry', '400–700 acres', 'Planned', 'Prepare access and firebreaks; retain unburned security cover'],
      ['Year 1', 'Thinning / midstory entry', '300–500 acres', 'Planned', 'Inventory first; prioritize suitable closed-canopy uplands'],
      ['Year 1', 'Early-cover treatment', '50–100 acres', 'Planned', 'Create distributed 40–80 acre blocks rather than one concentrated opening'],
      ['Year 2', 'Permanent wildlife openings', '15–25 acres', 'Planned', 'Use 2–5 acre openings; soil-test before planting'],
      ['Annual', 'Habitat monitoring and GIS update', 'Property-wide', 'Recurring', 'Record treatments, road status, invasives, bedding evidence, and corridor use']
    ],
    years: [
      [1, '400–700 ac', '300–500 ac', '50–100 ac', 'Verify constraints and establish permanent monitoring points.'],
      [2, '1,000–1,300 ac', '500–700 ac', '100–150 ac + 15–25 ac permanent openings', 'Evaluate vegetation response and close or gate high-impact access.'],
      [3, '1,200–1,600 ac', '500–700 ac', '100–150 ac', 'Re-enter first fire units and confirm corridor use with cameras and sign surveys.'],
      [4, '1,200–1,600 ac', '300–500 ac', '100–150 ac', 'Shift treatment to underrepresented areas and control invasive plants.'],
      [5, '1,200–1,600 ac', 'Maintenance / gap fill', 'Reach 600–760 ac rotating footprint', 'Complete outcome review and revise the next five-year cycle.']
    ],
    budgets: [
      [2026, 'Field verification and program foundation', 325000, 92000, 233000],
      [2027, 'First full-scale treatment year', 385000, 140000, 245000],
      [2028, 'Fire rotation and habitat expansion', 365000, 126000, 239000],
      [2029, 'Adaptive treatment and access work', 330000, 105000, 225000],
      [2030, 'Complete targets and next-cycle inventory', 305000, 82000, 223000]
    ]
  };

  var views = {};
  var mapPath = '/portal/demo/assets/pine-ridge-whitetail-habitat-map.png';
  var planPath = '/portal/demo/files/pine-ridge-property-management-prescription.pdf';

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
    return '<div class="limitation"><strong>Demonstration and planning-use data.</strong> Acreages are desktop estimates. Modeled bedding and travel features are hypotheses until field-confirmed. Property boundaries are not a legal survey, and final treatment units require on-site verification, applicable approvals, and contractor-specific planning.</div>';
  }

  function managementMap(compact) {
    return '<figure class="actual-map ' + (compact ? 'compact' : '') + '">' +
      '<div class="map-toolbar"><div><strong>Whitetail Habitat Intelligence</strong><span>Documented layers + modeled habitat features</span></div><div class="map-actions"><a class="btn ghost" href="' + mapPath + '" target="_blank" rel="noopener">Open full map</a><a class="btn" href="' + mapPath + '" download>Download PNG</a></div></div>' +
      '<div class="map-frame"><img src="' + mapPath + '" alt="Pine Ridge habitat intelligence map showing wetlands, early cover, five modeled bedding zones, four travel corridors, roads, creeks, and the property boundary"></div>' +
      '<figcaption>Layers shown: property boundary, NWI wetlands, creeks, early-successional cover, modeled bedding zones BED-1 through BED-5, four modeled travel corridors, and native or gravel roads.</figcaption>' +
    '</figure>';
  }

  function statusClass(status) {
    if (status === 'Priority') return 'gold';
    if (status === 'Recurring') return '';
    return 'blue';
  }

  views.overview = function () {
    return '<div class="page">' +
      heading('Property Overview', property.name + ' · ' + property.location + ' · Desktop habitat program') +
      '<div class="metrics">' +
        metric('Analysis Boundary', '7,645', 'acres in the demonstration tract') +
        metric('Pine-Dominated Cover', '85.4%', '6,532 mapped acres') +
        metric('Modeled Bedding', '5 zones', '385 acres for field verification') +
        metric('Travel Connectivity', '4 routes', 'retain continuous wooded cover') +
      '</div>' +
      '<div class="callout"><strong>Primary habitat imbalance:</strong> only 31 acres (0.4%) are mapped as early cover. Build a distributed, rotating 600–760 acre early-successional footprint by Year 5 while protecting wetlands, bedding security, and travel connectivity. <button class="btn" data-go="plan">Open prescription</button></div>' +
      '<div class="grid-2"><div class="panel"><div class="panel-head"><h2>Current Planning Activity</h2><button class="btn ghost" data-go="work">All work</button></div><div class="panel-body">' +
        '<div class="task"><i class="dot"></i><div><strong>Desktop habitat assessment complete</strong><span>7,645-acre analysis boundary · July 2026</span></div><span class="chip">Complete</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>Field verification is the next gate</strong><span>Confirm stands, hydrology, roads, bedding, and corridors</span></div><span class="chip gold">Priority</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>Stand and fuels inventory</strong><span>Required before thinning and burn-unit layout</span></div><span class="chip blue">Planned</span></div>' +
        '<div class="task"><i class="dot amber"></i><div><strong>Monitoring network design</strong><span>30–40 cameras plus photo points and vegetation plots</span></div><span class="chip blue">Planned</span></div>' +
      '</div></div><div><div class="panel"><div class="panel-head"><h2>Year 5 Habitat Targets</h2><button class="btn ghost" data-go="plan">Five-year plan</button></div><div class="panel-body">' +
        '<div class="objective"><div><span>Rotating early succession</span><strong>600–760 ac</strong></div><div class="progress target"><i style="width:10%"></i></div><small>8–10% of property</small></div>' +
        '<div class="objective"><div><span>Open pine / fire-maintained understory</span><strong>1,500–2,000 ac</strong></div><div class="progress target"><i style="width:26%"></i></div><small>20–26% of property; overlaps pine cover</small></div>' +
        '<div class="objective"><div><span>Bedding and security cover</span><strong>350–500 ac</strong></div><div class="progress target"><i style="width:6.5%"></i></div><small>Retain five low-entry zones</small></div>' +
        '<div class="objective"><div><span>Permanent openings</span><strong>40–75 ac</strong></div><div class="progress target"><i style="width:1%"></i></div><small>Distributed 2–5 acre plots</small></div>' +
      '</div></div></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>Habitat Intelligence Map</h2><button class="btn ghost" data-go="map">Map details</button></div>' + managementMap(true) + '</div>' +
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
      heading('My Property', 'Existing habitat composition, mapped constraints, and modeled wildlife features') +
      '<div class="unit-grid">' + habitatCards + '</div>' +
      '<div class="panel section-gap"><div class="panel-head"><h2>Mapped Management Overlays</h2><span class="chip gray">Non-additive acreage</span></div><div class="table-wrap"><table><thead><tr><th>Overlay</th><th>Extent</th><th>Property Share</th><th>Management Interpretation</th></tr></thead><tbody>' + overlays + '</tbody></table></div></div>' +
      '<div class="callout section-gap"><strong>How to read these figures:</strong> Land-cover classes total 7,645 acres. Wetland, bedding, early-cover, travel, and road overlays cross those classes and must not be added to the property total.</div>' +
      limitation() +
    '</div>';
  };

  views.work = function () {
    var rows = property.projects.map(function (p) {
      return '<tr><td><strong>' + p[0] + '</strong></td><td>' + p[1] + '</td><td>' + p[2] + '</td><td><span class="chip ' + statusClass(p[3]) + '">' + p[3] + '</span></td><td>' + p[4] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Work & Projects', 'The next field actions needed to turn the desktop prescription into verified treatment units') +
      '<div class="panel"><div class="panel-head"><h2>Property Work Program</h2><span class="chip gold">Field verification required</span></div><div class="table-wrap"><table><thead><tr><th>Timing</th><th>Project</th><th>Scope</th><th>Status</th><th>Decision / Deliverable</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Operational Sequence</h2></div><div class="panel-body sequence"><div><b>1</b><span>Survey and flag wetlands, streams, bedding, corridors, and other constraints.</span></div><div><b>2</b><span>Complete stand, fuels, road, and invasive-plant inventories.</span></div><div><b>3</b><span>Prepare access and firebreaks; close or gate damaging routes.</span></div><div><b>4</b><span>Thin suitable uplands and apply selective midstory treatment.</span></div><div><b>5</b><span>Burn prepared units while retaining security-cover refugia.</span></div><div><b>6</b><span>Monitor one growing season and adjust the next treatment block.</span></div></div></div><div class="panel"><div class="panel-head"><h2>Treatment Rules</h2></div><div class="panel-body"><div class="survey"><h3>Closed upland pine</h3><p>Thin first, then burn after evaluating slash, fuels, smoke, and stand wind risk.</p></div><div class="survey"><h3>Dense bedding cover</h3><p>Treat patches or edges and keep an interior refuge; never disturb every security zone in one year.</p></div><div class="survey"><h3>Wet or hydric ground</h3><p>Exclude heavy equipment and ground disturbance; establish field-based buffers.</p></div><div class="survey"><h3>Road at a corridor pinch point</h3><p>Reduce traffic, add screening cover, and avoid widening unless safety requires it.</p></div></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.wildlife = function () {
    return '<div class="page">' +
      heading('Wildlife Analysis', 'Whitetail habitat structure, security cover, movement hypotheses, and verification design') +
      '<div class="metrics">' +
        metric('Bedding Model', '5 zones', '385 acres of predicted security cover') +
        metric('Travel Model', '4 routes', 'retain 100–150 ft of screened cover') +
        metric('Camera Design', '30–40', 'standardized late-summer stations') +
        metric('Survey Window', '14 days', 'plus cameras at corridor pinch points') +
      '</div>' +
      '<div class="grid-equal"><div class="panel"><div class="panel-head"><h2>Professional Interpretation</h2></div><div class="panel-body"><div class="survey"><h3>Security cover</h3><p>Treat BED-1 through BED-5 as field-survey priorities, not fixed treatment boundaries. Favor patchy shrubs, young pine, blackberry, greenbrier, and screening cover while avoiding new through-roads.</p></div><div class="survey"><h3>Travel connectivity</h3><p>Keep all four modeled routes continuously wooded or brushy. Feather edges, minimize drainage crossings, and protect the narrowest pinch points from unnecessary traffic.</p></div><div class="survey"><h3>Forage and young cover</h3><p>Distribute 40–80 acre treatment blocks across the tract. A staggered age mosaic provides forage and security cover every year without concentrating disturbance.</p></div><div class="survey"><h3>Wetland network</h3><p>Wetlands and drainages already provide a strong cover-and-water network. Place intensive disturbance on suitable uplands and field-adjust every buffer.</p></div></div></div><div class="panel"><div class="panel-head"><h2>Monitoring & Success Measures</h2></div><div class="panel-body"><div class="budget-line"><span>Early-cover footprint</span><strong>600–760 ac</strong></div><div class="budget-line"><span>Open pine understory</span><strong>≥1,500 ac</strong></div><div class="budget-line"><span>Native herbaceous cover</span><strong>≥30% in responsive units</strong></div><div class="budget-line"><span>Bedding use</span><strong>Evidence in ≥4 of 5 zones</strong></div><div class="budget-line"><span>Corridor use</span><strong>All 4 routes or revise model</strong></div><div class="budget-line"><span>Invasive plants</span><strong>&lt;5% cover or active control</strong></div><p class="mini-note">Pair cameras with permanent photo points and vegetation transects. Record canopy closure, herbaceous cover, browse, and horizontal screening in treated and reference stands.</p></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.plan = function () {
    var yearRows = property.years.map(function (y) {
      return '<tr><td><strong>Year ' + y[0] + '</strong></td><td>' + y[1] + '</td><td>' + y[2] + '</td><td>' + y[3] + '</td><td>' + y[4] + '</td></tr>';
    }).join('');
    return '<div class="page">' +
      heading('Five-Year Habitat Plan', 'Acreage ranges, treatment sequence, and outcome targets for the 7,645-acre tract') +
      '<div class="callout"><strong>Management objective:</strong> increase usable forage and young cover while retaining wetland function, travel connectivity, and secure bedding cover.</div>' +
      '<div class="panel"><div class="panel-head"><h2>2026–2030 Implementation Schedule</h2><a class="btn" href="' + planPath + '" target="_blank" rel="noopener">Open full prescription</a></div><div class="table-wrap"><table><thead><tr><th>Program Year</th><th>Prescribed Fire</th><th>Thinning / Midstory</th><th>Early Cover / Openings</th><th>Key Decision</th></tr></thead><tbody>' + yearRows + '</tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Silviculture & Fire</h2></div><div class="panel-body"><ul class="prescription-list"><li>Inventory stands first; generally thin suitable upland pine toward 60–80 square feet of basal area per acre.</li><li>Create a 3,000–4,000 acre fire-priority pool.</li><li>After preparation, burn 1,200–1,600 acres annually on a two- to three-year return interval.</li><li>Use a mosaic of dormant- and growing-season burns with unburned refugia.</li><li>Retain quality crop trees, mast hardwoods, cavity and den trees, safe snags, and soft-mast shrubs.</li></ul></div></div><div class="panel"><div class="panel-head"><h2>Spatial Guardrails</h2></div><div class="panel-body"><ul class="prescription-list"><li>Use a 100-foot desktop wetland and stream buffer as a conservative starting point; field-adjust it.</li><li>Keep 100–150 feet of wooded or brushy cover at modeled corridors and pinch points.</li><li>Maintain 350–500 acres of bedding and security cover across five low-entry zones.</li><li>Classify roads as maintain, seasonal, or close and restore.</li><li>Use mowing and planted food plots only as support tools, not the primary habitat strategy.</li></ul></div></div></div>' +
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
      '<div class="panel"><div class="panel-head"><h2>2026–2030 Demonstration Budget</h2><span class="chip gray">Sample data</span></div><div class="table-wrap"><table><thead><tr><th>Year</th><th>Primary Program</th><th>Contracted Plan</th><th>Predicted EQIP Offset</th><th>Projected Landowner Cost</th></tr></thead><tbody>' + rows + '<tr><td colspan="2"><strong>Five-Year Total</strong></td><td class="money"><strong>' + money(totals[0]) + '</strong></td><td class="money"><strong>(' + money(totals[1]) + ')</strong></td><td class="money"><strong>' + money(totals[2]) + '</strong></td></tr></tbody></table></div></div>' +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Five-Year Funding Summary</h2></div><div class="panel-body"><div class="budget-line"><span>Total contracted program</span><strong>' + money(totals[0]) + '</strong></div><div class="budget-line"><span>Predicted EQIP cost share</span><strong>(' + money(totals[1]) + ')</strong></div><div class="budget-line"><span>Projected landowner responsibility</span><strong>' + money(totals[2]) + '</strong></div><div class="budget-line"><span>Average gross program cost</span><strong>$44.73 / ac / year</strong></div></div></div><div class="panel"><div class="panel-head"><h2>Before Pricing Is Final</h2></div><div class="panel-body"><ul class="prescription-list"><li>Verify accessible and treatable acres in the field.</li><li>Separate timber operations from service costs and do not assume revenue.</li><li>Confirm firebreak, road, smoke, equipment, and water-access requirements.</li><li>Match potentially eligible practices to current NRCS standards and payment schedules.</li><li>Publish only the approved contract and funding assumptions to the client account.</li></ul></div></div></div>' +
      limitation() +
    '</div>';
  };

  views.reports = function () {
    return '<div class="page">' +
      heading('Reports & Files', 'Published demonstration documents and map products for the Pine Ridge tract') +
      '<div class="report-grid">' +
        '<article class="report"><span class="type">MANAGEMENT PLAN</span><h3>Five-Year Property Management Prescription</h3><div class="meta">Published July 2026 · 6 pages · PDF</div><p>Existing conditions, acreage targets, treatment sequence, monitoring thresholds, and implementation limitations.</p><a class="btn" href="' + planPath + '" target="_blank" rel="noopener">Open PDF</a> <a class="btn ghost" href="' + planPath + '" download>Download</a></article>' +
        '<article class="report"><span class="type">HABITAT MAP</span><h3>Whitetail Habitat Intelligence Map</h3><div class="meta">Updated July 2026 · PNG</div><p>Property boundary, wetlands, creeks, roads, early cover, five modeled bedding zones, and four modeled travel corridors.</p><a class="btn" href="' + mapPath + '" target="_blank" rel="noopener">Open map</a> <a class="btn ghost" href="' + mapPath + '" download>Download</a></article>' +
        '<article class="report future-report"><span class="type">FIELD INVENTORY</span><h3>Baseline Field Verification Report</h3><div class="meta">Planned · Year 1</div><p>Stand conditions, road classes, wetland verification, bedding evidence, corridor checks, photo points, and vegetation plots.</p><button class="btn ghost" disabled>Not yet published</button></article>' +
        '<article class="report future-report"><span class="type">WILDLIFE SURVEY</span><h3>Standardized Camera Survey</h3><div class="meta">Planned · Late summer · 14 days</div><p>Thirty to forty survey stations plus targeted corridor and treatment-interface cameras.</p><button class="btn ghost" disabled>Not yet published</button></article>' +
        '<article class="report future-report"><span class="type">PRESCRIBED FIRE</span><h3>Annual Burn Summary</h3><div class="meta">Planned · After first treatment season</div><p>Weather, ignition, acreage, fire behavior, refugia, results, photographs, and next-entry decisions.</p><button class="btn ghost" disabled>Not yet published</button></article>' +
        '<article class="report future-report"><span class="type">ANNUAL REVIEW</span><h3>Habitat Outcome Dashboard</h3><div class="meta">Planned · Annual update</div><p>Completed treatments, target progress, monitoring results, cost share, invoices, and next-year priorities.</p><button class="btn ghost" disabled>Not yet published</button></article>' +
      '</div>' + limitation() +
    '</div>';
  };

  views.photos = function () {
    var photos = [
      ['Bedding-zone cover check', 'BED-1 through BED-5 · Field verification'],
      ['Corridor pinch-point check', 'Four modeled routes · Camera and sign evidence'],
      ['Pine stand structure', 'Basal area, canopy closure, and herbaceous response'],
      ['Wetland buffer inspection', 'Hydrology, soils, crossings, and equipment exclusion'],
      ['Road and gate inventory', 'Maintain, seasonal, or close and restore'],
      ['Permanent vegetation plot', 'Canopy, browse, native cover, and screening']
    ];
    return '<div class="page">' + heading('Field Documentation', 'The photographic record to collect during the Year 1 property verification') +
      '<div class="photo-grid">' + photos.map(function (p, index) {
        return '<article class="photo"><div class="photo-art photo-' + (index + 1) + '"><span>FIELD VERIFICATION SLOT</span><strong>' + p[0] + '</strong></div><div class="photo-info"><strong>' + p[0] + '</strong><span>' + p[1] + '</span></div></article>';
      }).join('') + '</div>' + limitation() + '</div>';
  };

  views.map = function () {
    return '<div class="page">' +
      heading('Property Map', 'Documented resources and modeled whitetail habitat features across the 7,645-acre tract') +
      managementMap(false) +
      '<div class="grid-equal section-gap"><div class="panel"><div class="panel-head"><h2>Documented Layers</h2></div><div class="panel-body layer-list"><span><i class="wetland"></i>NWI wetland</span><span><i class="creek"></i>Creeks and drainages</span><span><i class="early"></i>Early-successional cover</span><span><i class="road"></i>Native / gravel roads</span><span><i class="boundary"></i>Property boundary</span></div></div><div class="panel"><div class="panel-head"><h2>Modeled Layers</h2></div><div class="panel-body layer-list"><span><i class="bedding"></i>BED-1 through BED-5</span><span><i class="travel"></i>Four travel corridors</span><p class="mini-note">Modeled features are management hypotheses. Confirm them with cameras, field sign, vegetation structure, and seasonal use before establishing treatment boundaries.</p></div></div></div>' +
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
