import {Component, Input, OnInit} from '@angular/core';
import {Team} from '../../database.schema';
import { AngularFireDatabase } from '@angular/fire/database';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent implements OnInit {

  @Input() teams: Team[];
  db;
  gameId;

  constructor(private activatedRoute: ActivatedRoute, db: AngularFireDatabase) {
    this.db = db;
  }

  ngOnInit() {
    // Get the game ID
    const gameIdObservable = this.activatedRoute.paramMap.pipe(map(p => p.get('id')));
    gameIdObservable.subscribe(id => {
      this.gameId = id;
    });
    // Get an array of the teams
    this.db.list('games/' + this.gameId + '/team').valueChanges().subscribe((teams) => {
      // Remove the game masters' team
      teams.forEach((element, index) => {
        if (element.name === 'Gamemaster team') {
          teams.splice(index, 1);
        }
      });
      // Sort the teams
      this.teams = teams.sort(this.compare);
    });
  }

  /**
   * The compare function for sorting the teams array on the scoreboard.
   * @param a The first team
   * @param b The second team
   * @author TomRHandcock
   */
  compare(a, b) {
    if (a.score > b.score) {
      return -1;
    } else {
      return 1;
    }
  }

}
