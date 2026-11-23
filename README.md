# Plateful: photo-based food journal prototype

**SEG 4505: Software Project Management, Fall 2026. Group 10**
Melanie Malek · Henry Saber · Michael Haddad · Mathew Aoun

Prototype for the Digital Health Inc. RFB (personal food journal application). You take one photo of a meal, and the app detects every visible ingredient, auto-calibrates the real-world scale without a reference object, then estimates volume, weight, calories and macros for each ingredient.

![Scan screen](docs/screenshot-scan.png)

## Run it

No build step and no dependencies.

```bash
# Option 1: open the file directly
open index.html            # or double-click it

# Option 2: local web server (recommended)
npm start                  # serves on http://localhost:8080
# or: python3 -m http.server 8080
```

Run the unit tests (Node 18+):

```bash
npm test
```

**Live demo (with live AI detection):** see the hosted Claude artifact link shared by the team. Opened from this repository, the three sample meals and every other feature work fully offline. Live photo analysis needs the hosted version, because it calls a vision model through the Claude artifact runtime.

## What the demo shows

| Charter | Requirement | Where to see it |
|---|---|---|
| FR1 | Detect every visible ingredient | Salad sample: lettuce, cherry tomato, carrot and cucumber are detected separately |
| FR2 | Auto-calibration, no reference object | Photo width in cm shown for each scan |
| FR3 | Area → volume → weight → kcal, summed | Formula line under each ingredient |
| FR4 | Uniform distribution below the surface | Bean soup sample: the beans' share of the surface is applied to the full depth |
| FR5 | Incremental training | Corrections go into a training queue (Today tab), only with user consent |
| FR6 | History and correction | Tap an ingredient to rename it, fix its weight or remove it; the Today tab keeps the log |
| O1, O2 / R1 | Accuracy targets | Confidence for each ingredient; below 75 % it is flagged for the user to check |
| O3 | Analysis ≤ 5 s | Measured time shown on every live scan |
| O5 | ≤ 3 interactions | Photo → Add to today = 2 taps |
| O6 | Android and iOS | Mobile-first UI; the file input opens the camera on phones |
| H13 | Offline | Photo is queued offline and analysed on reconnect |
| H14 | French and English | FR/EN toggle |
| H15 | API to expenditure products | JSON payload on the Today tab |
| Scope | Nutritional value | Protein, carbs and fat for each ingredient and meal |
| NFR | Consent for training data | Checkbox on the Today tab |

## How the calculation works

`js/calc.js` (pure functions, unit-tested):

```
photo area (cm²)    = calibrated width × (width / aspect ratio)
ingredient area     = box width × box height × coverage × photo area
volume (cm³)        = area × depth      (surface assumed to continue uniformly to the bottom)
weight (g)          = volume × density  (density table)
kcal, P, C, F       = weight / 100 × values per 100 g (nutrition table)
meal total          = sum over ingredients
```

If the user corrects a weight, the correction replaces the estimate. If a food isn't in the reference table, the model's own density and nutrition estimates are used, and the item is tagged "AI est.".

## Project structure

```
index.html          page markup (phone app + "how it works" panel)
css/styles.css      styles, light and dark mode
js/data.js          UI strings (EN/FR), food reference table, sample meals
js/calc.js          measurement pipeline (area → volume → weight → kcal)
js/app.js           UI, live AI detection, journal, consent, API payload, offline queue
tests/calc.test.js  unit tests for the pipeline (node:test, no dependencies)
docs/               screenshots
```

## Prototype vs production

| Part | Prototype | Production (project plan) |
|---|---|---|
| Detection | General vision AI model returning bounding boxes | Ingredient segmentation model trained on public food datasets, on Amazon SageMaker |
| Calibration | Scene-based estimate | Distance-estimation method [3] using camera data |
| Area | Box × coverage fraction | Pixel-exact segmentation masks |
| Food tables | ~45 typical reference values | Canadian Nutrient File (H4) + density database |
| Storage | Browser localStorage | DynamoDB + S3, encrypted at rest and in transit |
| Processing | In the page | API Gateway → S3 → SQS → SageMaker → Lambda, auto-scaling on the client's existing AWS |
| Mobile | Responsive web app | Flutter app for Android and iOS |

## Known limitations

- Salt, oil, butter and seasoning can't be seen in a photo, so they aren't counted (accepted in the RFB).
- The sample meals are illustrations with pre-computed detections. They demonstrate the pipeline, not detection accuracy.
- Reference values are typical figures for the prototype, not the Canadian Nutrient File.
- The expenditure figure on the Today tab is sample data.
