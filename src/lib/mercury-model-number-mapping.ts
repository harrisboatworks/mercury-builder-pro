// Mercury Model Number Mapping System
// Maps motor display names to correct Mercury model numbers based on official reference

export interface MercuryModelMapping {
  modelNumber: string;
  description: string;
  hp: number;
  family: 'FourStroke' | 'ProXS' | 'SeaPro' | 'Verado';
  riggingCode: string;
}

// Official Mercury model number mappings from Harris Boat Works reference
const MERCURY_MODEL_MAPPINGS: MercuryModelMapping[] = [
  // FourStroke Motors
  { modelNumber: '1F02201KK', description: '2.5 MH FourStroke', hp: 2.5, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1F03201KK', description: '3.5 MH FourStroke', hp: 3.5, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1F03211KK', description: '3.5 MLH FourStroke', hp: 3.5, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1F04201KK', description: '4 MH FourStroke', hp: 4, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1F04211KK', description: '4 MLH FourStroke', hp: 4, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1FX5201KK', description: '5 MH FourStroke', hp: 5, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1F05221KK', description: '5 MXLH FourStroke', hp: 5, family: 'FourStroke', riggingCode: 'MXLH' },
  { modelNumber: '1F05216KK', description: '5 MLHA Sail Power FourStroke', hp: 5, family: 'FourStroke', riggingCode: 'MLHA' },
  { modelNumber: '1FX6201KK', description: '6 MH FourStroke', hp: 6, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1FX6211KK', description: '6 MLH FourStroke', hp: 6, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A08201LK', description: '8 MH FourStroke', hp: 8, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1A08211LK', description: '8 MLH FourStroke', hp: 8, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A08301LK', description: '8 EH FourStroke', hp: 8, family: 'FourStroke', riggingCode: 'EH' },
  { modelNumber: '1A08311LK', description: '8 ELH FourStroke', hp: 8, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A10204LV', description: '9.9 MRC FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'MRC' },
  { modelNumber: '1A10201LK', description: '9.9 MH FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1A10211LK', description: '9.9 MLH FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A10301LK', description: '9.9 EH FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EH' },
  { modelNumber: '1A10312LK', description: '9.9 EL FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EL' },
  { modelNumber: '1A10311LK', description: '9.9 ELH FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A10402LK', description: '9.9 EPT FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1A10251LK', description: '9.9 MLH Command Thrust FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A10261LK', description: '9.9 MXLH Command Thrust FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'MXLH' },
  { modelNumber: '1A10351LK', description: '9.9 ELH Command Thrust FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A10361LK', description: '9.9 EXLH Command Thrust FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EXLH' },
  { modelNumber: '1A10452LK', description: '9.9 ELPT Command Thrust ProKicker EFI FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A10462LK', description: '9.9 EXLPT Command Thrust ProKicker EFI FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1A10451LK', description: '9.9 ELHPT Command Thrust ProKicker EFI FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1A10461LK', description: '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke', hp: 9.9, family: 'FourStroke', riggingCode: 'EXLHPT' },
  { modelNumber: '1A15204LK', description: '15 MRC FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'MRC' },
  { modelNumber: '1A15201LK', description: '15 MH FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1A15211LK', description: '15 MLH FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A15302LK', description: '15 E FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'E' },
  { modelNumber: '1A15312LK', description: '15 EL FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EL' },
  { modelNumber: '1A15301LK', description: '15 EH FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EH' },
  { modelNumber: '1A15311LK', description: '15 ELH FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A15402LK', description: '15 EPT FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1A15401LK', description: '15 EHPT FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EHPT' },
  { modelNumber: '1A15412LK', description: '15 ELPT FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A15452BK', description: '15 ELPT ProKicker FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A15462BK', description: '15 EXLPT ProKicker FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1A15451BK', description: '15 ELHPT ProKicker FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1A15461BK', description: '15 EXLHPT ProKicker FourStroke', hp: 15, family: 'FourStroke', riggingCode: 'EXLHPT' },
  { modelNumber: '1A20204LK', description: '20 MRC FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'MRC' },
  { modelNumber: '1A20201LK', description: '20 MH FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1A20211LK', description: '20 MLH FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A20301LK', description: '20 EH FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'EH' },
  { modelNumber: '1A20302LK', description: '20 E FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'E' },
  { modelNumber: '1A20311LK', description: '20 ELH FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A20312LK', description: '20 EL FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'EL' },
  { modelNumber: '1A20402LK', description: '20 EPT FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1A20411LK', description: '20 ELHPT FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1A20412LK', description: '20 ELPT FourStroke', hp: 20, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A25203BK', description: '25 MH FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'MH' },
  { modelNumber: '1A25213BK', description: '25 MLH FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'MLH' },
  { modelNumber: '1A25301BK', description: '25 EH FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'EH' },
  { modelNumber: '1A25311BK', description: '25 ELH FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'ELH' },
  { modelNumber: '1A25312BK', description: '25 EL FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'EL' },
  { modelNumber: '1A25403BK', description: '25 EPT FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1A25411BK', description: '25 ELHPT FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1A25413BK', description: '25 ELPT FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A25452BK', description: '25 ELPT ProKicker FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A25462BK', description: '25 EXLPT ProKicker FourStroke', hp: 25, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1A3G203BK', description: '30 MHGA FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'MHGA' },
  { modelNumber: '1A3G213BK', description: '30 MLHGA FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'MLHGA' },
  { modelNumber: '1A3G313BK', description: '30 ELGA FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'ELGA' },
  { modelNumber: '1A3G311BK', description: '30 ELHGA FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'ELHGA' },
  { modelNumber: '1A30403BK', description: '30 EPT FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1A30413BK', description: '30 ELPT FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1A30411BK', description: '30 ELHPT FourStroke', hp: 30, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F40403GZ', description: '40 EPT FourStroke', hp: 40, family: 'FourStroke', riggingCode: 'EPT' },
  { modelNumber: '1F40413GZ', description: '40 ELPT FourStroke', hp: 40, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F4041TJZ', description: '40 ELHPT FourStroke Tiller', hp: 40, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F41453GZ', description: '40 ELPT Command Thrust (Four-Cylinder) FourStroke', hp: 40, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F51413GZ', description: '50 ELPT FourStroke', hp: 50, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F5141TJZ', description: '50 ELHPT FourStroke Tiller', hp: 50, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F51453GZ', description: '50 ELPT Command Thrust FourStroke', hp: 50, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F5145TJZ', description: '50 ELHPT Command Thrust FourStroke Tiller', hp: 50, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F60413GZ', description: '60 ELPT FourStroke', hp: 60, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F6041TJZ', description: '60 ELHPT FourStroke Tiller', hp: 60, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F60453GZ', description: '60 ELPT Command Thrust FourStroke', hp: 60, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F60463GZ', description: '60 EXLPT Command Thrust FourStroke', hp: 60, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1F6045TJZ', description: '60 ELHPT Command Thrust FourStroke Tiller', hp: 60, family: 'FourStroke', riggingCode: 'ELHPT' },
  { modelNumber: '1F754132D', description: '75 ELPT FourStroke', hp: 75, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F904132D', description: '90 ELPT FourStroke', hp: 90, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F904232D', description: '90 EXLPT FourStroke', hp: 90, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1F904532D', description: '90 ELPT Command Thrust FourStroke', hp: 90, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1F904632D', description: '90 EXLPT Command Thrust FourStroke', hp: 90, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1115F132D', description: '115 ELPT FourStroke', hp: 115, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1115F232D', description: '115 EXLPT FourStroke', hp: 115, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1115F532D', description: '115 ELPT Command Thrust FourStroke', hp: 115, family: 'FourStroke', riggingCode: 'ELPT' },
  { modelNumber: '1115F632D', description: '115 EXLPT Command Thrust FourStroke', hp: 115, family: 'FourStroke', riggingCode: 'EXLPT' },
  { modelNumber: '1115F642D', description: '115 ECXLPT Command Thrust FourStroke', hp: 115, family: 'FourStroke', riggingCode: 'ECXLPT' },
  { modelNumber: '1150F13ED', description: '150 L FourStroke', hp: 150, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '1150F23ED', description: '150 XL FourStroke', hp: 150, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '1150F24ED', description: '150 CXL FourStroke', hp: 150, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '11750005A', description: '175 L FourStroke DTS', hp: 175, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '11750006A', description: '175 XL FourStroke DTS', hp: 175, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '11750007A', description: '175 CXL FourStroke DTS', hp: 175, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12000001A', description: '200 L FourStroke', hp: 200, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12000009A', description: '200 XL FourStroke', hp: 200, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12000029A', description: '200 CXL FourStroke', hp: 200, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12000005A', description: '200 L FourStroke DTS', hp: 200, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12000013A', description: '200 XL FourStroke DTS', hp: 200, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12000017A', description: '200 CXL FourStroke DTS', hp: 200, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12250001A', description: '225 L FourStroke', hp: 225, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12250009A', description: '225 XL FourStroke', hp: 225, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12250047A', description: '225 CXL FourStroke', hp: 225, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12250021A', description: '225 XXL FourStroke', hp: 225, family: 'FourStroke', riggingCode: 'XXL' },
  { modelNumber: '12250005A', description: '225 L FourStroke DTS', hp: 225, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12250013A', description: '225 XL FourStroke DTS', hp: 225, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12250017A', description: '225 CXL FourStroke DTS', hp: 225, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12250025A', description: '225 XXL FourStroke DTS', hp: 225, family: 'FourStroke', riggingCode: 'XXL' },
  { modelNumber: '12250029A', description: '225 CXXL FourStroke DTS', hp: 225, family: 'FourStroke', riggingCode: 'CXXL' },
  { modelNumber: '12500001A', description: '250 L FourStroke', hp: 250, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12500009A', description: '250 XL FourStroke', hp: 250, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12500083A', description: '250 CXL FourStroke', hp: 250, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12500021A', description: '250 XXL FourStroke', hp: 250, family: 'FourStroke', riggingCode: 'XXL' },
  { modelNumber: '12500087A', description: '250 CXXL FourStroke', hp: 250, family: 'FourStroke', riggingCode: 'CXXL' },
  { modelNumber: '12500005A', description: '250 L FourStroke DTS', hp: 250, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '12500013A', description: '250 XL FourStroke DTS', hp: 250, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '12500017A', description: '250 CXL FourStroke DTS', hp: 250, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '12500025A', description: '250 XXL FourStroke DTS', hp: 250, family: 'FourStroke', riggingCode: 'XXL' },
  { modelNumber: '12500029A', description: '250 CXXL FourStroke DTS', hp: 250, family: 'FourStroke', riggingCode: 'CXXL' },
  { modelNumber: '13000002A', description: '300 L FourStroke', hp: 300, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '13000010A', description: '300 XL FourStroke', hp: 300, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '13000111A', description: '300 CXL FourStroke', hp: 300, family: 'FourStroke', riggingCode: 'CXL' },
  { modelNumber: '13000006A', description: '300 L FourStroke DTS', hp: 300, family: 'FourStroke', riggingCode: 'L' },
  { modelNumber: '13000014A', description: '300 XL FourStroke DTS', hp: 300, family: 'FourStroke', riggingCode: 'XL' },
  { modelNumber: '13000018A', description: '300 CXL FourStroke DTS', hp: 300, family: 'FourStroke', riggingCode: 'CXL' },
  
  // ProXS Motors
  { modelNumber: '1117F131D', description: '115 ELPT Pro XS', hp: 115, family: 'ProXS', riggingCode: 'ELPT' },
  { modelNumber: '1117F231D', description: '115 EXLPT Pro XS', hp: 115, family: 'ProXS', riggingCode: 'EXLPT' },
  { modelNumber: '1117F531D', description: '115 ELPT Pro XS Command Thrust', hp: 115, family: 'ProXS', riggingCode: 'ELPT' },
  { modelNumber: '1117F631D', description: '115 EXLPT Pro XS Command Thrust', hp: 115, family: 'ProXS', riggingCode: 'EXLPT' },
  { modelNumber: '1152F131D', description: '150 L Pro XS', hp: 150, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '1152F231D', description: '150 XL Pro XS', hp: 150, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '11750001A', description: '175 L Pro XS', hp: 175, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '11750002A', description: '175 XL Pro XS', hp: 175, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12000027A', description: '200 L Pro XS TorqueMaster', hp: 200, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12000039A', description: '200 L Pro XS', hp: 200, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12000041A', description: '200 XL Pro XS', hp: 200, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12000035A', description: '200 L Pro XS DTS TorqueMaster', hp: 200, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12000040A', description: '200 XL Pro XS DTS', hp: 200, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12250033A', description: '225 L Pro XS TorqueMaster', hp: 225, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12250034A', description: '225 XL Pro XS', hp: 225, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12250053A', description: '225 L Pro XS DTS TorqueMaster', hp: 225, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12250055A', description: '225 XL Pro XS DTS', hp: 225, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12500033A', description: '250 L Pro XS TorqueMaster', hp: 250, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12500034A', description: '250 XL Pro XS', hp: 250, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '12500094A', description: '250 L Pro XS DTS TorqueMaster', hp: 250, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '12500096A', description: '250 XL Pro XS DTS', hp: 250, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '13000022A', description: '300 L Pro XS TorqueMaster', hp: 300, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '13000023A', description: '300 XL Pro XS', hp: 300, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '13000177A', description: '300 L Pro XS DTS TorqueMaster', hp: 300, family: 'ProXS', riggingCode: 'L' },
  { modelNumber: '13000179A', description: '300 XL Pro XS DTS', hp: 300, family: 'ProXS', riggingCode: 'XL' },
  { modelNumber: '13000181A', description: '300 CXL Pro XS DTS', hp: 300, family: 'ProXS', riggingCode: 'CXL' },
];

// Create lookup maps for fast searching
const descriptionToModelMap = new Map<string, string>();
const modelToDescriptionMap = new Map<string, string>();

MERCURY_MODEL_MAPPINGS.forEach(mapping => {
  descriptionToModelMap.set(mapping.description, mapping.modelNumber);
  modelToDescriptionMap.set(mapping.modelNumber, mapping.description);
});

/**
 * Get the correct Mercury model number for a given model display name
 * @param modelDisplay - The motor display name (e.g., "9.9 ELH FourStroke")
 * @returns The correct Mercury model number or null if not found
 */
export function getCorrectModelNumber(modelDisplay: string): string | null {
  // First try exact match
  let exactMatch = descriptionToModelMap.get(modelDisplay);
  if (exactMatch) return exactMatch;

  // Try normalized match (handle variations in spacing, case, etc.)
  const normalized = modelDisplay.trim().replace(/\s+/g, ' ');
  exactMatch = descriptionToModelMap.get(normalized);
  if (exactMatch) return exactMatch;

  // Try fuzzy matching for common variations
  for (const [description, modelNumber] of descriptionToModelMap.entries()) {
    if (description.replace(/\s+/g, ' ').toLowerCase() === normalized.toLowerCase()) {
      return modelNumber;
    }
  }

  return null;
}

/**
 * Get the display name for a given Mercury model number
 * @param modelNumber - The Mercury model number (e.g., "1A10311LK")
 * @returns The display name or null if not found
 */
export function getModelDisplayName(modelNumber: string): string | null {
  return modelToDescriptionMap.get(modelNumber) || null;
}

/**
 * Validate if a model number exists in our official mapping
 * @param modelNumber - The model number to validate
 * @returns true if the model number is valid, false otherwise
 */
export function isValidModelNumber(modelNumber: string): boolean {
  return modelToDescriptionMap.has(modelNumber);
}

/**
 * Get all available model mappings (for debugging/admin purposes)
 */
export function getAllModelMappings(): MercuryModelMapping[] {
  return [...MERCURY_MODEL_MAPPINGS];
}

/**
 * Get mapping statistics
 */
export function getMappingStats() {
  const familyCounts = MERCURY_MODEL_MAPPINGS.reduce((acc, mapping) => {
    acc[mapping.family] = (acc[mapping.family] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMappings: MERCURY_MODEL_MAPPINGS.length,
    familyBreakdown: familyCounts,
    hpRange: {
      min: Math.min(...MERCURY_MODEL_MAPPINGS.map(m => m.hp)),
      max: Math.max(...MERCURY_MODEL_MAPPINGS.map(m => m.hp))
    }
  };
}

/**
 * Get the correct Mercury model number for display based on motor details
 * This function looks up the official Mercury model number from our mapping
 * instead of using the potentially incorrect database model_number field
 */
export function getCorrectModelNumberForDisplay(motor: {
  model?: string;
  model_display?: string;
  horsepower?: number;
  family?: string;
  rigging_code?: string;
  model_number?: string;
}): string | null {
  if (!motor) return null;

  console.log('🔍 Looking up model number for motor:', {
    model: motor.model,
    model_display: motor.model_display,
    hp: motor.horsepower,
    family: motor.family,
    rigging: motor.rigging_code
  });

  // Try exact match with model field first (most reliable)
  if (motor.model) {
    const exactMatch = getCorrectModelNumber(motor.model);
    if (exactMatch) {
      console.log('✅ Found exact match for model:', motor.model, '->', exactMatch);
      return exactMatch;
    }
    
    // Try with "ProKicker" added for ELHPT/ELPT motors
    if (motor.model.includes('ELHPT') || motor.model.includes('ELPT')) {
      const withProKicker = motor.model.replace(' FourStroke', ' ProKicker FourStroke');
      const proKickerMatch = getCorrectModelNumber(withProKicker);
      if (proKickerMatch) {
        console.log('✅ Found ProKicker match for model:', withProKicker, '->', proKickerMatch);
        return proKickerMatch;
      }
    }
    
    // Try normalized variations of the model string
    const normalized = motor.model.replace(/\s+/g, ' ').trim();
    const normalizedMatch = getCorrectModelNumber(normalized);
    if (normalizedMatch) {
      console.log('✅ Found normalized match for model:', normalized, '->', normalizedMatch);
      return normalizedMatch;
    }
  }

  // Try exact match with model_display if different from model
  if (motor.model_display && motor.model_display !== motor.model) {
    const exactMatch = getCorrectModelNumber(motor.model_display);
    if (exactMatch) {
      console.log('✅ Found exact match for model_display:', motor.model_display, '->', exactMatch);
      return exactMatch;
    }
    
    // Try with "ProKicker" added for ELHPT/ELPT motors
    if (motor.model_display.includes('ELHPT') || motor.model_display.includes('ELPT')) {
      const withProKicker = motor.model_display.replace(' FourStroke', ' ProKicker FourStroke');
      const proKickerMatch = getCorrectModelNumber(withProKicker);
      if (proKickerMatch) {
        console.log('✅ Found ProKicker match for model_display:', withProKicker, '->', proKickerMatch);
        return proKickerMatch;
      }
    }
  }

  // If no exact string match found, try to construct expected display name and match
  if (motor.horsepower && motor.family && motor.rigging_code) {
    // Construct what the display name should look like
    const constructedDisplay = `${motor.horsepower}${motor.rigging_code} ${motor.family}`;
    const constructedMatch = getCorrectModelNumber(constructedDisplay);
    if (constructedMatch) {
      console.log('✅ Found constructed match:', constructedDisplay, '->', constructedMatch);
      return constructedMatch;
    }

    // Try without spaces in rigging code
    const constructedDisplayNoSpace = `${motor.horsepower}${motor.rigging_code}${motor.family}`;
    const constructedMatchNoSpace = getCorrectModelNumber(constructedDisplayNoSpace);
    if (constructedMatchNoSpace) {
      console.log('✅ Found constructed no-space match:', constructedDisplayNoSpace, '->', constructedMatchNoSpace);
      return constructedMatchNoSpace;
    }
  }

  console.log('❌ No match found, falling back to database model_number:', motor.model_number);
  // Final fallback to existing model_number or null
  return motor.model_number || null;
}