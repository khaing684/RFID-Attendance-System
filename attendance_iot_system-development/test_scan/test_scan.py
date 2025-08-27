import sys
import requests
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QLineEdit, QPushButton, QVBoxLayout, QMessageBox
)

class RfidScanSimulator(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RFID Scan Simulator")

        self.rfid_label = QLabel("RFID ID:")
        self.rfid_input = QLineEdit()
        self.device_label = QLabel("Device ID:")
        self.device_input = QLineEdit()
        self.scan_button = QPushButton("Scan")
        self.scan_button.clicked.connect(self.send_scan)

        layout = QVBoxLayout()
        layout.addWidget(self.rfid_label)
        layout.addWidget(self.rfid_input)
        layout.addWidget(self.device_label)
        layout.addWidget(self.device_input)
        layout.addWidget(self.scan_button)
        self.setLayout(layout)

    def send_scan(self):
        rfid_id = self.rfid_input.text().strip()
        device_id = self.device_input.text().strip()
        if not rfid_id or not device_id:
            QMessageBox.warning(self, "Input Error", "Please enter both RFID ID and Device ID.")
            return

        url = "http://localhost:5000/api/rfid-scans/scan"
        payload = {"rfidId": rfid_id, "deviceId": device_id}
        try:
            response = requests.post(url, json=payload)
            if response.status_code in (200, 201):
                QMessageBox.information(self, "Success", f"Response: {response.json()}")
            else:
                QMessageBox.warning(self, "Error", f"Error {response.status_code}: {response.json()}")
        except Exception as e:
            QMessageBox.critical(self, "Request Failed", str(e))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = RfidScanSimulator()
    window.show()
    sys.exit(app.exec_())