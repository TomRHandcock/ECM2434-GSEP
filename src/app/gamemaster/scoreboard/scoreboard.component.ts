import {Component, OnInit} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {Team} from '../../database.schema';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent implements OnInit {

  teams: Team[];

  constructor(public db: AngularFireDatabase) {
    this.db.list('games/0/team/').valueChanges().subscribe((teams: Team[]) => {
      this.teams = teams.sort(this.compare);
      console.log(this.teams);
    });
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
