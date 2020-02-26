import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';

import { faCamera, faGlobe, faHome } from '@fortawesome/free-solid-svg-icons';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import {QrScannerComponent} from 'angular2-qrscanner';
import { Player, Team} from '../gamemaster-main/gamemaster-main.component';
import {AngularFireDatabase} from '@angular/fire/database';

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent implements OnInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  homeIcon = faHome;

  screen = 'home';
  score = 0;

  showMenu = false;

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  constructor(private db: AngularFireDatabase, private router: Router, private afAuth: AngularFireAuth) { }

  /**
   * Runs when the page is loaded
   * @author AlexWesterman
   */
  ngOnInit() {
    // This function will redirect an already logged in user to the player screen
    this.afAuth.auth.onAuthStateChanged((user: any) => {
      this.checkTeam(user);
    });
  }

  /**
   * Checks whether the user is part of a team. If they aren't, gives them a dialog box to do so
   * @param user - the user currently logged in
   * @author AlexWesterman
   */
  checkTeam(user: any) {
    // Check whether they are on a team or not
    this.db.list('/team/').valueChanges().subscribe((teams) => {
      let isInTeam = false;

      teams.forEach((team: Team) => {
        team.players.forEach(((player: Player) => {
          if (user.uid === player.ID) {
            console.log(true);
            isInTeam = true;
          }
        }));
      });

      // End as not necessary
      if (isInTeam) {
        return;
      }

      // Ask the user for their team ID
      const input: string = window.prompt('Please enter your team id: ');

      // User declined
      if (!input) {
        return;
      }

      try {
        const tID: number = Number(input);
        const team: Team = teams[tID] as Team;

        team.players.push(new Player(user.uid));
        this.db.object('/team/' + tID).set(team)
          .catch((err) => {
            window.alert('A database error occurred! ' + err);
          })
        ;
      } catch (e) {
        window.alert('Team ID must be a number and be an existing team!' + e);
        return;
      }
    });
  }

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

  /**
   * Opens the user's camera
   * @author OGWSaunders
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
   * Sends the user to the university page
   * @author OGWSaunders
   */
  openUniWebsite() {
    const win = window.open('https://www.exeter.ac.uk/students/', '_blank');
    win.focus();
  }

  /**
   * Sign the user out of their account.
   * @author George White
   */
  signOut() {
    this.afAuth.auth.signOut().then(() => this.router.navigate(['login']));
  }
}
