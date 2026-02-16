

## Add Oil Change Kit Image for 40-60 HP Motor Options

### Current State
The Oil Change Kit (part number 8M0081916) already exists in the database:
- **`motor_options` table**: Record exists with name "Oil Change Kit (40-60HP)", base price $90, category "maintenance"
- **`motor_option_rules` table**: A rule already maps this option to motors with HP between 40-60, with assignment type "available"
- **Image**: Currently points to an external URL (`crowleymarine.com`) which may be unreliable or blocked

The rule-based system in `useMotorOptions.ts` should already be showing this kit on the Options page for any 40-60 HP motor. No code changes are needed for the option to appear.

### What Will Change

1. **Copy the uploaded product image** into the project at `public/images/options/8M0081916_Oil_Change_Kit.jpg`
2. **Update the database record** in `motor_options` to use the local image path (`/images/options/8M0081916_Oil_Change_Kit.jpg`) instead of the external Crowley Marine URL
3. **Verify** the option renders correctly on the Options page when a 40-60 HP motor is selected

### Why
- The external image URL may be unreliable, slow, or blocked by CORS
- Using a local image ensures the product photo always loads
- No code changes needed since the rule-based option assignment is already configured correctly

### Scope
- 1 image file copied
- 1 database record updated (image_url field)
- 0 code files changed
