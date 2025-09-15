// src/lib/mercury-codes.test.ts
import { parseMercuryRigCodes, buildMercuryModelKey } from './mercury-codes';

export function runMercuryCodesTests() {
  console.log('Running Mercury codes tests...');
  
  const tests = [
    {
      input: "9.9 EXLPT EFI",
      expectedTokens: ["XL", "E", "PT"],
      expectedKey: "FOURSTROKE-9.9HP-EFI-XL-E-PT"
    },
    {
      input: "25 ELHPT",
      expectedTokens: ["L", "E", "H", "PT"],
      expectedKey: "FOURSTROKE-25HP-EFI-L-E-H-PT"
    },
    {
      input: "90 ELPT CT", 
      expectedTokens: ["L", "E", "PT", "CT"],
      expectedKey: "PROXS-90HP-EFI-L-E-PT-CT"
    },
    {
      input: "MLH",
      expectedTokens: ["L", "M", "H"],
      expectedKey: "FOURSTROKE-5HP-L-M-H"
    },
    {
      input: "EXLPT-CT",
      expectedTokens: ["XL", "E", "PT", "CT"],
      expectedKey: "FOURSTROKE-150HP-EFI-XL-E-PT-CT"
    },
    {
      input: "9.9MH", // Manual start, tiller, infer S shaft
      expectedTokens: ["S", "M", "H"],
      expectedKey: "FOURSTROKE-9.9HP-S-M-H"
    },
    {
      input: "25E", // Electric start, infer S shaft, remote control
      expectedTokens: ["S", "E"],
      expectedKey: "FOURSTROKE-25HP-EFI-S-E"
    }
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      const rig = parseMercuryRigCodes(test.input);
      
      // Check tokens match
      const tokensMatch = JSON.stringify(rig.tokens) === JSON.stringify(test.expectedTokens);
      if (!tokensMatch) {
        console.error(`❌ Test "${test.input}": Expected tokens ${JSON.stringify(test.expectedTokens)}, got ${JSON.stringify(rig.tokens)}`);
        continue;
      }

      // Test key building (with mock data)
      const mockFamily = test.input.includes('90') ? 'ProXS' : 'FourStroke';
      const mockHP = test.input.includes('9.9') ? 9.9 : test.input.includes('25') ? 25 : test.input.includes('90') ? 90 : test.input.includes('150') ? 150 : 5;
      const mockEFI = test.input.includes('EFI') || mockHP >= 15; // assume EFI for larger motors
      
      const key = buildMercuryModelKey({
        family: mockFamily,
        hp: mockHP,
        hasEFI: mockEFI,
        rig
      });

      console.log(`✅ Test "${test.input}": tokens=${JSON.stringify(rig.tokens)}, key=${key}`);
      console.log(`   Shaft: ${rig.shaft_code} (${rig.shaft_inches}"), Start: ${rig.start_type}, Control: ${rig.control_type}, PT: ${rig.has_power_trim}, CT: ${rig.has_command_thrust}`);
      passed++;
      
    } catch (error) {
      console.error(`❌ Test "${test.input}" failed:`, error);
    }
  }

  console.log(`Mercury codes tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}