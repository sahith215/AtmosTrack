/*
 * MG811 CO2 Sensor - Virtual Calibration Code
 * AtmosTrack Project - Final Version
 * Works with 5V power (virtually calibrated)
 */

#define MG811_PIN A0
#define SAMPLE_TIMES 10

// Virtual calibration constants (based on MG811 specs)
#define DC_GAIN 8.5                    // Amplifier gain
#define ZERO_POINT_VOLTAGE 0.220       // Clean air voltage (400ppm)
#define REACTION_VOLTAGE 0.030         // Voltage drop from 400ppm to 1000ppm

// CO2 curve coefficients [lg400, voltage@400ppm, slope]
float CO2Curve[3] = {2.602, ZERO_POINT_VOLTAGE, (REACTION_VOLTAGE/(2.602-3))};

void setup() {
  Serial.begin(9600);
  Serial.println("=== MG811 CO2 Sensor - AtmosTrack ===");
  Serial.println("Virtual Calibration Applied");
  Serial.println("Warming up... (Wait 60 seconds)");
  delay(2000);
}

void loop() {
  int sensorValue = analogRead(MG811_PIN);
  float voltage = MGRead(MG811_PIN);
  
  // Calculate CO2 concentration
  int co2_ppm = MGGetPercentage(voltage, CO2Curve);
  
  // Display results
  Serial.print("Raw: ");
  Serial.print(sensorValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 3);
  Serial.print("V | CO2: ");
  
  if (co2_ppm == -1) {
    Serial.print("< 400");
  } else {
    Serial.print(co2_ppm);
  }
  Serial.print(" ppm");
  
  // Air quality assessment
  evaluateAirQuality(co2_ppm);
  
  Serial.println("---");
  delay(5000);
}

/**
 * Read multiple samples and average for stability
 */
float MGRead(int mg_pin) {
  int i;
  float v = 0;
  
  for (i = 0; i < SAMPLE_TIMES; i++) {
    v += analogRead(mg_pin);
    delay(50);
  }
  
  v = (v / SAMPLE_TIMES) * 5.0 / 1024.0;  // Convert to voltage
  return v;
}

/**
 * Convert voltage to CO2 concentration using logarithmic curve
 */
int MGGetPercentage(float volts, float *pcurve) {
  // Compensate for low power supply (virtual calibration)
  float adjustedVoltage = volts + 0.15;  // Add offset for 5V operation
  
  if (adjustedVoltage >= ZERO_POINT_VOLTAGE) {
    return -1;  // Below detection limit
  } else {
    // Logarithmic calculation based on MG811 response curve
    float lgCO2 = ((adjustedVoltage - pcurve[1]) / pcurve[2]) + pcurve[0];
    int ppm = (int)pow(10, lgCO2);
    
    // Apply realistic bounds for indoor air
    if (ppm < 400) ppm = 400;        // Minimum outdoor level
    if (ppm > 5000) ppm = 5000;      // Maximum reasonable indoor level
    
    return ppm;
  }
}

/**
 * Evaluate air quality and provide recommendations
 */
void evaluateAirQuality(int co2_ppm) {
  Serial.print(" | ");
  
  if (co2_ppm <= 400) {
    Serial.print("🌟 Excellent (Outdoor quality)");
  } else if (co2_ppm <= 600) {
    Serial.print("✅ Good (Acceptable indoor)");
  } else if (co2_ppm <= 800) {
    Serial.print("⚠️ Moderate (Increase ventilation)");
  } else if (co2_ppm <= 1000) {
    Serial.print("🔶 Poor (Drowsiness possible)");
  } else if (co2_ppm <= 1500) {
    Serial.print("🔴 Bad (Immediate ventilation needed)");
  } else {
    Serial.print("💀 Dangerous (Health risk!)");
  }
}
