import {Component, Input, OnInit} from '@angular/core';
import {Team} from '../../database.schema';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent implements OnInit {

  @Input() teams: Team[];

  constructor() {
  }

  ngOnInit() {
  }

  compare(a, b) {
    if (a.score > b.score) {
      return -1;
    } else {
      return 1;
    }
  }

}
