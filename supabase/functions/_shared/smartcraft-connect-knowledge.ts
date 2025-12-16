// SmartCraft Connect FAQ Knowledge Base
// Source: Mercury Marine SmartCraft Connect FAQ Documentation

export const SMARTCRAFT_CONNECT_FAQ = {
  overview: {
    description: "SmartCraft Connect is a family of compact devices that wirelessly stream engine data to the Mercury Marine app and compatible chartplotters",
    device_types: {
      mobile: {
        name: "SmartCraft Connect Mobile",
        connectivity: "Bluetooth only",
        function: "Streams data to Mercury Marine app on smartphone/tablet",
        partNumber: "8M0173128 (under cowl, single engine)"
      },
      standard: {
        name: "SmartCraft Connect",
        connectivity: "Bluetooth + NMEA 2000",
        function: "Integrates with MFDs/chartplotters AND Mercury Marine app",
        partNumber: "8M0173129 (under helm, 1-4 engines)"
      }
    },
    engine_support: "1-4 engines supported. NO kicker support. NO 5/6 engine installations.",
    rebranding_note: "Formerly called 'VesselView Mobile' - same product, new name"
  },

  compatibility: {
    engines: {
      supported: [
        { range: "40hp+", requirement: "Mercury/MerCruiser 40hp and higher, model year 2004 and newer" },
        { range: "25hp+", requirement: "Mercury/MerCruiser 25hp and higher, model year 2022 and newer" },
        { range: "Avator", requirement: "Avator electric outboards - pre-installed on 20e and higher models" }
      ],
      not_supported: [
        "Kicker motor applications",
        "5 or 6 engine installations",
        "Outboards under 25hp",
        "25-30hp motors older than 2022 model year",
        "Non-SmartCraft capable engines"
      ]
    },
    displays: {
      compatible: [
        { brand: "Simrad", models: "NEON-based displays: NSX, NSS 4 (evo3/evo3S)" },
        { brand: "Garmin", models: "GPSMAP series, TD 50, NMEA 2000 ECHOMAP (Ultra/UHD)" },
        { brand: "Raymarine", models: "LightHouse displays (version 4.1+)" },
        { brand: "Mercury", models: "VesselView 704" }
      ],
      incompatible: [
        { device: "VesselView Link", reason: "CONFLICTS on same NMEA/SmartCraft network - cannot use together" },
        { device: "VesselView 403", reason: "Not compatible, may cause communication errors" },
        { device: "VesselView 502", reason: "Not compatible, may cause communication errors" },
        { device: "VesselView 703", reason: "Not compatible, may cause communication errors" },
        { device: "VesselView 903", reason: "Not compatible, may cause communication errors" }
      ]
    }
  },

  installation: {
    under_cowl: {
      partNumber: "8M0173128",
      location: "Installed directly on the engine",
      features: "Built-in resistor",
      limitation: "Single engine only",
      best_for: "Single engine boats, cleaner install"
    },
    under_helm: {
      partNumber: "8M0173129",
      location: "Connected at helm via 10-pin junction box",
      features: "Multi-engine capable",
      limitation: "Requires junction box connection",
      best_for: "Multi-engine setups, chartplotter integration"
    },
    general_notes: [
      "Plug-and-play - connects to 10-pin SmartCraft diagnostic port",
      "DIY-friendly for handy customers",
      "Harris can install as part of rigging/installation package"
    ]
  },

  apps: {
    mercury_marine: {
      name: "Mercury Marine App",
      status: "RECOMMENDED - Latest app, receives all new features",
      compatibility: "Works with SmartCraft Connect AND legacy VesselView Mobile hardware",
      features: [
        "Real-time engine data (RPM, speed, fuel consumption)",
        "Customizable digital gauges",
        "GPS range rings (fuel range estimation)",
        "Service reminders based on engine hours",
        "Maintenance history log",
        "Fault code notifications",
        "Access to owner's manuals and how-to videos",
        "Dealer connection for service scheduling"
      ],
      platforms: "iOS and Android - FREE download"
    },
    smartcraft_manager: {
      name: "SmartCraft Manager App",
      status: "SETUP/CALIBRATION ONLY",
      purpose: "Required for initial setup and calibration when integrating with MFDs",
      compatibility: "Works with SmartCraft Connect (not Mobile)",
      use_case: "Use this when setting up chartplotter integration, then switch to Mercury Marine app for daily use"
    },
    vesselview_mobile: {
      name: "VesselView Mobile App",
      status: "LEGACY - No longer updated",
      compatibility: "NOT compatible with SmartCraft Connect hardware",
      note: "Only works with older VesselView Mobile hardware (pre-rebranding)"
    }
  },

  troubleshooting: {
    trim_not_showing: {
      issue: "Trim gauge not displaying in Mercury Marine app",
      affected_engines: "Mercury 40-115hp FourStroke",
      cause: "These engines lack digital trim senders from factory",
      solution: "Install Mercury trim sender conversion kit, then configure via SmartCraft Manager app",
      note: "Pro XS, Verado, and SeaPro models typically have digital trim senders included"
    },
    vesselview_link_conflict: {
      issue: "Communication errors, erratic data, or device not connecting",
      cause: "SmartCraft Connect and VesselView Link installed on same boat",
      solution: "Remove one device - they CANNOT coexist on the same NMEA/SmartCraft network",
      note: "Choose SmartCraft Connect for app connectivity, or VesselView Link for legacy display integration"
    },
    app_not_connecting: {
      issue: "Mercury Marine app won't find/connect to SmartCraft Connect",
      steps: [
        "Ensure engine is running (device needs power)",
        "Check Bluetooth is enabled on phone/tablet",
        "Verify SmartCraft Connect LED is blinking (indicates active)",
        "Try closing and reopening the app",
        "If still failing, power cycle the engine"
      ]
    },
    mfd_not_showing_data: {
      issue: "Chartplotter not displaying engine data",
      steps: [
        "Verify using SmartCraft Connect (not Mobile) - NMEA version required for MFDs",
        "Check NMEA 2000 network connections",
        "Ensure chartplotter firmware is up to date",
        "Use SmartCraft Manager app to verify device configuration",
        "Check for VesselView Link conflict (remove if present)"
      ]
    }
  },

  key_facts: {
    name_change: "VesselView Mobile was rebranded to SmartCraft Connect - same product, new name",
    app_recommendation: "Always recommend Mercury Marine app - it's current, free, and works with all hardware",
    conflict_warning: "SmartCraft Connect and VesselView Link CANNOT be used together",
    engine_check: "Always verify engine HP and model year for compatibility",
    trim_sender_issue: "40-115hp FourStrokes need conversion kit for trim display"
  }
};

// Helper function to check engine compatibility
export function getSmartCraftEngineCompatibility(hp: number, year?: number): { compatible: boolean; message: string } {
  if (hp >= 40) {
    if (!year || year >= 2004) {
      return { compatible: true, message: `Yes! Your ${hp}HP motor is compatible with SmartCraft Connect (40hp+ from 2004 and newer).` };
    } else {
      return { compatible: false, message: `Your ${hp}HP from ${year} is unfortunately too old - SmartCraft Connect requires 2004 or newer for 40hp+ motors.` };
    }
  } else if (hp >= 25) {
    if (!year || year >= 2022) {
      return { compatible: true, message: `Yes! Your ${hp}HP motor is compatible with SmartCraft Connect (25hp+ from 2022 and newer).` };
    } else {
      return { compatible: false, message: `Your ${hp}HP from ${year || 'pre-2022'} isn't compatible - SmartCraft Connect requires 2022 or newer for 25-30hp motors.` };
    }
  } else {
    return { compatible: false, message: `Unfortunately motors under 25hp don't support SmartCraft Connect. The smallest compatible motors are 25hp from 2022+.` };
  }
}

// Helper function to check display compatibility
export function getSmartCraftDisplayCompatibility(displayBrand: string): { compatible: boolean; message: string } {
  const brand = displayBrand.toLowerCase();
  
  if (brand.includes('simrad') || brand.includes('nsx') || brand.includes('nss')) {
    return { compatible: true, message: "Simrad displays (NSX, NSS evo3/evo3S with NEON) work great with SmartCraft Connect!" };
  }
  if (brand.includes('garmin') || brand.includes('gpsmap') || brand.includes('echomap')) {
    return { compatible: true, message: "Garmin displays (GPSMAP, TD 50, ECHOMAP Ultra/UHD) work perfectly with SmartCraft Connect!" };
  }
  if (brand.includes('raymarine') || brand.includes('lighthouse')) {
    return { compatible: true, message: "Raymarine LightHouse displays (v4.1+) are compatible with SmartCraft Connect!" };
  }
  if (brand.includes('vesselview 704')) {
    return { compatible: true, message: "VesselView 704 works with SmartCraft Connect!" };
  }
  if (brand.includes('vesselview link')) {
    return { compatible: false, message: "⚠️ VesselView Link conflicts with SmartCraft Connect - they can't be used together on the same boat." };
  }
  if (brand.includes('vesselview 403') || brand.includes('vesselview 502') || brand.includes('vesselview 703') || brand.includes('vesselview 903')) {
    return { compatible: false, message: "VesselView 403/502/703/903 aren't compatible with SmartCraft Connect and may cause communication errors." };
  }
  
  return { compatible: false, message: "I'm not sure about that display - contact us and we can check compatibility for you!" };
}

// Helper function for troubleshooting
export function getSmartCraftTroubleshootingTip(issue: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('trim') && (lowerIssue.includes('not showing') || lowerIssue.includes('missing') || lowerIssue.includes('blank'))) {
    return "Trim not showing? Mercury 40-115hp FourStrokes need a digital trim sender conversion kit - they don't have digital senders from the factory. Once installed, configure it via the SmartCraft Manager app.";
  }
  
  if (lowerIssue.includes('vesselview link') || lowerIssue.includes('conflict') || lowerIssue.includes('both installed')) {
    return "⚠️ SmartCraft Connect and VesselView Link can't be used together - they conflict on the same NMEA/SmartCraft network. You'll need to remove one. SmartCraft Connect is the newer option with app connectivity.";
  }
  
  if (lowerIssue.includes('won\'t connect') || lowerIssue.includes('not connecting') || lowerIssue.includes('can\'t find')) {
    return "Try these steps: 1) Make sure the engine is running (SmartCraft Connect needs power), 2) Check Bluetooth is on, 3) Look for a blinking LED on the device, 4) Close and reopen the app, 5) Power cycle the engine if still not working.";
  }
  
  if (lowerIssue.includes('chartplotter') || lowerIssue.includes('mfd') || lowerIssue.includes('display not showing')) {
    return "For chartplotter issues: Make sure you have SmartCraft Connect (not Mobile) - only the NMEA version works with MFDs. Check your NMEA 2000 connections, update your chartplotter firmware, and verify there's no VesselView Link causing conflicts.";
  }
  
  return "Not sure about that specific issue - give us a call at (905) 342-2153 and we can help troubleshoot!";
}
