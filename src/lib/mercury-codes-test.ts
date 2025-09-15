// Test file for Mercury codes system
import { parseMercuryRigCodes, buildMercuryModelKey } from './mercury-codes';

export function runMercuryCodesTests(): boolean {
  console.log('🔧 Running Mercury codes tests...');
  
  const tests = [
    {
      name: "9.9 EXLPT EFI",
      input: "9.9 EXLPT EFI",
      expectedTokens: ["XL", "E", "PT"],
      expectedShaft: "XL",
      expectedStart: "Electric",
      expectedControl: "Remote",
      expectedPT: true,
      expectedCT: false,
      mockHP: 9.9,
      mockFamily: "FourStroke",
      mockEFI: true,
      expectedKey: "FOURSTROKE-9.9HP-EFI-XL-E-PT"
    },
    {
      name: "25 ELHPT",
      input: "25 ELHPT",
      expectedTokens: ["L", "E", "H", "PT"],
      expectedShaft: "L",
      expectedStart: "Electric",
      expectedControl: "Tiller",
      expectedPT: true,
      expectedCT: false,
      mockHP: 25,
      mockFamily: "FourStroke",
      mockEFI: true,
      expectedKey: "FOURSTROKE-25HP-EFI-L-E-H-PT"
    },
    {
      name: "90 ELPT CT",
      input: "90 ELPT CT",
      expectedTokens: ["L", "E", "PT", "CT"],
      expectedShaft: "L",
      expectedStart: "Electric",
      expectedControl: "Remote",
      expectedPT: true,
      expectedCT: true,
      mockHP: 90,
      mockFamily: "ProXS",
      mockEFI: true,
      expectedKey: "PROXS-90HP-EFI-L-E-PT-CT"
    },
    {
      name: "MLH",
      input: "MLH",
      expectedTokens: ["L", "M", "H"],
      expectedShaft: "L",
      expectedStart: "Manual",
      expectedControl: "Tiller",
      expectedPT: false,
      expectedCT: false,
      mockHP: 5,
      mockFamily: "FourStroke",
      mockEFI: false,
      expectedKey: "FOURSTROKE-5HP-L-M-H"
    },
    {
      name: "9.9MH (infer S shaft)",
      input: "9.9MH",
      expectedTokens: ["S", "M", "H"],
      expectedShaft: "S",
      expectedStart: "Manual",
      expectedControl: "Tiller",
      expectedPT: false,
      expectedCT: false,
      mockHP: 9.9,
      mockFamily: "FourStroke",
      mockEFI: false,
      expectedKey: "FOURSTROKE-9.9HP-S-M-H"
    },
    {
      name: "25E (infer S shaft, remote control)",
      input: "25E",
      expectedTokens: ["S", "E"],
      expectedShaft: "S",
      expectedStart: "Electric",
      expectedControl: "Remote",
      expectedPT: false,
      expectedCT: false,
      mockHP: 25,
      mockFamily: "FourStroke",
      mockEFI: true,
      expectedKey: "FOURSTROKE-25HP-EFI-S-E"
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      // Parse rigging codes
      const rig = parseMercuryRigCodes(test.input);
      
      // Check all attributes
      const checks = [
        { name: 'tokens', actual: rig.tokens, expected: test.expectedTokens },
        { name: 'shaft_code', actual: rig.shaft_code, expected: test.expectedShaft },
        { name: 'start_type', actual: rig.start_type, expected: test.expectedStart },
        { name: 'control_type', actual: rig.control_type, expected: test.expectedControl },
        { name: 'has_power_trim', actual: rig.has_power_trim, expected: test.expectedPT },
        { name: 'has_command_thrust', actual: rig.has_command_thrust, expected: test.expectedCT }
      ];
      
      let testPassed = true;
      for (const check of checks) {
        if (JSON.stringify(check.actual) !== JSON.stringify(check.expected)) {
          console.error(`❌ ${test.name} - ${check.name}: expected ${JSON.stringify(check.expected)}, got ${JSON.stringify(check.actual)}`);
          testPassed = false;
        }
      }
      
      // Test model key building
      const key = buildMercuryModelKey({
        family: test.mockFamily,
        hp: test.mockHP,
        hasEFI: test.mockEFI,
        rig
      });
      
      if (key !== test.expectedKey) {
        console.error(`❌ ${test.name} - model_key: expected "${test.expectedKey}", got "${key}"`);
        testPassed = false;
      }
      
      if (testPassed) {
        console.log(`✅ ${test.name}: tokens=${JSON.stringify(rig.tokens)}, key=${key}`);
        console.log(`   Shaft: ${rig.shaft_code} (${rig.shaft_inches}"), Start: ${rig.start_type}, Control: ${rig.control_type}, PT: ${rig.has_power_trim}, CT: ${rig.has_command_thrust}`);
        passed++;
      } else {
        failed++;
      }
      
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error);
      failed++;
    }
  }

  console.log(`🧪 Mercury codes tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}