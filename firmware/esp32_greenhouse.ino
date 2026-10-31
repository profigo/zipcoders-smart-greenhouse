/* ESP32 starter: DHT11 + capacitive soil sensor + low-voltage relay tests.
   Calibrate soil values. Never connect mains loads without rated isolation,
   protection, enclosure and qualified supervision. */
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT11
#define SOIL_PIN 34
#define PUMP_RELAY_PIN 26
#define FAN_RELAY_PIN 27
const char* WIFI_SSID="YOUR_WIFI_NAME";
const char* WIFI_PASSWORD="YOUR_WIFI_PASSWORD";
const char* API_URL="https://YOUR-VERCEL-DOMAIN.vercel.app/api/telemetry";
const char* DEVICE_TOKEN="CHANGE_THIS_TOKEN";
DHT dht(DHTPIN,DHTTYPE);
const int SOIL_DRY=3000,SOIL_WET=1300,SOIL_WATER_THRESHOLD=30;
const float TEMP_FAN_THRESHOLD=32.0;
void setup(){Serial.begin(115200);pinMode(PUMP_RELAY_PIN,OUTPUT);pinMode(FAN_RELAY_PIN,OUTPUT);digitalWrite(PUMP_RELAY_PIN,HIGH);digitalWrite(FAN_RELAY_PIN,HIGH);dht.begin();WiFi.begin(WIFI_SSID,WIFI_PASSWORD);while(WiFi.status()!=WL_CONNECTED){delay(500);Serial.print(".");}Serial.println(" Wi-Fi connected");}
void loop(){float h=dht.readHumidity(),t=dht.readTemperature();int raw=analogRead(SOIL_PIN);int soil=constrain(map(raw,SOIL_DRY,SOIL_WET,0,100),0,100);if(isnan(h)||isnan(t)){digitalWrite(PUMP_RELAY_PIN,HIGH);digitalWrite(FAN_RELAY_PIN,HIGH);delay(3000);return;}bool pump=soil<SOIL_WATER_THRESHOLD,fan=t>TEMP_FAN_THRESHOLD;digitalWrite(PUMP_RELAY_PIN,pump?LOW:HIGH);digitalWrite(FAN_RELAY_PIN,fan?LOW:HIGH);sendTelemetry(t,h,soil,raw,pump,fan);delay(15000);}
void sendTelemetry(float t,float h,int soil,int raw,bool pump,bool fan){if(WiFi.status()!=WL_CONNECTED)return;HTTPClient http;http.begin(API_URL);http.addHeader("Content-Type","application/json");http.addHeader("x-device-token",DEVICE_TOKEN);String body="{\"temperature\":"+String(t,1)+",\"humidity\":"+String(h,1)+",\"soilMoisture\":"+String(soil)+",\"soilRaw\":"+String(raw)+",\"pumpOn\":"+String(pump?"true":"false")+",\"fanOn\":"+String(fan?"true":"false")+"}";int code=http.POST(body);Serial.printf("Telemetry HTTP status: %d\\n",code);http.end();}