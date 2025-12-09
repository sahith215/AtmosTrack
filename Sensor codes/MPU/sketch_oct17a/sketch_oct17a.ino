#include <Wire.h>

void setup() {
  Serial.begin(115200);
  delay(3000);
  
  Serial.println("🔧 MPU6050 Test - Using G13/G12 Pins");
  Serial.println("====================================");
  Serial.println("NEW CONNECTIONS:");
  Serial.println("  MPU6050 VCC → 3.3V power rail");
  Serial.println("  MPU6050 GND → GND power rail");
  Serial.println("  MPU6050 SDA → ESP32 G13 pin");
  Serial.println("  MPU6050 SCL → ESP32 G12 pin");
  Serial.println();
  
  // Initialize I2C with G13/G12
  Wire.begin(13, 12); // SDA=13, SCL=12
  Wire.setClock(100000); // 100kHz for stability
  
  delay(1000);
  
  Serial.println("📡 Scanning I2C devices...");
  Serial.println("---------------------------");
  
  int deviceCount = 0;
  bool mpuFound = false;
  
  for(byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    
    if (error == 0) {
      deviceCount++;
      Serial.print("✅ DEVICE FOUND: 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.print(" (decimal: ");
      Serial.print(address);
      Serial.println(")");
      
      if (address == 0x68) {
        Serial.println("🎯 ^ MPU6050 DETECTED!");
        mpuFound = true;
      }
    }
  }
  
  Serial.println("---------------------------");
  Serial.print("TOTAL DEVICES: ");
  Serial.println(deviceCount);
  
  if (mpuFound) {
    Serial.println("🚀 SUCCESS! MPU6050 is responding!");
    Serial.println("Ready for sensor testing...");
  } else if (deviceCount == 0) {
    Serial.println("❌ NO DEVICES FOUND");
    Serial.println("Check connections and try again");
  } else {
    Serial.println("⚠️  Found devices but no MPU6050 at 0x68");
  }
  
  Serial.println("====================================");
}

void loop() {
  delay(3000);
  Serial.println("💓 I2C scan complete - check results above");
}
