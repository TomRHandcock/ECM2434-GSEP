import { Component, OnInit } from '@angular/core';

// @ts-ignore
import { faCamera, faGlobe, faBars, faHome } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent implements OnInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  showProgressIcon = faBars;
  homeIcon = faHome;

  screen: string;
  score: number;

  constructor() {
    this.screen = 'home';
    this.score = 0;
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
   * Sets the screen to the home page
   * @author AlexWesterman
   */
  returnHome() {
    this.screen = 'home';
  }

  ngOnInit() {
  }

}
