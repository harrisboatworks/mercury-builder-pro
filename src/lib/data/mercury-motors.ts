// Mercury Motors Complete Specifications Data
// Source: Mercury Marine Official Specifications
// Last Updated: 2025-01-01

export interface MercuryMotor {
  model: string;
  hp: number;
  category: 'Verado' | 'Pro XS' | 'FourStroke';
  cylinders: string;
  displacement: string;
  weight_kg: number;
  gear_ratio: string;
  gearcase?: string;
  max_rpm: string;
  fuel_type: string;
  alternator: string;
  transom_heights: string[];
  steering: string;
  starting: string;
  fuel_system: string;
  special_features?: string[];
}

export interface MercuryMotorsData {
  verado: MercuryMotor[];
  pro_xs: MercuryMotor[];
  fourstroke: MercuryMotor[];
}

export const mercuryMotorsData: MercuryMotorsData = {
  verado: [
    {
      model: "400 V10",
      hp: 400,
      category: "Verado",
      cylinders: "V10",
      displacement: "5.7L",
      weight_kg: 316,
      gear_ratio: "2.08:1",
      gearcase: "6.4\"",
      max_rpm: "5800-6400",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "150amp",
      transom_heights: ["L", "XL", "XXL", "XXXL"],
      steering: "Remote - Electro hydraulic",
      starting: "Electric",
      fuel_system: "Computer-controlled multi-port EFI"
    },
    {
      model: "350 V10",
      hp: 350,
      category: "Verado",
      cylinders: "V10",
      displacement: "5.7L",
      weight_kg: 316,
      gear_ratio: "2.08:1",
      gearcase: "6.4\"",
      max_rpm: "5800-6400",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "150amp",
      transom_heights: ["L", "XL", "XXL", "XXXL"],
      steering: "Remote - Electro hydraulic",
      starting: "Electric",
      fuel_system: "Computer-controlled multi-port EFI"
    },
    {
      model: "300 V8",
      hp: 300,
      category: "Verado",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 272,
      gear_ratio: "1.85:1",
      gearcase: "5.44\"",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "115amp",
      transom_heights: ["L", "XL", "XXL"],
      steering: "Remote - Electro hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "250 V8",
      hp: 250,
      category: "Verado",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 272,
      gear_ratio: "1.85:1",
      gearcase: "5.44\"",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "115amp",
      transom_heights: ["L", "XL", "XXL"],
      steering: "Remote - Electro hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    }
  ],
  pro_xs: [
    {
      model: "300 V8 Pro XS",
      hp: 300,
      category: "Pro XS",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 229,
      gear_ratio: "1.75:1",
      gearcase: "5.44\" or TM",
      max_rpm: "5600-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "250 V8 Pro XS",
      hp: 250,
      category: "Pro XS",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 229,
      gear_ratio: "1.75:1",
      gearcase: "5.44\" or TM",
      max_rpm: "5600-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "225 V8 Pro XS",
      hp: 225,
      category: "Pro XS",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 229,
      gear_ratio: "1.75:1",
      gearcase: "5.44\" or TM",
      max_rpm: "5600-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "200 V8 Pro XS",
      hp: 200,
      category: "Pro XS",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 229,
      gear_ratio: "1.75:1",
      gearcase: "5.44\" or TM",
      max_rpm: "5600-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "175 V6 Pro XS",
      hp: 175,
      category: "Pro XS",
      cylinders: "V6",
      displacement: "3.4L",
      weight_kg: 213,
      gear_ratio: "1.85:1",
      gearcase: "4.8\"",
      max_rpm: "5400-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "150 Pro XS",
      hp: 150,
      category: "Pro XS",
      cylinders: "4",
      displacement: "3.0L",
      weight_kg: 209,
      gear_ratio: "2.08:1",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "60amp",
      transom_heights: ["L", "XL"],
      steering: "Remote",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "115 Pro XS",
      hp: 115,
      category: "Pro XS",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.07:1",
      max_rpm: "5300-6300",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "115 Pro XS CT",
      hp: 115,
      category: "Pro XS",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 165,
      gear_ratio: "2.38:1",
      gearcase: "Command Thrust",
      max_rpm: "5300-6300",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    }
  ],
  fourstroke: [
    {
      model: "300 V8",
      hp: 300,
      category: "FourStroke",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 239,
      gear_ratio: "1.75:1",
      gearcase: "5.44\"",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "250 V8",
      hp: 250,
      category: "FourStroke",
      cylinders: "V8",
      displacement: "4.6L",
      weight_kg: 239,
      gear_ratio: "1.75:1",
      gearcase: "5.44\"",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL", "XXL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "225 V6",
      hp: 225,
      category: "FourStroke",
      cylinders: "V6",
      displacement: "3.4L",
      weight_kg: 215,
      gear_ratio: "1.85:1",
      gearcase: "4.8\"",
      max_rpm: "5200-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL", "XXL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "200 V6",
      hp: 200,
      category: "FourStroke",
      cylinders: "V6",
      displacement: "3.4L",
      weight_kg: 215,
      gear_ratio: "1.85:1",
      gearcase: "4.8\"",
      max_rpm: "5000-5800",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "175 V6",
      hp: 175,
      category: "FourStroke",
      cylinders: "V6",
      displacement: "3.4L",
      weight_kg: 215,
      gear_ratio: "1.85:1",
      gearcase: "4.8\"",
      max_rpm: "5000-5800",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "85amp",
      transom_heights: ["L", "XL"],
      steering: "Remote - Power or Hydraulic",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI) with ARO"
    },
    {
      model: "150",
      hp: 150,
      category: "FourStroke",
      cylinders: "4",
      displacement: "3.0L",
      weight_kg: 206,
      gear_ratio: "1.92:1",
      max_rpm: "5000-5800",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "60amp",
      transom_heights: ["L", "XL"],
      steering: "Remote",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "135",
      hp: 135,
      category: "FourStroke",
      cylinders: "4",
      displacement: "3.0L",
      weight_kg: 206,
      gear_ratio: "1.92:1",
      max_rpm: "4800-5300",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "60amp",
      transom_heights: ["L", "XL"],
      steering: "Remote",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "115",
      hp: 115,
      category: "FourStroke",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.07:1",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "115 CT",
      hp: 115,
      category: "FourStroke",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.38:1",
      gearcase: "Command Thrust",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "90",
      hp: 90,
      category: "FourStroke",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.07:1",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "90 CT",
      hp: 90,
      category: "FourStroke",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.38:1",
      gearcase: "Command Thrust",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "75",
      hp: 75,
      category: "FourStroke",
      cylinders: "4",
      displacement: "2.1L",
      weight_kg: 164,
      gear_ratio: "2.07:1",
      max_rpm: "4500-5500",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "35amp",
      transom_heights: ["L"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Multi-Port Electronic Fuel Injection (EFI)"
    },
    {
      model: "60",
      hp: 60,
      category: "FourStroke",
      cylinders: "4",
      displacement: "995cc",
      weight_kg: 114,
      gear_ratio: "1.83:1",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "60 CT",
      hp: 60,
      category: "FourStroke",
      cylinders: "4",
      displacement: "995cc",
      weight_kg: 122,
      gear_ratio: "2.33:1",
      gearcase: "Command Thrust",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L", "XL"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "50",
      hp: 50,
      category: "FourStroke",
      cylinders: "4",
      displacement: "995cc",
      weight_kg: 114,
      gear_ratio: "1.83:1",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L"],
      steering: "Remote or Tiller",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "50 CT",
      hp: 50,
      category: "FourStroke",
      cylinders: "4",
      displacement: "995cc",
      weight_kg: 122,
      gear_ratio: "2.33:1",
      gearcase: "Command Thrust",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L", "XL"],
      steering: "Tiller",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "40 CT",
      hp: 40,
      category: "FourStroke",
      cylinders: "4",
      displacement: "995cc",
      weight_kg: 121,
      gear_ratio: "2.33:1",
      gearcase: "Command Thrust",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L", "XL"],
      steering: "Tiller",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "40",
      hp: 40,
      category: "FourStroke",
      cylinders: "4",
      displacement: "747cc",
      weight_kg: 106,
      gear_ratio: "2.00:1",
      max_rpm: "5500-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "18amp",
      transom_heights: ["L"],
      steering: "Tiller or Remote",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "30 EFI",
      hp: 30,
      category: "FourStroke",
      cylinders: "3",
      displacement: "500cc",
      weight_kg: 65.7,
      gear_ratio: "2.17:1",
      max_rpm: "5800-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "17amp",
      transom_heights: ["S", "L"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "25 EFI",
      hp: 25,
      category: "FourStroke",
      cylinders: "3",
      displacement: "500cc",
      weight_kg: 60.1,
      gear_ratio: "2.17:1",
      max_rpm: "5400-5800",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "17amp",
      transom_heights: ["S", "L"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "25 EFI Pro Kicker",
      hp: 25,
      category: "FourStroke",
      cylinders: "3",
      displacement: "500cc",
      weight_kg: 66.3,
      gear_ratio: "2.17:1",
      max_rpm: "5400-5800",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "17amp",
      transom_heights: ["L", "XL"],
      steering: "Tiller or Remote",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)",
      special_features: ["Pro Kicker"]
    },
    {
      model: "20 EFI",
      hp: 20,
      category: "FourStroke",
      cylinders: "2",
      displacement: "333cc",
      weight_kg: 47.5,
      gear_ratio: "2.15:1",
      max_rpm: "5700-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "12amp",
      transom_heights: ["S", "L"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "15 EFI",
      hp: 15,
      category: "FourStroke",
      cylinders: "2",
      displacement: "333cc",
      weight_kg: 47.5,
      gear_ratio: "2.15:1",
      max_rpm: "5700-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "12amp",
      transom_heights: ["S", "L"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Electronic Fuel Injection (EFI)"
    },
    {
      model: "15 EFI Pro Kicker",
      hp: 15,
      category: "FourStroke",
      cylinders: "2",
      displacement: "333cc",
      weight_kg: 55.5,
      gear_ratio: "2.15:1",
      max_rpm: "5700-6200",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "12amp",
      transom_heights: ["L", "XL"],
      steering: "Tiller or Remote",
      starting: "Electric",
      fuel_system: "Electronic Fuel Injection (EFI)",
      special_features: ["Pro Kicker"]
    },
    {
      model: "9.9",
      hp: 9.9,
      category: "FourStroke",
      cylinders: "2",
      displacement: "209cc",
      weight_kg: 38.4,
      gear_ratio: "2.08:1",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "6amp (Electric Start)",
      transom_heights: ["S", "L"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Carbureted"
    },
    {
      model: "9.9 CT",
      hp: 9.9,
      category: "FourStroke",
      cylinders: "2",
      displacement: "209cc",
      weight_kg: 43.5,
      gear_ratio: "2.42:1",
      gearcase: "Command Thrust",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "6amp (Electric Start)",
      transom_heights: ["L", "XL"],
      steering: "Tiller or Remote",
      starting: "Manual or Electric",
      fuel_system: "Carbureted"
    },
    {
      model: "8",
      hp: 8,
      category: "FourStroke",
      cylinders: "2",
      displacement: "209cc",
      weight_kg: 38.4,
      gear_ratio: "2.08:1",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "N/A",
      transom_heights: ["S", "L"],
      steering: "Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    },
    {
      model: "6",
      hp: 6,
      category: "FourStroke",
      cylinders: "1",
      displacement: "123cc",
      weight_kg: 26.2,
      gear_ratio: "2.15:1",
      max_rpm: "4500-5500",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "N/A",
      transom_heights: ["S"],
      steering: "Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    },
    {
      model: "5",
      hp: 5,
      category: "FourStroke",
      cylinders: "1",
      displacement: "123cc",
      weight_kg: 26.2,
      gear_ratio: "2.15:1",
      max_rpm: "4500-5500",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "Optional 4amp",
      transom_heights: ["S", "L"],
      steering: "Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    },
    {
      model: "4",
      hp: 4,
      category: "FourStroke",
      cylinders: "1",
      displacement: "123cc",
      weight_kg: 26.2,
      gear_ratio: "2.15:1",
      max_rpm: "5000-6000",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "N/A",
      transom_heights: ["S"],
      steering: "Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    },
    {
      model: "3.5",
      hp: 3.5,
      category: "FourStroke",
      cylinders: "1",
      displacement: "85cc",
      weight_kg: 18.4,
      gear_ratio: "2.15:1",
      max_rpm: "4500-5500",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "N/A",
      transom_heights: ["S"],
      steering: "360° Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    },
    {
      model: "2.5",
      hp: 2.5,
      category: "FourStroke",
      cylinders: "1",
      displacement: "85cc",
      weight_kg: 18.4,
      gear_ratio: "2.15:1",
      max_rpm: "4500-5500",
      fuel_type: "Regular Unleaded (91 RON)",
      alternator: "N/A",
      transom_heights: ["S"],
      steering: "360° Tiller",
      starting: "Manual",
      fuel_system: "Carbureted"
    }
  ]
};

// Helper function to find motor specs by HP and partial model match
export function findMotorSpecs(hp: number, modelHint?: string): MercuryMotor | undefined {
  const allMotors = [
    ...mercuryMotorsData.verado,
    ...mercuryMotorsData.pro_xs,
    ...mercuryMotorsData.fourstroke
  ];
  
  return allMotors.find(motor => {
    if (motor.hp !== hp) return false;
    if (!modelHint) return true;
    
    // Check if model contains hint (case insensitive)
    const modelLower = motor.model.toLowerCase();
    const hintLower = modelHint.toLowerCase();
    
    // Check for special identifiers
    if (hintLower.includes('ct') && !modelLower.includes('ct')) return false;
    if (hintLower.includes('pro') && !modelLower.includes('pro')) return false;
    if (hintLower.includes('verado') && motor.category !== 'Verado') return false;
    
    return true;
  });
}

// Helper to get all motors by category
export function getMotorsByCategory(category: 'Verado' | 'Pro XS' | 'FourStroke'): MercuryMotor[] {
  switch(category) {
    case 'Verado':
      return mercuryMotorsData.verado;
    case 'Pro XS':
      return mercuryMotorsData.pro_xs;
    case 'FourStroke':
      return mercuryMotorsData.fourstroke;
    default:
      return [];
  }
}

// Helper to get all unique HP values for filtering
export function getAvailableHorsepowers(): number[] {
  const allMotors = [
    ...mercuryMotorsData.verado,
    ...mercuryMotorsData.pro_xs,
    ...mercuryMotorsData.fourstroke
  ];
  
  const uniqueHPs = [...new Set(allMotors.map(m => m.hp))];
  return uniqueHPs.sort((a, b) => a - b);
}

// Metadata for reference
export const mercuryMetadata = {
  lastUpdated: "2025-01-01",
  source: "Mercury Marine Official Specifications",
  notes: {
    weight: "Dry weight of base engine without oil, propeller or integral steering cylinder",
    ct: "Command Thrust models have larger gearcase and different gear ratio",
    tm: "Torque Master Gearcase option available",
    transomHeights: {
      S: "Short (15 inch)",
      L: "Long (20 inch)",
      XL: "Extra Long (25 inch)",
      XXL: "Extra Extra Long (30 inch)",
      XXXL: "Ultra Long (35 inch)"
    }
  }
};

// Function to get motor specs for chatbot integration
// Full specs available for AI assistant
export function getMotorSpecs(motorId: string | undefined, hp: number, model?: string): MercuryMotor | undefined {
  return findMotorSpecs(hp, model);
}