import { Component, OnInit } from '@angular/core';

// @ts-ignore
import { faCamera, faGlobe, faBars, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent implements OnInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  menuIcon = faBars;
  closeIcon = faArrowLeft;
  homeIcon = faHome;

  screen = 'home';
  score = 0;

  showMenu = false;

  constructor(private router: Router, private afAuth: AngularFireAuth) { }

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

  ngOnInit() {
  }

}
