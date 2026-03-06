#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

enum SendResult { SEND_FAIL, SENT_NEW, SENT_DUP };

// ==================== การตั้งค่า WiFi ====================
const char* WIFI_SSID = "WoodForest_391710";        // ชื่อ WiFi ของคุณ
const char* WIFI_PASS = "83884887";                 // รหัส WiFi ของคุณ

// ==================== การตั้งค่า Server ====================
// เปลี่ยนเป็น IP Address ของคอมพิวเตอร์ที่รัน Node.js Server
// ⚠️ สำคัญ: ต้องใช้ IP ของเครื่องที่รัน Server ไม่ใช่ IP ของ ESP32
// IP ของเครื่องคอม: 192.168.0.196
// IP ของ ESP32: 192.168.0.192
const char* SERVER_URL = "http://192.168.0.196:3000/api/attendance/scan";
const char* ACTIVE_COURSE_URL = "http://192.168.0.196:3000/api/public/active-course";
const int DEFAULT_COURSE_ID = 1;  // ใช้เฉพาะกรณีดึงค่าวิชาจากเว็บไม่ได้

// ==================== การตั้งค่า RFID ====================
#define SS_PIN   5      // SDA
#define RST_PIN  22     // RST
#define SCK_PIN  18     // SCK
#define MISO_PIN 19     // MISO
#define MOSI_PIN 23     // MOSI

MFRC522 rfid(SS_PIN, RST_PIN);

// ==================== การตั้งค่า Buzzer (Passive) ====================
#define BUZZER_IO 4

// เสียงสำหรับบันทึกใหม่
void soundNew() {
  tone(BUZZER_IO, 1000, 140);  // 1000Hz เป็นระยะเวลา 140ms
  delay(80);
  tone(BUZZER_IO, 1000, 140);  // เสียงที่สอง
}

// เสียงสำหรับการแตะซ้ำ (ไม่นับ)
void soundDup() {
  tone(BUZZER_IO, 800, 90);    // 800Hz เป็นระยะเวลา 90ms
  delay(70);
  tone(BUZZER_IO, 800, 90);    // เสียงที่สอง
}

// เสียงสำหรับการส่งข้อมูลไม่ได้
void soundNetFail() {
  tone(BUZZER_IO, 500, 80);    // 500Hz เป็นระยะเวลา 80ms
  delay(60);
  tone(BUZZER_IO, 500, 80);    // เสียงที่สอง
  delay(60);
  tone(BUZZER_IO, 500, 80);    // เสียงที่สาม
}

// ==================== การตั้งค่า RGB LED ====================
#define RED_PIN   13
#define GREEN_PIN 12
#define BLUE_PIN  14

void setRGB(int r, int g, int b) {
  analogWrite(RED_PIN, r);
  analogWrite(GREEN_PIN, g);
  analogWrite(BLUE_PIN, b);
}

void stateWait()  { setRGB(0, 0, 255); }    // 🔵 น้ำเงิน - รอการแตะ
void stateNew()   { setRGB(0, 255, 0); }    // 🟢 เขียว - บันทึกใหม่
void stateDup()   { setRGB(255,100,0); }  // 🟡 เหลือง - แตะซ้ำ
void stateFail()  { setRGB(255, 0, 0); }    // 🔴 แดง - ล้มเหลว

// ==================== ตัวแปรสำหรับป้องกันการแตะซ้ำเร็ว ====================
String lastUID = "";
unsigned long lastScan = 0;
const unsigned long DUP_MS = 1200;  // รอ 1.2 วินาที
int currentCourseId = DEFAULT_COURSE_ID;
unsigned long lastCourseSyncMs = 0;
const unsigned long COURSE_SYNC_INTERVAL_MS = 10000;

// ==================== ฟังก์ชัน: อ่าน RFID UID ====================
String readUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toLowerCase();
  return uid;
}

// ==================== ฟังก์ชัน: เชื่อมต่อ WiFi ====================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("🔌 กำลังเชื่อมต่อ WiFi: ");
  Serial.println(WIFI_SSID);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 60) {
    delay(250);
    Serial.print(".");
    tries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("✅ WiFi เชื่อมต่อสำเร็จ IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("❌ WiFi เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบชื่อและรหัสผ่าน");
  }
}

// ==================== ฟังก์ชัน: ดึงวิชาปัจจุบันจากเว็บ ====================
void syncActiveCourse() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  if (!http.begin(ACTIVE_COURSE_URL)) {
    Serial.println("⚠️ ดึงวิชาปัจจุบันไม่สำเร็จ (begin fail)");
    return;
  }

  int code = http.GET();
  String response = http.getString();
  http.end();

  if (code != 200) {
    Serial.print("⚠️ ยังไม่พบวิชาปัจจุบันจากเว็บ code=");
    Serial.println(code);
    return;
  }

  int keyIndex = response.indexOf("\"courseId\":");
  if (keyIndex < 0) return;

  keyIndex += 11;
  int endIndex = response.indexOf(",", keyIndex);
  if (endIndex < 0) endIndex = response.indexOf("}", keyIndex);
  if (endIndex < 0) return;

  String coursePart = response.substring(keyIndex, endIndex);
  coursePart.trim();
  int fetchedCourseId = coursePart.toInt();

  if (fetchedCourseId > 0 && fetchedCourseId != currentCourseId) {
    currentCourseId = fetchedCourseId;
    Serial.print("✅ เปลี่ยนวิชาปัจจุบันเป็น Course ID: ");
    Serial.println(currentCourseId);
  }
}

// ==================== ฟังก์ชัน: ส่งข้อมูลการเช็คชื่อไปยัง Server ====================
SendResult postAttendance(const String& rfidUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi ไม่ได้เชื่อมต่อ");
    return SEND_FAIL;
  }

  HTTPClient http;
  
  if (!http.begin(SERVER_URL)) {
    Serial.println("❌ ไม่สามารถเชื่อมต่อ Server ได้");
    return SEND_FAIL;
  }

  http.addHeader("Content-Type", "application/json");

  // สร้าง JSON Payload (ไม่ใช้ ArduinoJson)
  String payload = "{\"rfid\":\"" + rfidUID + "\",\"courseId\":" + String(currentCourseId) + "}";

  Serial.println("📤 กำลังส่งข้อมูล...");
  Serial.print("   RFID: ");
  Serial.print(rfidUID);
  Serial.print(" | Course ID: ");
  Serial.println(currentCourseId);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.print("📥 Response Code: ");
  Serial.println(code);
  Serial.print("📄 Response: ");
  Serial.println(response);

  // ตรวจสอบ HTTP Status Code
  // 409 = Conflict (เช็คชื่อซ้ำ)
  if (code == 409) {
    Serial.println("⚠️ เช็คชื่อซ้ำ - เคยเช็คชื่อไปแล้ววันนี้");
    return SENT_DUP;  // แตะซ้ำ
  }
  
  if (code != 200) {
    Serial.println("❌ HTTP Error Code: " + String(code));
    return SEND_FAIL;
  }

  // ตรวจสอบ Response (ใช้ string parsing แทน JSON)
  
  // ตรวจสอบการ Duplicate (เช็คชื่อแล้ว) - สำหรับ backward compatibility
  if (response.indexOf("เช็คชื่อซ้ำ") >= 0 || response.indexOf("เช็คชื่อแล้ว") >= 0) {
    Serial.println("⚠️ เช็คชื่อซ้ำ");
    return SENT_DUP;
  }
  
  // ตรวจสอบ Error อื่นๆ
  if (response.indexOf("\"error\"") >= 0 && response.indexOf("เช็คชื่อซ้ำ") < 0) {
    Serial.println("❌ Error: " + response);
    return SEND_FAIL;
  }

  // สำเร็จ - แยกข้อมูลจาก Response
  if (response.indexOf("\"success\":true") >= 0 || response.indexOf("\"success\": true") >= 0) {
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("✅ เช็คชื่อสำเร็จ!");
    
    // ค้นหา student name
    int nameStart = response.indexOf("\"name\":\"");
    if (nameStart >= 0) {
      nameStart += 8;
      int nameEnd = response.indexOf("\"", nameStart);
      if (nameEnd >= 0) {
        String studentName = response.substring(nameStart, nameEnd);
        Serial.print("👤 ชื่อ: ");
        Serial.println(studentName);
      }
    }
    
    // ค้นหา status
    int statusStart = response.indexOf("\"status\":\"");
    if (statusStart >= 0) {
      statusStart += 10;
      int statusEnd = response.indexOf("\"", statusStart);
      if (statusEnd >= 0) {
        String status = response.substring(statusStart, statusEnd);
        Serial.print("📊 สถานะ: ");
        Serial.println(status);
      }
    }
    
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return SENT_NEW;
  }

  return SEND_FAIL;
}

// ==================== Setup ====================
void setup() {
  Serial.begin(115200);
  delay(500);

  // ตั้งค่า Buzzer
  pinMode(BUZZER_IO, OUTPUT);
  noTone(BUZZER_IO);  // ปิดเสียงในตอนเริ่มต้น

  // ตั้งค่า RGB LED
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  stateWait();  // เปิด LED น้ำเงิน (รอการแตะ)

  // เริ่มต้น SPI และ RFID
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();

  Serial.println("\n═══════════════════════════════════════════");
  Serial.println("  ระบบเช็คชื่อด้วย RFID + Node.js Server");
  Serial.println("═══════════════════════════════════════════");
  
  // เชื่อมต่อ WiFi
  connectWiFi();
  syncActiveCourse();
  
  Serial.println("\n✅ ระบบพร้อมใช้งาน!");
  Serial.println("📖 วางบัตร RFID บนเครื่องอ่าน...\n");
}

// ==================== Main Loop ====================
void loop() {
  // ตรวจสอบการเชื่อมต่อ WiFi
  if (WiFi.status() != WL_CONNECTED) {
    stateWait();
    delay(1000);
    return;
  }

  // ซิงก์วิชาปัจจุบันเป็นระยะจากเว็บ
  unsigned long nowMs = millis();
  if (nowMs - lastCourseSyncMs >= COURSE_SYNC_INTERVAL_MS) {
    syncActiveCourse();
    lastCourseSyncMs = nowMs;
  }

  // ตรวจสอบว่ามีบัตร RFID หรือไม่
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // อ่าน UID ของบัตร RFID
  String uid = readUID();
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.print("📇 RFID UID: ");
  Serial.println(uid);

  // ป้องกันการแตะซ้ำเร็วเกินไป (1.2 วินาที)
  unsigned long now = millis();
  if (uid == lastUID && (now - lastScan) < DUP_MS) {
    Serial.println("⚡ การแตะเร็วเกินไป (ถูกละเว้น)");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }
  lastUID = uid;
  lastScan = now;

  // ส่งข้อมูลการเช็คชื่อไปยัง Server
  SendResult result = postAttendance(uid);

  // แสดงผลตามสถานะ
  if (result == SENT_NEW) {
    Serial.println("✅ บันทึกใหม่สำเร็จ!");
    stateNew();
    soundNew();
    delay(1500);  // แสดง LED เขียว 1.5 วินาที
  } else if (result == SENT_DUP) {
    Serial.println("⚠️ เช็คชื่อแล้วในวันนี้ (ไม่นับ)");
    stateDup();
    soundDup();
    delay(2000);  // แสดง LED เหลือง 2 วินาที (นานขึ้นเพื่อให้เห็นชัด)
  } else {
    Serial.println("❌ ล้มเหลว โปรดลองใหม่");
    stateFail();
    soundNetFail();
    delay(1500);  // แสดง LED แดง 1.5 วินาที
  }

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  stateWait();  // กลับไป LED น้ำเงิน (รอการแตะครั้งต่อไป)

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
