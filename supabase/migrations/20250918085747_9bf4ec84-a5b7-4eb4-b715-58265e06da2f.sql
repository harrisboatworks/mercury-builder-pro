-- Update all motors with official Mercury pricing
WITH pricing_data AS (
  SELECT unnest(ARRAY[
    '1F02201KK', '1F03201KK', '1F03211KK', '1F04201KK', '1F04211KK', '1FX5201KK', '1F05221KK', '1F05216KK',
    '1FX6201KK', '1FX6211KK', '1A08201LK', '1A08211LK', '1A08301LK', '1A08311LK', '1A10204LV', '1A10201LK',
    '1A10211LK', '1A10301LK', '1A10312LK', '1A10311LK', '1A10402LK', '1A10251LK', '1A10261LK', '1A10351LK',
    '1A10361LK', '1A10452LK', '1A10462LK', '1A10451LK', '1A10461LK', '1A15204LK', '1A15201LK', '1A15211LK',
    '1A15302LK', '1A15312LK', '1A15301LK', '1A15311LK', '1A15402LK', '1A15401LK', '1A15412LK', '1A15452BK',
    '1A15462BK', '1A15451BK', '1A15461BK', '1A20204LK', '1A20201LK', '1A20211LK', '1A20301LK', '1A20302LK',
    '1A20311LK', '1A20312LK', '1A20402LK', '1A20411LK', '1A20412LK', '1A25203BK', '1A25213BK', '1A25301BK',
    '1A25311BK', '1A25312BK', '1A25403BK', '1A25411BK', '1A25413BK', '1A25452BK', '1A25462BK', '1A3G203BK',
    '1A3G213BK', '1A3G313BK', '1A3G311BK', '1A30403BK', '1A30413BK', '1A30411BK', '1F40403GZ', '1F40413GZ',
    '1F4041TJZ', '1F41453GZ', '1F51413GZ', '1F5141TJZ', '1F51453GZ', '1F5145TJZ', '1F60413GZ', '1F6041TJZ',
    '1F60453GZ', '1F60463GZ', '1F6045TJZ', '1F754132D', '1F904132D', '1F904232D', '1F904532D', '1F904632D',
    '1115F132D', '1115F232D', '1115F532D', '1115F632D', '1115F642D', '1150F13ED', '1150F23ED', '1150F24ED',
    '11750005A', '11750006A', '11750007A', '12000001A', '12000009A', '12000029A', '12000005A', '12000013A',
    '12000017A', '12250001A', '12250009A', '12250047A', '12250021A', '12250005A', '12250013A', '12250017A',
    '12250025A', '12250029A', '12500001A', '12500009A', '12500083A', '12500021A', '12500087A', '12500005A',
    '12500013A', '12500017A', '12500025A', '12500029A', '13000002A', '13000010A', '13000111A', '13000006A',
    '13000014A', '13000018A', '1117F131D', '1117F231D', '1117F531D', '1117F631D', '1152F131D', '1152F231D',
    '11750001A', '11750002A', '12000027A', '12000039A', '12000041A', '12000035A', '12000040A', '12250033A',
    '12250034A', '12250053A', '12250055A', '12500033A', '12500034A', '12500094A', '12500096A', '13000022A',
    '13000023A', '13000177A', '13000179A', '13000181A'
  ]) as model_number,
  unnest(ARRAY[
    1270, 1524, 1557, 1815, 1854, 2019, 2090, 2057, 2084, 2118, 3036, 3075, 3344, 3383, 3548, 3553,
    3597, 3878, 3966, 4065, 4494, 3894, 4010, 4389, 4466, 4900, 4983, 5000, 5093, 3834, 3872, 3922,
    4191, 4218, 4218, 4274, 4758, 4785, 4686, 5368, 5456, 5462, 5572, 4186, 4230, 4268, 4686, 4675,
    4752, 4664, 5264, 5390, 5264, 4878, 4966, 5252, 5440, 5203, 5913, 6111, 5995, 6287, 6441, 6787,
    6842, 7359, 7480, 7524, 7805, 7926, 9460, 9532, 10054, 9900, 10703, 11358, 11126, 11600, 12161, 12826,
    12469, 12815, 13189, 14190, 14812, 15191, 15274, 15323, 16912, 17270, 17364, 17716, 17716, 22022, 22143, 22919,
    27269, 27401, 28111, 26912, 27044, 27731, 28760, 28892, 29601, 32307, 32423, 33126, 33094, 34194, 34314, 35040,
    35002, 35728, 34111, 34226, 34903, 35040, 35722, 36130, 36256, 36954, 37098, 37802, 36058, 36168, 36839, 38032,
    38159, 38852, 17320, 17666, 17765, 18117, 24107, 24233, 27616, 28006, 28122, 28122, 28479, 29992, 30399, 33038,
    33429, 34612, 35244, 34502, 35294, 36542, 37367, 36179, 36988, 38170, 39012, 39716
  ]) as dealer_price
),
pricing_with_descriptions AS (
  SELECT 
    model_number,
    dealer_price,
    unnest(ARRAY[
      '2.5MH FourStroke', '3.5MH FourStroke', '3.5MLH FourStroke', '4MH FourStroke', '4MLH FourStroke',
      '5MH FourStroke', '5MXLH FourStroke', '5MLHA Sail Power FourStroke', '6MH FourStroke', '6MLH FourStroke',
      '8MH FourStroke', '8MLH FourStroke', '8EH FourStroke', '8ELH FourStroke', '9.9MRC FourStroke',
      '9.9MH FourStroke', '9.9MLH FourStroke', '9.9EH FourStroke', '9.9EL FourStroke', '9.9ELH FourStroke',
      '9.9EPT FourStroke', '9.9MLH Command Thrust FourStroke', '9.9MXLH Command Thrust FourStroke',
      '9.9ELH Command Thrust FourStroke', '9.9EXLH Command Thrust FourStroke', '9.9ELPT Command Thrust ProKicker EFI FourStroke',
      '9.9EXLPT Command Thrust ProKicker EFI FourStroke', '9.9ELHPT Command Thrust ProKicker EFI FourStroke',
      '9.9EXLHPT Command Thrust ProKicker EFI FourStroke', '15MRC FourStroke', '15MH FourStroke', '15MLH FourStroke',
      '15E FourStroke', '15EL FourStroke', '15EH FourStroke', '15ELH FourStroke', '15EPT FourStroke',
      '15EHPT FourStroke', '15ELPT FourStroke', '15ELPT ProKicker FourStroke', '15EXLPT ProKicker FourStroke',
      '15ELHPT ProKicker FourStroke', '15EXLHPT ProKicker FourStroke', '20MRC FourStroke', '20MH FourStroke',
      '20MLH FourStroke', '20EH FourStroke', '20E FourStroke', '20ELH FourStroke', '20EL FourStroke',
      '20EPT FourStroke', '20ELHPT FourStroke', '20ELPT FourStroke', '25MH FourStroke', '25MLH FourStroke',
      '25EH FourStroke', '25ELH FourStroke', '25EL FourStroke', '25EPT FourStroke', '25ELHPT FourStroke',
      '25ELPT FourStroke', '25ELPT ProKicker FourStroke', '25EXLPT ProKicker FourStroke', '30MHGA FourStroke',
      '30MLHGA FourStroke', '30ELGA FourStroke', '30ELHGA FourStroke', '30EPT FourStroke', '30ELPT FourStroke',
      '30ELHPT FourStroke', '40EPT FourStroke', '40ELPT FourStroke', '40ELHPT FourStroke Tiller',
      '40ELPT Command Thrust (Four-Cylinder) FourStroke', '50ELPT FourStroke', '50ELHPT FourStroke Tiller',
      '50ELPT Command Thrust FourStroke', '50ELHPT Command Thrust FourStroke Tiller', '60ELPT FourStroke',
      '60ELHPT FourStroke Tiller', '60ELPT Command Thrust FourStroke', '60EXLPT Command Thrust FourStroke',
      '60ELHPT Command Thrust FourStroke Tiller', '75ELPT FourStroke', '90ELPT FourStroke', '90EXLPT FourStroke',
      '90ELPT Command Thrust FourStroke', '90EXLPT Command Thrust FourStroke', '115ELPT FourStroke',
      '115EXLPT FourStroke', '115ELPT Command Thrust FourStroke', '115EXLPT Command Thrust FourStroke',
      '115ECXLPT Command Thrust FourStroke', '150L FourStroke', '150XL FourStroke', '150CXL FourStroke',
      '175L FourStroke DTS', '175XL FourStroke DTS', '175CXL FourStroke DTS', '200L FourStroke',
      '200XL FourStroke', '200CXL FourStroke', '200L FourStroke DTS', '200XL FourStroke DTS',
      '200CXL FourStroke DTS', '225L FourStroke', '225XL FourStroke', '225CXL FourStroke', '225XXL FourStroke',
      '225L FourStroke DTS', '225XL FourStroke DTS', '225CXL FourStroke DTS', '225XXL FourStroke DTS',
      '225CXXL FourStroke DTS', '250L FourStroke', '250XL FourStroke', '250CXL FourStroke', '250XXL FourStroke',
      '250CXXL FourStroke', '250L FourStroke DTS', '250XL FourStroke DTS', '250CXL FourStroke DTS',
      '250XXL FourStroke DTS', '250CXXL FourStroke DTS', '300L FourStroke', '300XL FourStroke',
      '300CXL FourStroke', '300L FourStroke DTS', '300XL FourStroke DTS', '300CXL FourStroke DTS',
      '115ELPT Pro XS', '115EXLPT Pro XS', '115ELPT Pro XS Command Thrust', '115EXLPT Pro XS Command Thrust',
      '150L Pro XS', '150XL Pro XS', '175L Pro XS', '175XL Pro XS', '200L Pro XS TorqueMaster',
      '200L Pro XS', '200XL Pro XS', '200L Pro XS DTS TorqueMaster', '200XL Pro XS DTS',
      '225L Pro XS TorqueMaster', '225XL Pro XS', '225L Pro XS DTS TorqueMaster', '225XL Pro XS DTS',
      '250L Pro XS TorqueMaster', '250XL Pro XS', '250L Pro XS DTS TorqueMaster', '250XL Pro XS DTS',
      '300L Pro XS TorqueMaster', '300XL Pro XS', '300L Pro XS DTS TorqueMaster', '300XL Pro XS DTS',
      '300CXL Pro XS DTS'
    ]) as description
  FROM pricing_data
)
UPDATE motor_models 
SET 
  dealer_price = p.dealer_price,
  msrp = ROUND(p.dealer_price * 1.1),
  price_source = 'official_mercury_catalog',
  model_display = p.description,
  updated_at = now()
FROM pricing_with_descriptions p
WHERE motor_models.model_number = p.model_number 
  AND motor_models.is_brochure = true;