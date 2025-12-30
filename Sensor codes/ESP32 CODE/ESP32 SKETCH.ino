#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include <Wire.h>
#include "MPU6050.h"
#include <TinyGPSPlus.h>

// ---- DHT11 ----
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---- MG811 (CO2) ----
#define MG_PIN 35          // ADC pin for MG sensor

// ---- MQ135 (Air quality) ----
#define MQ135_PIN 34       // A0 of MQ135 module -> GPIO34

// ---- MPU6050 ----
MPU6050 mpu;

// ---- GPS ----
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
const int GPS_RX = 16;     // ESP32 RX (to GPS TX)
const int GPS_TX = 17;     // ESP32 TX (to GPS RX)

// ---- WiFi + backend ----
const char* ssid      = "At07";
const char* password  = "newDay23";
const char* serverUrl = "http://172.31.111.86:5000/api/sensor-data";

unsigned long lastSend = 0;
const unsigned long sendInterval = 5000;

// ---- Helpers ----
float mgRawToPPM(int raw) {
  // Example: map 0–4095 ADC to 0–5000 ppm
  return (raw / 4095.0f) * 5000.0f;
}

void setup() {
  Serial.begin(115200);

  // DHT
  dht.begin();

  // MPU6050
  Wire.begin(21, 22);   // SDA, SCL
  mpu.initialize();

  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  // ADC resolution (for MG811 + MQ135)
  analogReadResolution(12); // 0–4095
}

void loop() {
  // Feed GPS parser continuously
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (millis() - lastSend >= sendInterval) {
    lastSend = millis();

    // ----- Read DHT11 -----
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("DHT11 read failed, using fallback values");
      temperature = 25.0;
      humidity    = 50.0;
    }

    // ----- Read MPU6050 -----
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    // ----- Read GPS -----
    double lat   = gps.location.isValid() ? gps.location.lat()  : 0.0;
    double lng   = gps.location.isValid() ? gps.location.lng()  : 0.0;
    double speed = gps.speed.isValid()    ? gps.speed.kmph()    : 0.0;

    // ----- Read MG811 (CO2) -----
    int   mgRaw   = analogRead(MG_PIN);
    float co2PPM  = mgRawToPPM(mgRaw);

    // ----- Read MQ135 (Air quality) -----
    int   mq135Raw  = analogRead(MQ135_PIN);
    float mq135Volt = mq135Raw * (3.3 / 4095.0);

    // ----- Pretty debug log -----
    Serial.println("====== AtmosTrack Multi‑Sensor ======");
    Serial.print("DHT11  -> T="); Serial.print(temperature);
    Serial.print(" °C  H=");      Serial.print(humidity);
    Serial.println(" %");

    Serial.print("MG811  -> raw="); Serial.print(mgRaw);
    Serial.print("  CO2≈");        Serial.print(co2PPM);
    Serial.println(" ppm");

    Serial.print("MQ135  -> raw="); Serial.print(mq135Raw);
    Serial.print("  V=");          Serial.println(mq135Volt, 3);

    Serial.print("MPU6050-> ax="); Serial.print(ax);
    Serial.print(" ay=");          Serial.print(ay);
    Serial.print(" az=");          Serial.print(az);
    Serial.print("  gx=");         Serial.print(gx);
    Serial.print(" gy=");          Serial.print(gy);
    Serial.print(" gz=");          Serial.println(gz);

    Serial.print("GPS    -> lat="); Serial.print(lat, 6);
    Serial.print("  lng=");        Serial.print(lng, 6);
    Serial.print("  speed=");      Serial.print(speed);
    Serial.println(" km/h");
    Serial.println("=====================================");

    // ----- Build JSON -----
    StaticJsonDocument<768> doc;
    doc["deviceId"] = "ATMOSTRACK-01";

    JsonObject env = doc.createNestedObject("environment");
    env["temperature"] = temperature;
    env["humidity"]    = humidity;

    JsonObject imu = doc.createNestedObject("imu");
    imu["ax"] = ax;
    imu["ay"] = ay;
    imu["az"] = az;
    imu["gx"] = gx;
    imu["gy"] = gy;
    imu["gz"] = gz;

    JsonObject loc = doc.createNestedObject("location");
    loc["lat"]   = lat;
    loc["lng"]   = lng;
    loc["speed"] = speed;

    JsonObject pur = doc.createNestedObject("purification");
    pur["on"] = false;

    // MG811 CO2 as before
    doc["co2Level"] = co2PPM;

    // MQ135 nested object
    JsonObject mq = doc.createNestedObject("mq135");
    mq["raw"]  = mq135Raw;
    mq["volt"] = mq135Volt;

    String payload;
    serializeJson(doc, payload);
    // Serial.println(payload); // uncomment to inspect JSON

    // ----- Send to backend -----
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      int code = http.POST(payload);
      Serial.print("HTTP POST status: ");
      Serial.println(code);
      http.end();
    } else {
      Serial.println("WiFi disconnected, cannot send");
    }
  }
}
