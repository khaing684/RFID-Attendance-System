# RFID Hardware Setup Guide

This guide explains how to set up and configure the RFID hardware for the attendance system.

## Hardware Requirements

1. Raspberry Pi (3 or 4 recommended)
2. MFRC522 RFID Reader Module
3. RFID Cards/Tags (13.56MHz)
4. Jumper Wires
5. LED (optional, for status indication)
6. Buzzer (optional, for audio feedback)

## Wiring Diagram

Connect the MFRC522 module to the Raspberry Pi:

```
MFRC522      Raspberry Pi
SDA (SS)  ->  GPIO8 (CE0)
SCK       ->  GPIO11 (SCLK)
MOSI      ->  GPIO10 (MOSI)
MISO      ->  GPIO9 (MISO)
GND       ->  GND
RST       ->  GPIO25
3.3V      ->  3.3V
```

## Software Setup

1. Install required packages:
   ```bash
   sudo apt-get update
   sudo apt-get install python3-pip
   sudo pip3 install mfrc522
   sudo pip3 install requests
   ```

2. Enable SPI interface:
   ```bash
   sudo raspi-config
   # Navigate to "Interface Options" > "SPI" > Enable
   ```

3. Copy the `rfid_scanner.py` script to your Raspberry Pi

4. Configure the script:
   - Update `DEVICE_ID` with your device's ID from the admin panel
   - Update `API_ENDPOINT` with your server's URL

## Running the Scanner

1. Start the scanner:
   ```bash
   python3 rfid_scanner.py
   ```

2. The script will:
   - Initialize the RFID reader
   - Wait for cards to be scanned
   - Send scans to the server
   - Provide feedback (success/error)

## Troubleshooting

1. Reader not detected:
   - Check wiring connections
   - Verify SPI is enabled
   - Try rebooting the Raspberry Pi

2. Network errors:
   - Check internet connection
   - Verify server URL is correct
   - Check server is running

3. Invalid scans:
   - Verify RFID cards are compatible (13.56MHz)
   - Check if card is registered in the system
   - Try scanning more slowly

## API Protocol

The scanner communicates with the server using HTTP POST requests:

Endpoint: `POST /api/rfid-scan`

Request body:
```json
{
  "rfidId": "CARD_ID",
  "deviceId": "DEVICE_ID"
}
```

Success response (201):
```json
{
  "message": "Attendance recorded successfully",
  "attendanceRecord": {
    "student": {
      "name": "Student Name",
      "studentId": "STU001"
    },
    "class": {
      "name": "Class Name"
    },
    "status": "present",
    "time": "2024-01-20T09:15:30.000Z"
  }
}
```

Error response (4xx/5xx):
```json
{
  "message": "Error message"
}
```

## Security Considerations

1. Physical Security:
   - Mount the reader securely
   - Protect wiring from tampering
   - Consider using a case

2. Network Security:
   - Use HTTPS for production
   - Consider implementing device authentication
   - Regularly update software

3. Data Security:
   - Don't store sensitive data on the device
   - Clear variables after use
   - Handle errors gracefully

## Maintenance

1. Regular checks:
   - Test reader functionality
   - Check network connectivity
   - Verify server communication

2. Updates:
   - Keep system packages updated
   - Check for script updates
   - Monitor server changes

3. Monitoring:
   - Check logs for errors
   - Monitor scan success rate
   - Track network reliability 