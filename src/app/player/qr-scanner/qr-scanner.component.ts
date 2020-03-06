import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {QrScannerComponent} from 'ang-qrscanner';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss']
})
export class PlayerQrScannerComponent implements AfterViewInit {

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  /**
   * Code scanned as a string.
   */
  @Output() qrCode = new EventEmitter<string>();

  constructor() {
  }

  ngAfterViewInit(): void {
    this.openCamera();
  }

  /**
   * Opens the user's camera
   * @author OGWSaunders
   *
   * Moved to qr-scanner component
   * @author galexite
   * @version 2
   */
  openCamera() {
    this.qrScannerComponent.getMediaDevices().then(devices => {
      const videoDevices: MediaDeviceInfo[] = [];
      for (const device of devices) {
        if (device.kind.toString() === 'videoinput') {
          videoDevices.push(device);
        }
      }
      if (videoDevices.length > 0) {
        let choosenDev;
        for (const dev of videoDevices) {
          if (dev.label.includes('front')) {
            choosenDev = dev;
            break;
          }
        }
        if (choosenDev) {
          this.qrScannerComponent.chooseCamera.next(choosenDev);
        } else {
          this.qrScannerComponent.chooseCamera.next(videoDevices[0]);
        }
      }
    });

    this.qrScannerComponent.capturedQr.subscribe(this.qrCode.emit);
  }

}
