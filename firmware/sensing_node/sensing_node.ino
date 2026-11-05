#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <DHT.h>

// Sensing-node pin map for the upper deck ESP32 DevKit.
#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0   2

#define MQ2_PIN    34
#define MQ5_PIN    35
#define MQ9_PIN    32
#define MQ135_PIN  33
#define FIRE_PIN   25
#define TRIG_PIN   26
#define ECHO_PIN   27
#define DHT_PIN     4
#define SDA_PIN    21
#define SCL_PIN    22
#define MPU_ADDR  0x68
#define NODE1_ID    1
#define NODE2_ID    2

DHT dht(DHT_PIN, DHT22);
uint16_t packetID = 0;
bool mpuFound = false;
float gyroOffsetX = 0.0f, gyroOffsetY = 0.0f, gyroOffsetZ = 0.0f;

// This exact packed layout is shared with base_station.ino (60 bytes).
struct __attribute__((packed)) SensorPacket {
  uint16_t magic;
  uint8_t source;
  uint8_t destination;
  uint16_t packetID;
  uint8_t ttl;
  int32_t mq2;
  int32_t mq5;
  int32_t mq9;
  int32_t mq135;
  uint8_t fire;
  float distance;
  float temperature;
  float humidity;
  float ax, ay, az;
  float gx, gy, gz;
};

class MovingAverage3 {
  int32_t samples[3] = {0, 0, 0};
  int32_t sum = 0;
  uint8_t next = 0;
  uint8_t count = 0;
public:
  int32_t update(int32_t value) {
    if (count == 3) sum -= samples[next];
    else count++;
    samples[next] = value;
    sum += value;
    next = (next + 1) % 3;
    return sum / count;
  }
};

MovingAverage3 mq2Filter, mq5Filter, mq9Filter, mq135Filter;

void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz) {
  ax = ay = az = gx = gy = gz = 0.0f;
  if (!mpuFound) return;

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return;
  Wire.requestFrom(MPU_ADDR, 14, true);
  if (Wire.available() < 14) return;

  const int16_t rawAX = (Wire.read() << 8) | Wire.read();
  const int16_t rawAY = (Wire.read() << 8) | Wire.read();
  const int16_t rawAZ = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read(); // temperature
  const int16_t rawGX = (Wire.read() << 8) | Wire.read();
  const int16_t rawGY = (Wire.read() << 8) | Wire.read();
  const int16_t rawGZ = (Wire.read() << 8) | Wire.read();

  ax = rawAX / 16384.0f;
  ay = rawAY / 16384.0f;
  az = rawAZ / 16384.0f;
  gx = rawGX / 131.0f - gyroOffsetX;
  gy = rawGY / 131.0f - gyroOffsetY;
  gz = rawGZ / 131.0f - gyroOffsetZ;
}

void initMPU() {
  Wire.beginTransmission(MPU_ADDR);
  if (Wire.endTransmission() != 0) {
    Serial.println("MPU6050 NOT FOUND");
    return;
  }
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();
  mpuFound = true;
  Serial.println("MPU6050 FOUND");
}

// Keep rover stationary during the 100-sample zero-rate gyro calibration.
void calibrateGyro() {
  if (!mpuFound) return;
  float sx = 0, sy = 0, sz = 0;
  const uint16_t samples = 100;
  for (uint16_t i = 0; i < samples; ++i) {
    float ax, ay, az, gx, gy, gz;
    readMPU(ax, ay, az, gx, gy, gz);
    sx += gx; sy += gy; sz += gz;
    delay(10);
  }
  gyroOffsetX = sx / samples;
  gyroOffsetY = sy / samples;
  gyroOffsetZ = sz / samples;
  Serial.printf("Gyro zero offsets (deg/s): %.3f, %.3f, %.3f\n",
                gyroOffsetX, gyroOffsetY, gyroOffsetZ);
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  return duration == 0 ? -1.0f : duration * 0.0343f / 2.0f;
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\nAHARR sensing node");

  pinMode(MQ2_PIN, INPUT);
  pinMode(MQ5_PIN, INPUT);
  pinMode(MQ9_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(FIRE_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  initMPU();
  calibrateGyro();

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433.5E6)) {
    Serial.println("LoRa initialization failed");
    while (true) delay(1000);
  }
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.setTxPower(10);
  Serial.printf("LoRa ready; packet size = %u bytes\n", sizeof(SensorPacket));
}

void loop() {
  SensorPacket packet{};
  packet.magic = 0xABCD;
  packet.source = NODE1_ID;
  packet.destination = NODE2_ID;
  packet.packetID = ++packetID;
  packet.ttl = 3;

  // Three-sample smoothing only; these remain uncalibrated raw ADC counts.
  packet.mq2 = mq2Filter.update(analogRead(MQ2_PIN));
  packet.mq5 = mq5Filter.update(analogRead(MQ5_PIN));
  packet.mq9 = mq9Filter.update(analogRead(MQ9_PIN));
  packet.mq135 = mq135Filter.update(analogRead(MQ135_PIN));

  // LM393 flame modules are often active-LOW. Verify physical module polarity.
  packet.fire = digitalRead(FIRE_PIN) == LOW ? 1 : 0;
  packet.distance = readDistanceCm();

  packet.temperature = dht.readTemperature();
  packet.humidity = dht.readHumidity();
  if (isnan(packet.temperature)) packet.temperature = -99.0f;
  if (isnan(packet.humidity)) packet.humidity = -99.0f;

  readMPU(packet.ax, packet.ay, packet.az, packet.gx, packet.gy, packet.gz);

  Serial.printf("TX packet %u | MQ2=%ld MQ5=%ld MQ9=%ld MQ135=%ld fire=%u\n",
                packet.packetID, (long)packet.mq2, (long)packet.mq5,
                (long)packet.mq9, (long)packet.mq135, packet.fire);

  LoRa.beginPacket();
  LoRa.write(reinterpret_cast<const uint8_t*>(&packet), sizeof(packet));
  const int result = LoRa.endPacket();
  Serial.println(result == 1 ? "LoRa packet sent" : "LoRa send failed");
  delay(3000);
}
