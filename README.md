# ZIPCODERS Smart Greenhouse
NISR 2026 Hackathon starter — Track 1: Agricultural Productivity.

## Included
- Responsive dashboard with simulated sensor values.
- ESP32 starter firmware for DHT11 and capacitive soil-moisture sensor.
- Vercel API endpoint that validates and acknowledges telemetry.

## Honest prototype status
The dashboard is in DEMO MODE and is not connected to physical sensors. The API does not store readings or update the dashboard. Do not describe this as field-tested or live IoT until hardware, storage and dashboard integration have been implemented and tested.

## Deploy
Import this repository into Vercel and deploy with default settings. To use the API, set the `DEVICE_TOKEN` environment variable to a long random secret and redeploy.

## ESP32 setup
Install Arduino IDE, ESP32 board package and Adafruit DHT library. Set Wi-Fi credentials, API URL and device token in `firmware/esp32_greenhouse.ino`. Calibrate `SOIL_DRY` and `SOIL_WET` for your sensor. Test only with low-voltage indicator loads first. ESP32 GPIO uses 3.3V logic and is not 5V tolerant. Never connect mains equipment without rated isolation, protection and qualified supervision.

## Starter wiring
- DHT11 DATA → GPIO 4
- Soil sensor analog OUT → GPIO 34
- Pump relay IN → GPIO 26
- Fan relay IN → GPIO 27

## Next steps
Build and calibrate the sensor unit; add a database such as Supabase; connect the dashboard to real readings; add secure authenticated control; test fail-safe behavior and capture genuine prototype evidence.

## NISR evidence and project methodology
- **Official national context:** NISR Agricultural Household Survey (AHS) 2024. NISR reports an estimated 2.2 million agricultural households (65.3% of all households); the survey covered 600 villages in 30 districts. These are national survey findings, not readings from this greenhouse.
- **Source:** [NISR AHS 2024 findings](https://alpha.statistics.gov.rw/data-sources/surveys/Agricultural-Household-Survey/agricultural-household-survey-2024) and [NISR microdata catalogue](https://www.microdatabk.statistics.gov.rw/catalog/123).
- **Sensor test workflow:** the field workspace accepts CSV files with timestamp, temperature, humidity, soil_moisture and light_lux columns. Imported records are validated for required columns and numeric values and can be exported as CSV.
- **Scenario tests:** normal conditions, heat stress, dry soil and low sunlight are deterministic demo scenarios. The existing control rules are example thresholds and require crop-specific agronomic validation before real deployment.
- **Current limitations:** the web app still uses simulated sensor data by default. CSV import is local to the browser session; it is not a permanent database. No physical ESP32 telemetry or relay control is active. Do not report water savings, yield increases or field performance as measured results.
- **AI disclosure:** AI assistance was used during development. The team must review, understand, test and disclose AI-assisted work in accordance with the NISR competition rules.

## Dashboard presentation update
- Successful demo sign-in now opens the command centre directly; the rejected animated interstitial has been removed.
- Crop manager includes ten selectable crop profiles: tomato, lettuce, sweet pepper, cucumber, spinach, kale, cabbage, eggplant, strawberry and green bean. Water and temperature figures are illustrative guidance only and should be checked against local agronomy advice.
- The statistical dashboard calculates recent means from up to the latest 24 browser-simulation readings and displays sample count, environmental readings and virtual actuator status. It is demonstration analytics, not measured production or impact data.
- The 3D greenhouse viewport is taller and the camera is framed closer to make the facility easier to inspect. Rendering pixel ratio is capped to reduce GPU load on modest computers.
- Research references used for design direction: [Three.js responsive rendering guidance](https://threejs.org/manual/pages/responsive.html), [Three.js object optimization](https://threejs.org/manual/pages/optimize-lots-of-objects.html), [FAO horticulture crop management factsheets](https://www.fao.org/plant-production-protection/resources/publications/technical-factsheets-series-on-horticulture-crops-management/en), and [FAO agricultural water productivity dashboard](https://www.fao.org/in-action/remote-sensing-for-water-productivity/applications-and-uses/applications-catalogue/product-detail/wapor4awp-a-dashboard-for-estimating-agricultural-water-productivity-to-support-monitoring-sdg-indicator-6-4-1-using-wapor-datab/en).

## Verification note
These changes were committed to the default branch. Source-level checks confirmed that the intro markup and JavaScript flow are absent, ten crop options are present, and the new statistics elements and update function exist. A live browser test, performance measurement and Vercel deployment check have not been performed in this session.
