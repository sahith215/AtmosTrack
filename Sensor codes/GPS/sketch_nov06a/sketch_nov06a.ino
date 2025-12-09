#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>

// GPS module connection pins
SoftwareSerial gpsSerial(2, 3); // RX=Pin2, TX=Pin3

// GPS object
TinyGPSPlus gps;

// Tracking variables
unsigned long lastDisplayTime = 0;
unsigned long lastValidFixTime = 0;
bool hasFixEverBeenAcquired = false;

void setup() {
  // Start serial communication with computer
  Serial.begin(115200);
  delay(500);
  
  // Start GPS serial communication
  gpsSerial.begin(9600);
  delay(500);
  
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   AtmosTrack GPS Module Test v2.0  ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.println("\n📍 Initializing GPS...");
  Serial.println("⏳ Waiting for satellite signal...");
  Serial.println("📡 This may take 30-60 seconds outdoors");
  Serial.println("💡 Ensure clear sky view for best results\n");
}

void loop() {
  // Continuously read and decode GPS data
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
    
    // Optional: Uncomment below to see raw NMEA data for debugging
    // Serial.print(c);
  }
  
  // Display location every 2 seconds
  if (millis() - lastDisplayTime >= 2000) {
    lastDisplayTime = millis();
    displayInfo();
  }
}

void displayInfo() {
  Serial.println("─────────────────────────────────────");
  
  // Check if GPS has valid location fix
  if (gps.location.isValid() && gps.satellites.isValid() && gps.satellites.value() >= 3) {
    
    // GPS FIX ACQUIRED
    hasFixEverBeenAcquired = true;
    lastValidFixTime = millis();
    
    Serial.println("✅ GPS FIX ACQUIRED!");
    Serial.println();
    
    // Latitude
    Serial.print("📍 Latitude:  ");
    Serial.println(gps.location.lat(), 8);  // 8 decimal places for precision
    
    // Longitude
    Serial.print("📍 Longitude: ");
    Serial.println(gps.location.lng(), 8);  // 8 decimal places for precision
    
    // Altitude (if available)
    if (gps.altitude.isValid()) {
      Serial.print("📈 Altitude: ");
      Serial.print(gps.altitude.meters(), 2);
      Serial.println(" meters");
    }
    
    // Number of Satellites
    if (gps.satellites.isValid()) {
      Serial.print("🛰️  Satellites: ");
      Serial.println(gps.satellites.value());
    }
    
    // Accuracy/Horizontal Dilution (if available)
    if (gps.hdop.isValid()) {
      Serial.print("📊 HDOP (Accuracy): ");
      Serial.println(gps.hdop.value() / 100.0, 2);  // Lower is better
    }
    
    // Speed (if available)
    if (gps.speed.isValid()) {
      Serial.print("💨 Speed: ");
      Serial.print(gps.speed.kmph(), 2);
      Serial.println(" km/h");
    }
    
    // Date & Time (if available)
    if (gps.date.isValid() && gps.time.isValid()) {
      Serial.print("🕐 Date/Time: ");
      
      // Date
      if (gps.date.day() < 10) Serial.print("0");
      Serial.print(gps.date.day());
      Serial.print("/");
      if (gps.date.month() < 10) Serial.print("0");
      Serial.print(gps.date.month());
      Serial.print("/");
      Serial.print(gps.date.year());
      
      Serial.print(" ");
      
      // Time
      if (gps.time.hour() < 10) Serial.print("0");
      Serial.print(gps.time.hour());
      Serial.print(":");
      if (gps.time.minute() < 10) Serial.print("0");
      Serial.print(gps.time.minute());
      Serial.print(":");
      if (gps.time.second() < 10) Serial.print("0");
      Serial.println(gps.time.second());
    }
    
    Serial.println("✨ Location locked and ready for AtmosTrack!");
    
  } else {
    
    // Still searching for satellites
    Serial.println("⏳ Searching for satellites...");
    Serial.print("📡 NMEA Characters received: ");
    Serial.println(gps.charsProcessed());
    
    // Show helpful debugging info
    if (gps.satellites.isValid()) {
      Serial.print("🛰️  Satellites in view: ");
      Serial.println(gps.satellites.value());
    }
    
    if (hasFixEverBeenAcquired) {
      Serial.println("💡 Signal lost. Moving to open area may help.");
    } else {
      Serial.println("💡 First acquisition. Wait 1-2 minutes for lock.");
    }
  }
  
  Serial.println();
}

// BONUS FUNCTION: Get coordinates as string (useful for cloud transmission)
String getGPSCoordinates() {
  if (gps.location.isValid()) {
    String coords = "";
    coords += String(gps.location.lat(), 8);
    coords += ",";
    coords += String(gps.location.lng(), 8);
    return coords;
  } else {
    return "0.0,0.0"; // Invalid coordinates
  }
}

// BONUS FUNCTION: Get GPS status (0=No fix, 1=Fix acquired)
int getGPSStatus() {
  return (gps.location.isValid() && gps.satellites.isValid() && gps.satellites.value() >= 3) ? 1 : 0;
}
