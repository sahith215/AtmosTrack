#include "MQ135.h"

#define pinA A0
MQ135 sensorMQ = MQ135(pinA);

// Calibration parameters - adjust these based on your sensor readings
#define MIN_RAW_VALUE 1400    // Minimum value you observe (clean air)
#define MAX_RAW_VALUE 3200    // Maximum value you observe (polluted air)

void setup() {
  Serial.begin(9600);
  Serial.println("MQ-135 Air Quality Monitor - Advanced Calibration");
  Serial.println("=================================================");
}

void loop() {
  float rawPPM = sensorMQ.getPPM();
  
  // Advanced mapping with multiple ranges
  float calibratedPPM;
  
  if (rawPPM < 1600) {
    // Good air quality range
    calibratedPPM = map(rawPPM, MIN_RAW_VALUE, 1600, 10, 49);
  }
  else if (rawPPM < 2300) {
    // Moderate air quality range  
    calibratedPPM = map(rawPPM, 1600, 2300, 50, 99);
  }
  else {
    // Poor air quality range
    calibratedPPM = map(rawPPM, 2300, MAX_RAW_VALUE, 100, 200);
  }
  
  // Constrain to valid range
  calibratedPPM = constrain(calibratedPPM, 10, 200);
  
  // Air quality determination
  String status;
  String recommendation;
  
  if (calibratedPPM < 50) {
    status = "GOOD";
    recommendation = "Air quality is excellent";
  }
  else if (calibratedPPM < 100) {
    status = "MODERATE";  
    recommendation = "Ventilation recommended";
  }
  else {
    status = "POOR";
    recommendation = "Immediate ventilation needed!";
  }
  
  // Display comprehensive results
  Serial.print("Raw: ");
  Serial.print(rawPPM, 1);
  Serial.print(" → Calibrated: ");
  Serial.print(calibratedPPM, 1);
  Serial.print(" PPM");
  Serial.print(" | Status: ");
  Serial.println(status);
  Serial.println(recommendation);
  Serial.println("------------------------");
  
  delay(3000);
}
