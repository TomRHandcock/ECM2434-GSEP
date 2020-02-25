import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';

import { faCamera, faGlobe, faBars, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import {QrScannerComponent} from 'angular2-qrscanner';

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  menuIcon = faBars;
  closeIcon = faArrowLeft;
  homeIcon = faHome;

  screen = 'home';
  score = 0;

  showMenu = false;
  caseQR = null;

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  constructor(private router: Router, private afAuth: AngularFireAuth, private renderer: Renderer2) { }

  /**
   * Sets the screen to the progress page
   * TODO - if this function and the one below it stay as simplistic as this,
   *        we should consider just merging them into one function to change state
   * @author AlexWesterman
   */
  openProgress() {
    this.screen = 'progress';
  }

  /**
   * Sets the screen to the qrScanner page
   * @author OGWSaunders
   */
  openQrScanner() {
    this.screen = 'qrScanner';
  }

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
    this.qrScannerComponent.capturedQr.subscribe(result => {
      console.log(result);
    });
  }

  /**
   * Sets the screen to the home page
   * @author AlexWesterman
   */
  returnHome() {
    this.screen = 'home';
  }

  /**
   * Sign the user out of their account.
   * @author George White
   */
  signOut() {
    this.afAuth.auth.signOut().then(() => this.router.navigate(['login']));
  }
}
