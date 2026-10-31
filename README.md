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