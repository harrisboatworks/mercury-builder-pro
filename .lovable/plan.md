

## Save Motor Cover Images (Batch 1 of 2)

### Summary
Copy the 10 uploaded cover images to the project and update each database record's `image_url` field.

### Images to Process

| Part Number | File | Target Path |
|---|---|---|
| 8M0228502 | 8M0228502.jpeg | public/images/options/8M0228502.jpeg |
| 8M0228507 | 8M0228507.jpeg | public/images/options/8M0228507.jpeg |
| 8M0228509 | 8M0228509.jpeg | public/images/options/8M0228509.jpeg |
| 8M0228530 | 8M0228530.jpeg | public/images/options/8M0228530.jpeg |
| 8M0228531 | 8M0228531.jpeg | public/images/options/8M0228531.jpeg |
| 8M0228532 | 8M0228532.jpeg | public/images/options/8M0228532.jpeg |
| 8M0228511 | 8M0228511.jpeg | public/images/options/8M0228511.jpeg |
| 8M0228533 | 8M0228533.jpeg | public/images/options/8M0228533.jpeg |
| 8M0228512 | 8M0228512.jpeg | public/images/options/8M0228512.jpeg |
| 8M0228534 | 8M0228534.jpeg | public/images/options/8M0228534.jpeg |

### Still Missing (5 covers)
- 8M0228521 - 250HP FourStroke
- 8M0228535 - 250HP Pro XS
- 8M0228517 - 300HP L6 Verado FourStroke
- 8M0228536 - 300HP Pro XS
- 8M0228522 - 300HP V8 FourStroke

You can upload these in a follow-up message.

### Steps
1. Copy all 10 images to `public/images/options/`
2. Run a single database migration to update the `image_url` field for each matching `motor_options` record by part number
3. No code changes needed

