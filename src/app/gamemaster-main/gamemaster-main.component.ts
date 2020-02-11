import { Component, OnInit } from '@angular/core';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {throwError} from 'rxjs';

@Component({
  selector: 'app-gamemaster-main',
  templateUrl: './gamemaster-main.component.html',
  styleUrls: ['./gamemaster-main.component.scss']
})

export class GamemasterMainComponent implements OnInit {
  qrComponent: QRCodeComponent = null;
  myQrData: string = null;

  closeIcon = faArrowLeft;
  menuIcon = faBars;

  showMenu: boolean;
  screen: string;

  constructor() {
    // Debug: console.log("Reached GameMasterMain Constructor");

    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.myQrData = this.qrComponent.myQrData;

    this.screen = 'overview';
    this.showMenu = true;
   }

  ngOnInit() {
  }

  /**
   * Changes the screen
   * @param screen - the screen to change to
   * @author AlexWesterman
   */
  changeScreen(screen: string) {
    if (!screen || !(screen === 'overview' || screen === 'team' || screen === 'question' || screen === 'QRcode')) {
      throwError(screen + ' is not a valid screen type');
    }

    this.screen = screen;
  }

  /**
   * Show or hide the navbar menu
   * @author George White
   */
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}

export class QRCodeComponent {
  public myQrData = 'default';
  randInteger: number = null;

  constructor() {
    // Debug: console.log("Reached QRCode Constructor");

    this.createQrCode(999999999);
    this.myQrData = '[' + (this.randInteger).toString() + ']';
  }

  /**
   * Constructing QR Codes. A random number
   * is created and used for the QR Code used
   * within <qrcode> html tags.
   *
   * @param maxNum - upper limit for random number
   * @author OGWSaunders
   */
  createQrCode(maxNum: number) {
    this.randInteger = Math.floor(Math.random() * Math.floor(maxNum));
  }
}
