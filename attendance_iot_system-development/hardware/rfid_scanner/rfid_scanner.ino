#include <Wire.h>
#include <Adafruit_PN532.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <queue>
#include <DNSServer.h>
#include <ESPmDNS.h>

// I2C pins for ESP32
#define SDA_PIN 21
#define SCL_PIN 22
#define LED_PIN 2     // Built-in LED pin
#define DEBUG_LED_PIN 4  // Debug LED pin

// WiFi credentials
const char* ssid = "POS_Server";
const char* password = "asdffdsa";

// Server configuration
const char* hostname = "attendance-server";  // This will be your computer's hostname
const int port = 5000;
String serverUrl = "";  // Will be constructed after IP discovery

// Device ID (predefined)
const char* deviceId = "SE-01";

// Queue management
struct ScanData {
    String rfidId;
    unsigned long timestamp;
};

std::queue<ScanData> scanQueue;
const int MAX_QUEUE_SIZE = 50;  // Maximum number of scans to queue
const unsigned long SCAN_COOLDOWN = 3000;  // Minimum time between scans (3 seconds)
unsigned long lastScanTime = 0;
unsigned long lastProcessTime = 0;
const unsigned long PROCESS_INTERVAL = 100;  // Process queue every 100ms
const unsigned long IP_CHECK_INTERVAL = 300000;  // Check IP every 5 minutes
unsigned long lastIPCheck = 0;

// Create PN532 instance
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

// Debug function to blink LED
void blinkDebugLED(int times, int delay_ms) {
  for(int i = 0; i < times; i++) {
    digitalWrite(DEBUG_LED_PIN, HIGH);
    delay(delay_ms);
    digitalWrite(DEBUG_LED_PIN, LOW);
    delay(delay_ms);
  }
}

bool discoverServerIP() {
  Serial.println("\n[DEBUG] Attempting to discover server IP...");
  
  // Try mDNS first
  if (MDNS.begin("esp32")) {
    Serial.println("[DEBUG] mDNS responder started");
    IPAddress serverIP = MDNS.queryHost(hostname);
    if (serverIP.toString() != "0.0.0.0") {
      serverUrl = "http://" + serverIP.toString() + ":" + String(port);
      Serial.print("[DEBUG] Found server via mDNS: ");
      Serial.println(serverUrl);
      return true;
    }
  }
  
  // If mDNS fails, try scanning network
  Serial.println("[DEBUG] mDNS failed, scanning network...");
  WiFiClient client;
  for (int i = 1; i < 255; i++) {
    String testIP = "192.168.0." + String(i);
    if (client.connect(testIP.c_str(), port)) {
      serverUrl = "http://" + testIP + ":" + String(port);
      Serial.print("[DEBUG] Found server at: ");
      Serial.println(serverUrl);
      client.stop();
      return true;
    }
    client.stop();
  }
  
  Serial.println("[ERROR] Could not find server!");
  return false;
}

void connectToWiFi() {
  Serial.println("\n[DEBUG] Attempting to connect to WiFi...");
  Serial.print("[DEBUG] SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  int attempts = 0;
  
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[DEBUG] WiFi Connected Successfully!");
    Serial.print("[DEBUG] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[DEBUG] Signal Strength (RSSI): ");
    Serial.println(WiFi.RSSI());
    Serial.print("[DEBUG] Gateway IP: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("[DEBUG] Subnet Mask: ");
    Serial.println(WiFi.subnetMask());
    blinkDebugLED(2, 200);
    
    // Discover server IP after connecting
    if (discoverServerIP()) {
      blinkDebugLED(1, 200);
    } else {
      blinkDebugLED(5, 200);
    }
  } else {
    Serial.println("\n[ERROR] WiFi Connection Failed!");
    Serial.println("[DEBUG] Please check your WiFi credentials and network availability");
    blinkDebugLED(5, 200);
  }
}

void sendRFIDData(String rfidId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi not connected!");
    Serial.println("[DEBUG] Attempting to reconnect...");
    connectToWiFi();
    return;
  }

  // Check if we need to rediscover server IP
  if (millis() - lastIPCheck > IP_CHECK_INTERVAL) {
    if (!discoverServerIP()) {
      Serial.println("[ERROR] Failed to rediscover server IP!");
      return;
    }
    lastIPCheck = millis();
  }

  Serial.println("\n[DEBUG] Preparing to send RFID data...");
  Serial.print("[DEBUG] RFID ID: ");
  Serial.println(rfidId);
  Serial.print("[DEBUG] Device ID: ");
  Serial.println(deviceId);
  
  HTTPClient http;
  
  // Prepare JSON data with timestamp
  String jsonData = "{\"rfidId\":\"" + rfidId + 
                   "\",\"deviceId\":\"" + deviceId + 
                   "\",\"timestamp\":\"" + String(millis()) + "\"}";
  
  Serial.print("[DEBUG] JSON Data: ");
  Serial.println(jsonData);
  
  // Begin HTTP connection
  String fullUrl = serverUrl + "/api/rfid-scans/scan";
  Serial.print("[DEBUG] Connecting to API: ");
  Serial.println(fullUrl);
  http.begin(fullUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Send POST request with timeout
  http.setTimeout(5000);  // 5 second timeout
  Serial.println("[DEBUG] Sending POST request...");
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[DEBUG] HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("[DEBUG] Response: ");
    Serial.println(response);
    blinkDebugLED(1, 200);
  } else {
    Serial.println("[ERROR] Failed to send HTTP request!");
    Serial.print("[DEBUG] Error code: ");
    Serial.println(httpResponseCode);
    Serial.println("[DEBUG] Please check:");
    Serial.println("1. API server is running");
    Serial.println("2. Server IP is correct");
    Serial.println("3. Network connectivity");
    Serial.println("4. Firewall settings");
    blinkDebugLED(5, 200);
  }
  
  http.end();
}

void processQueue() {
  if (scanQueue.empty()) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastProcessTime < PROCESS_INTERVAL) return;
  lastProcessTime = currentTime;
  
  ScanData data = scanQueue.front();
  scanQueue.pop();
  
  sendRFIDData(data.rfidId);
  
  // Print queue status
  Serial.print("[DEBUG] Queue size: ");
  Serial.println(scanQueue.size());
}

void setup(void) {
  // Initialize serial communication
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for serial port to connect
  }
  Serial.println("\n[DEBUG] Serial communication initialized");
  
  // Initialize LED pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(DEBUG_LED_PIN, OUTPUT);
  Serial.println("[DEBUG] LED pins initialized");
  
  // Initialize I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.println("[DEBUG] I2C initialized");
  
  // Initialize PN532
  nfc.begin();
  Serial.println("[DEBUG] PN532 initialized");
  
  // Check firmware version
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("[ERROR] Didn't find PN53x board!");
    Serial.println("[DEBUG] Please check your connections:");
    Serial.println("1. SDA and SCL pins");
    Serial.println("2. Power supply to PN532");
    Serial.println("3. I2C address (default: 0x24)");
    blinkDebugLED(4, 500);
    while (1); // halt
  }
  
  // Got ok data, print it out!
  Serial.print("[DEBUG] Found chip PN5"); 
  Serial.println((versiondata>>24) & 0xFF, HEX);
  Serial.print("[DEBUG] Firmware ver. "); 
  Serial.print((versiondata>>16) & 0xFF, DEC);
  Serial.print('.'); 
  Serial.println((versiondata>>8) & 0xFF, DEC);
  
  // Configure board to read RFID tags
  nfc.SAMConfig();
  Serial.println("[DEBUG] SAM configured");
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n[DEBUG] System initialization complete");
  Serial.println("[DEBUG] Waiting for an NFC card...");
}

void loop(void) {
  // Process the queue
  processQueue();
  
  // Check if we can accept new scans
  unsigned long currentTime = millis();
  if (currentTime - lastScanTime < SCAN_COOLDOWN) {
    return;
  }
  
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)

  // Wait for an ISO14443A type cards (Mifare, etc.)
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success) {
    Serial.println("\n[DEBUG] Found an NFC tag!");
    
    // Display UID
    Serial.print("[DEBUG] UID Length: "); 
    Serial.print(uidLength, DEC); 
    Serial.println(" bytes");
    
    // Convert UID to string
    String rfidId = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) {
        rfidId += "0";
      }
      rfidId += String(uid[i], HEX);
    }
    rfidId.toUpperCase();
    
    Serial.print("[DEBUG] UID Value: ");
    Serial.println(rfidId);
    
    // Blink LED to indicate card read
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    
    // Add to queue if not full
    if (scanQueue.size() < MAX_QUEUE_SIZE) {
      ScanData newScan = {rfidId, currentTime};
      scanQueue.push(newScan);
      Serial.print("[DEBUG] Added to queue. Queue size: ");
      Serial.println(scanQueue.size());
    } else {
      Serial.println("[WARNING] Queue full! Scan dropped.");
      blinkDebugLED(3, 200);  // Three blinks for queue full
    }
    
    lastScanTime = currentTime;
  }
} 