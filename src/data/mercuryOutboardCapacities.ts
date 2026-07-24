export interface MercuryOutboardCapacityRow {
  model: string;
  year: string;
  notes: string;
  crankcaseQt: string;
  crankcaseL: string;
  gearcaseOz: string;
  crankcaseOil: string;
  gearLube: string;
  oilFilter: string;
  sourcePage: 24 | 25 | 26 | 27;
}

const PREMIUM_GEAR_LUBE = 'Mercury 80W-90 Premium';
const HIGH_PERFORMANCE_GEAR_LUBE = 'Mercury SAE 90 High Performance';
const EXTREME_PERFORMANCE_GEAR_LUBE = 'Mercury 85W-90 Extreme Performance';

/**
 * Transcribed from Mercury Marine's 2026 Capacity Guide, document 8M0243459,
 * pages 24-27. Values are reference capacities, not instructions to pour the
 * listed amount without checking the dipstick or the serial-number manual.
 */
export const mercuryOutboardCapacities: MercuryOutboardCapacityRow[] = [
  { model: '2.5 / 3.5 HP', year: '2006+', notes: 'FourStroke', crankcaseQt: '0.31', crankcaseL: '0.29', gearcaseOz: '6.1', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '4 / 5 / 6 HP', year: '1999+', notes: 'FourStroke', crankcaseQt: '0.48', crankcaseL: '0.45', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '5 HP', year: '2019', notes: 'Propane', crankcaseQt: '0.47', crankcaseL: '0.44', gearcaseOz: '6.6', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '8 HP', year: '1995-2000', notes: '232 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '8 HP', year: '2001-2004', notes: '323 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '8 HP', year: '2005+', notes: '209 cc', crankcaseQt: '0.84', crankcaseL: '0.79', gearcaseOz: '10.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '9.9 HP', year: '1995-1998', notes: '232 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '9.9 HP', year: '1999-2004', notes: '323 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '9.9 HP', year: '2005+', notes: '209 cc', crankcaseQt: '0.84', crankcaseL: '0.79', gearcaseOz: '10.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: 'Not fitted', sourcePage: 24 },
  { model: '15 HP', year: '1998-2005', notes: '323 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '6.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '15 HP', year: '1998-2005', notes: '323 cc, BigFoot gearcase', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '8.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '15 HP', year: '2005+', notes: '351 cc', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '12.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '15 / 20 HP', year: '2018', notes: 'EFI', crankcaseQt: '1.1', crankcaseL: '1.04', gearcaseOz: '15.6', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '20 HP', year: '2008+', notes: 'FourStroke', crankcaseQt: '1.05', crankcaseL: '0.99', gearcaseOz: '12.5', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '25 HP', year: '1998-2006', notes: '498 cc carbureted, BigFoot gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '14.9', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 24 },
  { model: '25 HP', year: '2006+', notes: '492 cc EFI, standard gearcase', crankcaseQt: '1.9', crankcaseL: '1.8', gearcaseOz: '11.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '25 HP', year: '2006+', notes: '492 cc EFI, BigFoot gearcase', crankcaseQt: '1.9', crankcaseL: '1.8', gearcaseOz: '14.9', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },
  { model: '25 HP', year: '2022+', notes: '500 cc', crankcaseQt: '1.5', crankcaseL: '1.4', gearcaseOz: '15.6', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 24 },

  { model: '30 HP', year: '1999-2005', notes: '747 cc, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '14.9', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '30 HP', year: '1999-2005', notes: '747 cc, BigFoot gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '22.5', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '30 HP', year: '2006+', notes: '492 cc EFI', crankcaseQt: '1.9', crankcaseL: '1.8', gearcaseOz: '11.8', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 25 },
  { model: '30 HP', year: '2022+', notes: '500 cc', crankcaseQt: '1.5', crankcaseL: '1.4', gearcaseOz: '15.6', crankcaseOil: 'Mercury 10W-30', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162832', sourcePage: 25 },
  { model: '35 HP', year: '2017', notes: 'Jet', crankcaseQt: '3', crankcaseL: '2.84', gearcaseOz: 'None', crankcaseOil: 'Mercury 25W-40', gearLube: 'Not applicable', oilFilter: '8M0162830', sourcePage: 25 },
  { model: '40 HP', year: '1999+', notes: '747 cc, 3-cylinder, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '14.9', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '40 HP', year: '1999+', notes: '747 cc, 3-cylinder, BigFoot gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '22.5', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '40 HP', year: '2001+', notes: '996 cc, 4-cylinder, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '14.9', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '40 HP', year: '2001+', notes: '996 cc, 4-cylinder, BigFoot or Command Thrust gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '50 HP', year: '1995-2000', notes: '935 cc, 4-cylinder, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '14.9', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '50 HP', year: '1995-2000', notes: '935 cc, 4-cylinder, BigFoot gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '22.5', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '50 HP', year: '2001+', notes: '996 cc, 4-cylinder, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '11.5', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '50 HP', year: '2001+', notes: '996 cc, 4-cylinder, BigFoot gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '60 HP', year: '2001+', notes: '996 cc, 4-cylinder, standard gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '11.5', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '60 HP', year: '2001+', notes: '996 cc, 4-cylinder, BigFoot or Command Thrust gearcase', crankcaseQt: '3.17', crankcaseL: '3', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: PREMIUM_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '75 HP', year: '2000-2005', notes: 'Carbureted', crankcaseQt: '5.28', crankcaseL: '5', gearcaseOz: '22.5', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '75 HP', year: '2006', notes: 'EFI, serial 1B366822 and below', crankcaseQt: '4.8', crankcaseL: '4.54', gearcaseOz: '22.5', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '75 HP', year: '2006-2014', notes: 'EFI, serial 1B366823 through 2B094995', crankcaseQt: '5.28', crankcaseL: '5', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877761Q01', sourcePage: 25 },
  { model: '90 HP', year: '2000-2005', notes: 'Carbureted', crankcaseQt: '5.28', crankcaseL: '5', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '90 HP', year: '2006', notes: 'EFI, serial 1B366822 and below', crankcaseQt: '4.8', crankcaseL: '4.54', gearcaseOz: '22.5', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },
  { model: '90 HP', year: '2006+', notes: 'EFI, serial 1B366823 and up', crankcaseQt: '5.28', crankcaseL: '5', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877761Q01', sourcePage: 25 },
  { model: '115 HP', year: '2001-2006', notes: 'EFI, serial 1B366822 and below', crankcaseQt: '5.28', crankcaseL: '5', gearcaseOz: '24', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 25 },

  { model: '115 HP Pro XS', year: '2016+', notes: '2.1 L, serial 2B225488 and above', crankcaseQt: '5.5', crankcaseL: '5.2', gearcaseOz: '27.1', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 26 },
  { model: '115 HP', year: '2014-2017', notes: 'EFI, serial 2B094996 and up', crankcaseQt: '5.5', crankcaseL: '5.2', gearcaseOz: '27.1', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 26 },
  { model: '75 / 90 / 115 HP', year: '2014+', notes: '2.1 L, serial 2B094996 and up', crankcaseQt: '5.5', crankcaseL: '5.2', gearcaseOz: '27.1', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0162830', sourcePage: 26 },
  { model: '150 HP', year: '2011+', notes: 'EFI', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '28.1', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877761Q01', sourcePage: 26 },
  { model: '175 HP Pro XS', year: '2018', notes: '3.4 L V6', crankcaseQt: '7', crankcaseL: '6.62', gearcaseOz: '24', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0176312', sourcePage: 26 },
  { model: '175-225 HP FourStroke', year: '2018', notes: '3.4 L V6', crankcaseQt: '7', crankcaseL: '6.62', gearcaseOz: '24', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0176312', sourcePage: 26 },
  { model: '200-300 HP Pro XS', year: '2018', notes: '4.6 L V8', crankcaseQt: '7', crankcaseL: '6.62', gearcaseOz: 'Not listed', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0176312', sourcePage: 26 },
  { model: '200-300 HP FourStroke', year: '2018', notes: '4.6 L V8', crankcaseQt: '7', crankcaseL: '6.62', gearcaseOz: '24.4', crankcaseOil: 'Mercury 10W-30 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0176312', sourcePage: 26 },
  { model: '135 HP Verado', year: '2006+', notes: '4-cylinder', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877767Q01', sourcePage: 26 },
  { model: '150 HP Pro XS', year: '2018', notes: 'Inline 4-cylinder', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877767Q01', sourcePage: 26 },
  { model: '150 HP Verado', year: '2006+', notes: '4-cylinder', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877767Q01', sourcePage: 26 },
  { model: '175 HP Verado', year: '2006+', notes: '4-cylinder', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877767Q01', sourcePage: 26 },
  { model: '200 HP Verado', year: '2007+', notes: '4-cylinder', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877767Q01', sourcePage: 26 },
  { model: '225 HP', year: '2003-2006', notes: 'EFI', crankcaseQt: '6.34', crankcaseL: '6', gearcaseOz: '39', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 26 },
  { model: '200 HP Verado', year: '2005+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 26 },

  { model: '225 HP Verado', year: '2005+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '250 HP Verado', year: '2005+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '275 HP Verado', year: '2005+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '300 HP Verado', year: '2007+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '32.8', crankcaseOil: 'Mercury 25W-40', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '350 HP Verado', year: '2015+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '28.7', crankcaseOil: 'Mercury 25W-40 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '400 HP Verado', year: '2019+', notes: '6-cylinder', crankcaseQt: '7.4', crankcaseL: '7', gearcaseOz: '28.7', crankcaseOil: 'Mercury 25W-40 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '877769Q01', sourcePage: 27 },
  { model: '350 HP Verado', year: '2022+', notes: 'V10; left-hand gearcase 46.7 oz, right-hand 53.4 oz', crankcaseQt: '10', crankcaseL: '9.5', gearcaseOz: '46.7 / 53.4', crankcaseOil: 'Mercury 25W-40 Synthetic Blend', gearLube: EXTREME_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0205849', sourcePage: 27 },
  { model: '400 HP Verado', year: '2022+', notes: 'V10; left-hand gearcase 46.7 oz, right-hand 53.4 oz', crankcaseQt: '10', crankcaseL: '9.5', gearcaseOz: '46.7 / 53.4', crankcaseOil: 'Mercury 25W-40 Synthetic Blend', gearLube: EXTREME_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0205849', sourcePage: 27 },
  { model: '400R', year: '2023+', notes: '137 mm HD gearcase, 85 mph and below', crankcaseQt: '10', crankcaseL: '9.5', gearcaseOz: '27.73', crankcaseOil: 'Mercury 25W-50 High Performance Blend', gearLube: EXTREME_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0205848', sourcePage: 27 },
  { model: '400R', year: '2023+', notes: 'Sport Master gearcase, 85 mph and above', crankcaseQt: '10', crankcaseL: '9.5', gearcaseOz: '20.96', crankcaseOil: 'Mercury 25W-50 High Performance Blend', gearLube: EXTREME_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0205848', sourcePage: 27 },
  { model: '500 HP SeaPro / Verado', year: '2021+', notes: 'V12', crankcaseQt: '14', crankcaseL: '13.25', gearcaseOz: '94.7', crankcaseOil: 'Mercury 25W-40 Synthetic Blend', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0168366', sourcePage: 27 },
  { model: '600 HP Verado', year: '2021+', notes: 'V12', crankcaseQt: '14', crankcaseL: '13.25', gearcaseOz: '94.7', crankcaseOil: 'Mercury 10W-30 Full Synthetic', gearLube: HIGH_PERFORMANCE_GEAR_LUBE, oilFilter: '8M0168366', sourcePage: 27 },
];

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

export const mercuryCapacityTableMarkdown = [
  '| Model / HP | Year | Identifying notes | Crankcase capacity | Gearcase capacity | Recommended oil | Oil filter |',
  '|---|---|---|---:|---:|---|---|',
  ...mercuryOutboardCapacities.map((row) =>
    `| ${escapeCell(row.model)} | ${escapeCell(row.year)} | ${escapeCell(row.notes)} | ${row.crankcaseQt} qt / ${row.crankcaseL} L | ${row.gearcaseOz === 'None' || row.gearcaseOz === 'Not listed' ? row.gearcaseOz : `${row.gearcaseOz} oz`} | ${escapeCell(row.crankcaseOil)} | ${escapeCell(row.oilFilter)} |`,
  ),
].join('\n');
