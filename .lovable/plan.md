
# Fix Voice Chat HP Detection for All Motors

## Problem

When users ask about motors using spoken words like "nine point nine HP" or "two hundred HP", the voice chat says "let me check" and then times out. The current spoken pattern dictionary only covers a small subset of HP values.

## Current State Analysis

**Database HP values**: 2.5, 3.5, 4, 5, 6, 8, 9.9, 15, 20, 25, 30, 40, 50, 60, 75, 90, 115, 150, 175, 200, 225, 250, 300

**Current spoken patterns** (lines 1412-1422):
- Only covers: 20, 25, 30, 40, 50, 60, 75, 100, 115, 150, and "twenny"
- Missing: 2.5, 3.5, 4, 5, 6, 8, 9.9, 15, 90, 175, 200, 225, 250, 300

**Numeric pattern** (line 1409): Has 9.9 and decimals, but only works when speech-to-text outputs "9.9" not "nine point nine"

## Root Cause

Speech recognition often transcribes numbers as words:
- "9.9" becomes "nine point nine" 
- "200" becomes "two hundred"
- "250" becomes "two fifty" or "two hundred fifty"

The spoken patterns dictionary is incomplete, so these word-based transcriptions don't match.

## Solution

Expand `spokenHpPatterns` to cover all 23 HP values with common speech variations.

## File to Modify

`src/hooks/useElevenLabsVoice.ts` - lines 1412-1422

## Code Change

Replace the limited pattern dictionary with a comprehensive one:

```typescript
// Expanded spoken HP patterns for voice recognition
const spokenHpPatterns: Record<string, number> = {
  // === DECIMAL HP VALUES (small motors) ===
  'two point five': 2.5, 'two and a half': 2.5, 'two-point-five': 2.5,
  'three point five': 3.5, 'three and a half': 3.5, 'three-point-five': 3.5,
  'nine point nine': 9.9, 'nine-point-nine': 9.9, 'nine nine': 9.9,
  
  // === SMALL HP (single digits) ===
  'four hp': 4, 'four horsepower': 4,
  'five hp': 5, 'five horsepower': 5,
  'six hp': 6, 'six horsepower': 6,
  'eight hp': 8, 'eight horsepower': 8,
  
  // === TEENS ===
  'fifteen hp': 15, 'fifteen horsepower': 15, 'fifteen': 15,
  
  // === TWENTIES/THIRTIES ===
  'twenty hp': 20, 'twenty horsepower': 20, '20 hp': 20, '20hp': 20,
  'twenny': 20, 'twenny hp': 20, // Common mispronunciation
  'twenty-five hp': 25, 'twenty five hp': 25, 'twenty-five': 25, 'twenty five': 25,
  'thirty hp': 30, 'thirty horsepower': 30, 'thirty': 30,
  
  // === FORTIES THROUGH NINETIES ===
  'forty hp': 40, 'forty horsepower': 40, 'forty': 40,
  'fifty hp': 50, 'fifty horsepower': 50, 'fifty': 50,
  'sixty hp': 60, 'sixty horsepower': 60, 'sixty': 60,
  'seventy-five hp': 75, 'seventy five hp': 75, 'seventy five': 75, 'seventy-five': 75,
  'ninety hp': 90, 'ninety horsepower': 90, 'ninety': 90,
  
  // === HUNDREDS ===
  'hundred hp': 100, 'one hundred': 100, 'one hundred hp': 100,
  'one-fifteen': 115, 'one fifteen': 115, 'one-fifteen hp': 115, 'one fifteen hp': 115,
  'one-fifty': 150, 'one fifty': 150, 'one-fifty hp': 150, 'one fifty hp': 150,
  'one-seventy-five': 175, 'one seventy five': 175, 'one seventy-five': 175,
  'one seventy five hp': 175, 'one-seventy-five hp': 175,
  
  // === TWO HUNDREDS ===
  'two hundred': 200, 'two hundred hp': 200, 'two hundred horsepower': 200,
  'two-twenty-five': 225, 'two twenty five': 225, 'two twenty-five': 225,
  'two twenty five hp': 225, 'two-twenty-five hp': 225,
  'two-fifty': 250, 'two fifty': 250, 'two-fifty hp': 250, 'two fifty hp': 250,
  'two hundred fifty': 250, 'two hundred and fifty': 250,
  
  // === THREE HUNDREDS ===
  'three hundred': 300, 'three hundred hp': 300, 'three hundred horsepower': 300,
};
```

## Why This Works

1. **Covers all decimal HP**: "nine point nine", "two point five", "three point five"
2. **Covers all whole HP**: From 4 HP to 300 HP with common spoken variations
3. **Handles hyphenation**: Both "one-fifteen" and "one fifteen"
4. **Common mispronunciations**: "twenny" for "twenty"
5. **Phrase variations**: "two fifty" vs "two hundred fifty" vs "250"

## Testing

After this fix, these voice queries should all work:
- "Do you have any 9.9 HP motors?" (numeric or "nine point nine")
- "Show me two hundred HP motors" 
- "What do you have in a one-seventy-five?"
- "I need a two fifty"
- "Looking for something around ninety horsepower"
