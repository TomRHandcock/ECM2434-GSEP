import { Component, OnInit } from '@angular/core';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {AngularFireDatabase, AngularFireList, SnapshotAction} from '@angular/fire/database';
import {Observable, throwError} from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';

enum Screen {
  OVERVIEW,
  QUESTIONS,
  LOCATIONS,
  TEAMS,
  QR
}

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
  Screens = Screen;
  screen: Screen;

  dbData: string;

  constructor(public db: AngularFireDatabase, public auth: AngularFireAuth) {
    // Debug: console.log("Reached GameMasterMain Constructor");

    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.myQrData = this.qrComponent.myQrData;

    this.screen = this.Screens.OVERVIEW;
    this.showMenu = true;

    db.list('/')
      .valueChanges()
      .subscribe(res => {
        console.log(res);
      });
   }

  ngOnInit() {
    this.auth.auth.onAuthStateChanged((loggedInUser) => {
      if (loggedInUser) {
        // There is a user logged in
        // Check the logged in user's id against the id's of all known gamemasters
        let gamemaster = false;
        this.db.list('/player/').valueChanges().subscribe((gamemasters) => {
          gamemasters.forEach((item: User, index ) => {
            if (loggedInUser.uid === item.uid) {
              console.log('Gamemaster');
              gamemaster = true;
            }
          });
          // If user is a gamemaster, do nothing else redirect them
          if (!gamemaster) {
            window.location.assign('./player');
          }
        });
      } else {
        // No user is logged in, redirect them to login page
        window.location.assign('./login');
      }
    });
  }

  /**
   * Changes the screen
   * @param screen - the screen to change to
   * @author AlexWesterman
   */
  changeScreen(screen: Screen) {
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

export class User {
  uid: string;
  displayName: string;
}
