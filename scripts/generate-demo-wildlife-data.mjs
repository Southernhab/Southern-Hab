import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'portal', 'demo', 'files');
fs.mkdirSync(outDir, { recursive: true });

const units = [
  'North Pine',
  'West Drainage',
  'Central Pine',
  'South Ridge',
  'East Wetland Edge',
  'Opening Complex'
];

const seasons = [
  {
    season: '2024-25',
    managementYear: 1,
    startYear: 2024,
    classes: [
      { sexClass: 'Antlered buck', sex: 'M', age: 1.5, count: 9, weight: 100, kfi: 32 },
      { sexClass: 'Antlered buck', sex: 'M', age: 2.5, count: 7, weight: 122, kfi: 37 },
      { sexClass: 'Antlered buck', sex: 'M', age: 3.5, count: 6, weight: 138, kfi: 42 },
      { sexClass: 'Antlered buck', sex: 'M', age: 4.5, count: 3, weight: 145, kfi: 46 },
      { sexClass: 'Antlered buck', sex: 'M', age: 5.5, count: 1, weight: 149, kfi: 44 },
      { sexClass: 'Adult doe', sex: 'F', age: 1.5, count: 10, weight: 77, kfi: 31 },
      { sexClass: 'Adult doe', sex: 'F', age: 2.5, count: 16, weight: 89, kfi: 36 },
      { sexClass: 'Adult doe', sex: 'F', age: 3.5, count: 9, weight: 95, kfi: 39 },
      { sexClass: 'Adult doe', sex: 'F', age: 4.5, count: 5, weight: 97, kfi: 37 },
      { sexClass: 'Fawn', sex: 'Mixed', age: 0.5, count: 6, weight: 51, kfi: 26 }
    ]
  },
  {
    season: '2025-26',
    managementYear: 2,
    startYear: 2025,
    classes: [
      { sexClass: 'Antlered buck', sex: 'M', age: 1.5, count: 6, weight: 104, kfi: 36 },
      { sexClass: 'Antlered buck', sex: 'M', age: 2.5, count: 7, weight: 127, kfi: 41 },
      { sexClass: 'Antlered buck', sex: 'M', age: 3.5, count: 8, weight: 143, kfi: 47 },
      { sexClass: 'Antlered buck', sex: 'M', age: 4.5, count: 6, weight: 151, kfi: 50 },
      { sexClass: 'Antlered buck', sex: 'M', age: 5.5, count: 3, weight: 155, kfi: 48 },
      { sexClass: 'Adult doe', sex: 'F', age: 1.5, count: 10, weight: 81, kfi: 36 },
      { sexClass: 'Adult doe', sex: 'F', age: 2.5, count: 18, weight: 94, kfi: 41 },
      { sexClass: 'Adult doe', sex: 'F', age: 3.5, count: 11, weight: 99, kfi: 44 },
      { sexClass: 'Adult doe', sex: 'F', age: 4.5, count: 7, weight: 100, kfi: 42 },
      { sexClass: 'Fawn', sex: 'Mixed', age: 0.5, count: 5, weight: 54, kfi: 31 }
    ]
  }
];

const weightOffsets = [-5, -3, -2, 0, 1, 3, 6];
const kfiOffsets = [-3, -1.5, -0.5, 0.5, 1.5, 3];
const dateSlots = [
  [11, 23], [11, 27], [12, 1], [12, 5], [12, 9], [12, 13], [12, 17], [12, 21],
  [12, 26], [12, 30], [1, 3], [1, 7], [1, 11], [1, 15], [1, 19], [1, 23],
  [1, 27], [1, 31], [2, 3], [2, 6]
];

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(headers, rows) {
  return [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))].join('\n') + '\n';
}

function centeredValues(count, target, offsets, decimals = 0) {
  const factor = 10 ** decimals;
  const values = Array.from({ length: count }, (_, i) => target + offsets[i % offsets.length]);
  const targetTotal = Math.round(target * count * factor) / factor;
  const currentTotal = Math.round(values.reduce((sum, value) => sum + value, 0) * factor) / factor;
  values[values.length - 1] += targetTotal - currentTotal;
  return values.map((value) => Math.round(value * factor) / factor);
}

function antlerPoints(age, index) {
  if (age < 1) return '';
  const ranges = {
    '1.5': [4, 5, 6, 7],
    '2.5': [7, 8, 8, 9],
    '3.5': [8, 9, 9, 10],
    '4.5': [9, 10, 10, 11],
    '5.5': [9, 10, 11, 11]
  };
  const options = ranges[String(age)] || [8];
  return options[index % options.length];
}

const deerRows = [];
let deerRecord = 1;
seasons.forEach((season, seasonIndex) => {
  let seasonDateIndex = 0;
  season.classes.forEach((group, groupIndex) => {
    const weights = centeredValues(group.count, group.weight, weightOffsets, 0);
    const kfis = centeredValues(group.count, group.kfi, kfiOffsets, 1);
    for (let i = 0; i < group.count; i += 1) {
      const slot = dateSlots[seasonDateIndex % dateSlots.length];
      const year = slot[0] >= 11 ? season.startYear : season.startYear + 1;
      const sex = group.sex === 'Mixed' ? (i % 2 === 0 ? 'F' : 'M') : group.sex;
      const kidneyWeight = Math.round((sex === 'M' ? 94 : 78) + group.age * 2 + ((i % 5) - 2) * 2);
      const fatWeight = Math.round(kidneyWeight * kfis[i]) / 100;
      deerRows.push({
        record_id: `PRD-D${String(deerRecord).padStart(3, '0')}`,
        season: season.season,
        harvest_date: `${year}-${String(slot[0]).padStart(2, '0')}-${String(slot[1]).padStart(2, '0')}`,
        management_year: season.managementYear,
        sex_class: group.sexClass,
        sex,
        age_years: group.age,
        age_method: group.age >= 3.5 && i % 3 === 0 ? 'Cementum annuli' : 'Tooth replacement/wear',
        whole_weight_lb: weights[i],
        kidney_weight_g: kidneyWeight,
        perirenal_fat_g: fatWeight.toFixed(1),
        kfi_percent: kfis[i].toFixed(1),
        antler_points: group.sexClass === 'Antlered buck' ? antlerPoints(group.age, i) : '',
        management_unit: units[(deerRecord + groupIndex + seasonIndex) % units.length],
        record_status: 'Complete'
      });
      deerRecord += 1;
      seasonDateIndex += 1;
    }
  });
});

const deerHeaders = [
  'record_id', 'season', 'harvest_date', 'management_year', 'sex_class', 'sex', 'age_years',
  'age_method', 'whole_weight_lb', 'kidney_weight_g', 'perirenal_fat_g', 'kfi_percent',
  'antler_points', 'management_unit', 'record_status'
];
fs.writeFileSync(path.join(outDir, 'pine-ridge-deer-harvest-log.csv'), rowsToCsv(deerHeaders, deerRows));

const thermalRows = [
  {
    survey: 'Winter 2025', survey_dates: '2025-02-20 to 2025-02-22', management_year: 1,
    sampled_acres: 2520, property_coverage_percent: 33.0, survey_nights: 3, flight_blocks: 12,
    unique_deer_detected: 126, estimated_bucks: 76, estimated_does: 176, estimated_fawns: 90,
    estimated_total: 342, confidence_interval_90: '306-381', deer_per_1000_acres: 44.7,
    buck_to_doe_ratio: '1:2.3', fawns_per_doe: 0.51
  },
  {
    survey: 'Winter 2026', survey_dates: '2026-02-18 to 2026-02-21', management_year: 2,
    sampled_acres: 2690, property_coverage_percent: 35.2, survey_nights: 4, flight_blocks: 13,
    unique_deer_detected: 141, estimated_bucks: 91, estimated_does: 182, estimated_fawns: 98,
    estimated_total: 371, confidence_interval_90: '333-414', deer_per_1000_acres: 48.5,
    buck_to_doe_ratio: '1:2.0', fawns_per_doe: 0.54
  }
];
const thermalHeaders = Object.keys(thermalRows[0]);
fs.writeFileSync(path.join(outDir, 'pine-ridge-thermal-drone-surveys.csv'), rowsToCsv(thermalHeaders, thermalRows));

const turkeySeasons = [
  { season: 2024, phase: 'Pre-management baseline', count: 4, start: [3, 29] },
  { season: 2025, phase: 'Post-management Year 1', count: 6, start: [3, 26] },
  { season: 2026, phase: 'Post-management Year 2', count: 8, start: [3, 25] }
];
const turkeyRows = [];
let turkeyRecord = 1;
turkeySeasons.forEach((season, seasonIndex) => {
  for (let i = 0; i < season.count; i += 1) {
    const isJake = i === season.count - 1;
    const day = season.start[1] + i * 4;
    const date = new Date(Date.UTC(season.season, season.start[0] - 1, day));
    const weight = isJake ? 15.4 + seasonIndex * 0.3 : 18.1 + ((i + seasonIndex) % 5) * 0.6;
    const beard = isJake ? 5.1 + seasonIndex * 0.2 : 9.1 + ((i + 2 * seasonIndex) % 5) * 0.45;
    const spur = isJake ? 0.38 + seasonIndex * 0.03 : 0.88 + ((i + seasonIndex) % 5) * 0.08;
    turkeyRows.push({
      record_id: `PRD-T${String(turkeyRecord).padStart(3, '0')}`,
      spring_season: season.season,
      harvest_date: date.toISOString().slice(0, 10),
      management_phase: season.phase,
      age_class: isJake ? 'Jake' : 'Adult gobbler',
      whole_weight_lb: weight.toFixed(1),
      beard_inches: beard.toFixed(1),
      left_spur_inches: spur.toFixed(2),
      right_spur_inches: (spur + (i % 2 === 0 ? 0.02 : -0.02)).toFixed(2),
      management_unit: units[(turkeyRecord + seasonIndex) % units.length],
      record_status: 'Complete'
    });
    turkeyRecord += 1;
  }
});
const turkeyHeaders = Object.keys(turkeyRows[0]);
fs.writeFileSync(path.join(outDir, 'pine-ridge-turkey-harvest-log.csv'), rowsToCsv(turkeyHeaders, turkeyRows));

console.log(`Generated ${deerRows.length} deer, ${thermalRows.length} thermal survey, and ${turkeyRows.length} turkey records.`);
