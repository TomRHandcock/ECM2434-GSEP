import { Component, OnInit } from '@angular/core';

import { faCamera, faGlobe } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent implements OnInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;

  constructor() { }

  ngOnInit() {
  }

}
