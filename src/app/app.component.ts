import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard/scoreboard.component.html',
  styleUrls: ['./scoreboard/scoreboard.component.scss']
})
export class AppComponent {
  title = 'ecm2434-client';
}
