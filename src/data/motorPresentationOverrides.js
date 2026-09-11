// Narrow public display and route corrections keyed by Mercury part number.
// The part number is the stable product identity when upstream naming drifts.
// Keep each entry backed by src/data/mercury-motors-reference.md, and preserve
// an existing canonical route when a naming correction would otherwise move it.
const MOTOR_OVERRIDES_BY_PART_NUMBER = Object.freeze({
  '1F5145TJZ': Object.freeze({
    model_display: '50 ELHPT Command Thrust FourStroke Tiller',
    model_key: 'fourstroke-50hp-50-elhpt-fourstroke',
  }),
  '1F60463GZ': Object.freeze({
    model_display: '60 EXLPT Command Thrust FourStroke',
    model_key: 'fourstroke-60hp-60-exlpt-fourstroke',
  }),
  '1F904632D': Object.freeze({
    model_display: '90 EXLPT Command Thrust FourStroke',
    model_key: 'fourstroke-90hp-90-exlpt-fourstroke',
  }),
});

export function applyMotorPresentationOverrides(motor) {
  const partNumber = String(
    motor?.model_number || motor?.mercury_model_no || '',
  )
    .trim()
    .toUpperCase();
  const overrides = MOTOR_OVERRIDES_BY_PART_NUMBER[partNumber];
  return overrides ? { ...motor, ...overrides } : motor;
}
