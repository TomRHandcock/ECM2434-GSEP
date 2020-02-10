import { Component, OnInit } from '@angular/core';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {throwError} from 'rxjs';

@Component({
  selector: 'app-gamemaster-main',
  templateUrl: './gamemaster-main.component.html',
  styleUrls: ['./gamemaster-main.component.scss']
})

export class GamemasterMainComponent implements OnInit {
  closeIcon = faArrowLeft;
  menuIcon = faBars;

  showMenu: boolean;
  screen: string;

  constructor() {
    this.screen = 'overview';
    this.showMenu = true;
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

  ngOnInit() {
  }

}
