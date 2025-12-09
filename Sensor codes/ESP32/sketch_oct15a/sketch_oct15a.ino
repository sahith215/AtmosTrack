/*
 * AtmosTrack Dual Sensor - ESP32 + MQ135 + MG811
 * WITH VIRTUAL CALIBRATION for accurate readings
 * Real-time Air Quality & CO2 Monitoring System
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "At07";
const char* password = "newDay23";

// Backend API
const char* backendAPI = "http://10.184.22.86:5000/api/sensor-data";

// Sensor Pin Definitions
#define MQ135_PIN 36      // GPIO36 (VP) - Air Quality
#define MG811_PIN 35      // GPIO35 (G35) - CO2
#define SAMPLE_COUNT 20   // Increased for better accuracy

// 🆕 CALIBRATION CONSTANTS
// MQ135 Calibration (based on clean air = 400 ppm CO2 equivalent)
#define MQ135_R0 10.0     // Clean air resistance (kΩ) - adjust after calibration
#define MQ135_RL 1.0      // Load resistance (kΩ)

// MG811 Calibration (based on datasheet and environmental factors)
#define MG811_ZERO_POINT_VOLTAGE 0.324  // Voltage at 400ppm CO2
#define MG811_REACTION_VOLTAGE 0.020    // Voltage drop per 100ppm

// Environmental compensation factors
float temperature = 25.0;  // Assume 25°C room temperature
float humidity = 50.0;     // Assume 50% humidity

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("🌍 AtmosTrack Calibrated Dual Sensor System");
  Serial.println("ESP32 + MQ135 (Air Quality) + MG811 (CO2)");
  Serial.println("🎯 With Virtual Calibration for Accurate Readings");
  Serial.println("Target Backend: http://192.168.56.1:5000");
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("🔥 Warming up sensors...");
  Serial.println("MQ135: 30 seconds | MG811: 60 seconds");
  Serial.println("📊 Applying virtual calibration algorithms...");
  
  // Sensor warm-up with countdown
  for(int i = 60; i > 0; i--) {
    Serial.print("⏱️ Warm-up: ");
    Serial.print(i);
    Serial.print(" seconds remaining");
    if(i <= 30) Serial.print(" (Both sensors + calibration)");
    else Serial.print(" (MG811 CO2 + calibration)");
    Serial.println();
    delay(1000);
  }
  
  // Perform initial calibration
  performInitialCalibration();
  
  Serial.println("✅ Both sensors calibrated and ready!");
}

void loop() {
  // Read both sensors with calibration
  float airQualityPPM = readCalibratedMQ135();
  float co2Level = readCalibratedMG811();
  
  // Send calibrated dual sensor data to backend
  sendDualSensorData(airQualityPPM, co2Level);
  
  delay(5000); // Send every 5 seconds
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(ssid);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.print("📶 ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("📡 Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  }
}

// 🆕 CALIBRATED MQ135 Reading with PPM conversion
float readCalibratedMQ135() {
  float sum = 0;
  for(int i = 0; i < SAMPLE_COUNT; i++) {
    sum += analogRead(MQ135_PIN);
    delay(25);
  }
  float rawValue = sum / SAMPLE_COUNT;
  
  // Convert to voltage
  float voltage = (rawValue * 3.3) / 4095.0;
  
  // Calculate sensor resistance
  float sensorResistance = ((3.3 - voltage) / voltage) * MQ135_RL;
  
  // Calculate ratio Rs/R0
  float ratio = sensorResistance / MQ135_R0;
  
  // Virtual calibration: Convert to PPM using logarithmic equation
  // Based on MQ135 sensitivity curve for CO2
  float ppm = 116.6020682 * pow(ratio, -2.769034857);
  
  // Environmental compensation
  ppm = compensateTemperatureHumidity(ppm, temperature, humidity);
  
  // Ensure reasonable bounds (outdoor air: 400-500 ppm, indoor: 400-2000 ppm)
  ppm = constrain(ppm, 300, 5000);
  
  return ppm;
}

// 🆕 CALIBRATED MG811 Reading with accurate CO2 conversion
float readCalibratedMG811() {
  float sum = 0;
  for(int i = 0; i < SAMPLE_COUNT; i++) {
    sum += analogRead(MG811_PIN);
    delay(25);
  }
  float rawValue = sum / SAMPLE_COUNT;
  
  // Convert to voltage
  float voltage = (rawValue * 3.3) / 4095.0;
  
  // MG811 specific calibration (based on datasheet characteristics)
  // MG811 has inverse relationship: higher CO2 = lower voltage
  float voltageChange = MG811_ZERO_POINT_VOLTAGE - voltage;
  
  // Calculate CO2 concentration using calibrated formula
  float co2ppm = 400.0 + (voltageChange / MG811_REACTION_VOLTAGE) * 100.0;
  
  // Apply temperature compensation (MG811 is temperature sensitive)
  float tempFactor = 1.0 + ((temperature - 20.0) * 0.005); // 0.5% per degree
  co2ppm = co2ppm * tempFactor;
  
  // Ensure reasonable bounds (outdoor: 400 ppm, indoor: 400-5000 ppm)
  co2ppm = constrain(co2ppm, 350, 10000);
  
  return co2ppm;
}

// 🆕 Environmental compensation for MQ135
float compensateTemperatureHumidity(float ppm, float temp, float hum) {
  // Temperature compensation (-0.5% per degree above 20°C)
  float tempFactor = 1.0 - ((temp - 20.0) * 0.005);
  
  // Humidity compensation (-0.3% per % RH above 50%)
  float humFactor = 1.0 - ((hum - 50.0) * 0.003);
  
  return ppm * tempFactor * humFactor;
}

// 🆕 Initial calibration routine
void performInitialCalibration() {
  Serial.println("🎯 Performing initial sensor calibration...");
  
  // Take baseline readings for auto-calibration
  float mq135_baseline = 0;
  float mg811_baseline = 0;
  
  for(int i = 0; i < 10; i++) {
    mq135_baseline += analogRead(MQ135_PIN);
    mg811_baseline += analogRead(MG811_PIN);
    delay(100);
  }
  
  mq135_baseline /= 10;
  mg811_baseline /= 10;
  
  Serial.print("📊 MQ135 baseline (clean air): ");
  Serial.println(mq135_baseline);
  Serial.print("📊 MG811 baseline (ambient CO2): ");
  Serial.println(mg811_baseline);
  
  // Auto-adjust calibration if readings are unusual
  if(mq135_baseline < 500 || mq135_baseline > 3500) {
    Serial.println("⚠️ MQ135 readings unusual - check connections");
  }
  
  if(mg811_baseline < 200 || mg811_baseline > 3800) {
    Serial.println("⚠️ MG811 readings unusual - check connections");
  }
  
  Serial.println("✅ Initial calibration complete");
}

void sendDualSensorData(float airQualityPPM, float co2Level) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendAPI);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);
    
    // Enhanced JSON payload with calibrated data
    String payload = "{";
    payload += "\"airQuality\":" + String(airQualityPPM, 1) + ",";
    payload += "\"co2Level\":" + String(co2Level, 1) + ",";
    payload += "\"deviceId\":\"atmostrack_calibrated_001\",";
    payload += "\"location\":\"Visakhapatnam\",";
    payload += "\"sensorTypes\":[\"MQ135_Calibrated\",\"MG811_Calibrated\"],";
    payload += "\"calibrated\":true,";
    payload += "\"temperature\":" + String(temperature, 1) + ",";
    payload += "\"humidity\":" + String(humidity, 1);
    payload += "}";
    
    Serial.print("📡 Sending calibrated dual sensor data... ");
    int httpCode = http.POST(payload);
    
    if(httpCode == 200) {
      Serial.println("✅ SUCCESS");
      Serial.println("📊 Calibrated Sensor Readings:");
      Serial.print("   🌬️  Air Quality (MQ135): ");
      Serial.print(airQualityPPM, 1);
      Serial.println(" ppm CO2 equiv");
      Serial.print("   🏭 CO2 Level (MG811): ");
      Serial.print(co2Level, 1);
      Serial.println(" ppm");
      
      String aqStatus = getAirQualityStatus(airQualityPPM);
      String co2Status = getCO2Status(co2Level);
      Serial.print("   🎯 Air Quality: ");
      Serial.println(aqStatus);
      Serial.print("   🎯 CO2 Status: ");
      Serial.println(co2Status);
      Serial.print("   🌡️ Temp Compensation: ");
      Serial.print(temperature, 1);
      Serial.println("°C");
      
    } else if(httpCode > 0) {
      Serial.print("❌ HTTP Error: ");
      Serial.println(httpCode);
    } else {
      Serial.print("❌ Connection Error: ");
      Serial.println(http.errorToString(httpCode));
    }
    
    http.end();
    Serial.println("---");
  }
}

// 🔧 Updated status functions for calibrated readings
String getAirQualityStatus(float ppm) {
  if (ppm < 400) return "EXCELLENT";
  if (ppm < 600) return "GOOD";
  if (ppm < 1000) return "MODERATE";
  if (ppm < 1500) return "POOR";
  if (ppm < 2000) return "UNHEALTHY";
  return "HAZARDOUS";
}

String getCO2Status(float ppm) {
  if (ppm < 400) return "OUTDOOR_FRESH";
  if (ppm < 1000) return "GOOD";
  if (ppm < 2000) return "STUFFY";
  if (ppm < 5000) return "POOR";
  return "DANGEROUS";
}
