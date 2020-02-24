import { Component, OnInit } from '@angular/core';
import { faBars, faArrowLeft, faTrashAlt, faSort, faPen, faMapMarkerAlt, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

enum Screen {
  NONE,
  OVERVIEW,
  QUESTIONS,
  LOCATIONS,
  TEAMS,
  QR
}

// All the keys in the database
enum DatabaseTables {
  Player = 'player',
  Location = 'location',
  Gamemaster = 'gamemaster',
  Team = 'team'
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
  editIcon = faPen;
  deleteIcon = faTrashAlt;
  sortIcon = faSort;
  mapIcon = faMapMarkerAlt;
  qrCodeIcon = faQrcode;

  showMenu = false;
  Screens = Screen;
  screen: Screen;

  questions: { [loc: string]: Array<Question> };
  locations: Array<any>;
  teams: Array<any>;

  constructor(public db: AngularFireDatabase, public auth: AngularFireAuth, private router: Router) {
    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.myQrData = this.qrComponent.myQrData;

    this.screen = this.Screens.NONE;

    this.questions = this.getQuestionsFromDatabase();
    this.locations = this.getTableFromDatabase(DatabaseTables.Location, Location);
    this.db.list('/team/').valueChanges().subscribe((teams) => {this.teams = teams; });
    console.log(this.teams);
   }

  ngOnInit() {
    this.auth.auth.onAuthStateChanged((loggedInUser) => {
      if (loggedInUser) {
        // There is a user logged in
        // Check the logged in user's id against the id's of all known gamemasters
        let gamemaster = false;
        this.db.list('/gameMaster/').valueChanges().subscribe((gamemasters) => {
          gamemasters.forEach((item: string) => {
            console.log(loggedInUser.uid, item);
            console.log(1);
            if (loggedInUser.uid === item) {
              gamemaster = true;
            }
          });
          // If user is a gamemaster, do nothing else redirect them
          if (!gamemaster) {
            window.location.assign('./player');
          } else {
            // User is a gamemaster, load the UI
            this.changeScreen(this.Screens.OVERVIEW);
          }
        });
      } else {
        // No user is logged in, redirect them to login page
        window.location.assign('./login');
      }
    });
  }

  /**
   * Returns all questions stored in the database, nested by location
   * @return [loc: string]: Array<Question> - the (location,questions) pair for each location
   * @author AlexWesterman
   */
  getQuestionsFromDatabase() {
    // This will loop through each location and get the questions
    const questions: {[loc: string]: Array<Question>} = {};

    this.db.list('/location').valueChanges().subscribe((locations) => {
      locations.forEach((item: Location) => {
        questions[item.name] = item.questions;
      });
    });

    return questions;
  }

  /**
   * Requests a 'table' from the database and format it as an array of a class
   * @param table - the 'table' to request
   * @param cls - the class to return the list of
   * @return Array<cls[]> - the table representation
   * @author AlexWesterman
   * @author TomRHandcock
   */
  getTableFromDatabase(table: DatabaseTables, cls: any) {
    // Get the path for the table
    const path = table.toString().toLowerCase();
    const contents = Array<typeof cls>();

    // Get the table results and build an array of them
    this.db.list('/' + path).valueChanges().subscribe((records) => {
      records.forEach((item: any) => {
        contents.push(item);
      });
    });

    return contents;
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
   * Sign the user out of their account.
   * @author George White
   */
  signOut() {
    this.auth.auth.signOut().then(() => this.router.navigate(['login']));
  }


  /**
   * Deletes a team in the database.
   * @param id The ID of the team to delete
   * @author TomRHandcock
   */
  deleteTeam(id: number) {
    this.db.object('/team/' + id).remove();
  }

  /**
   * Deletes a question locally (does NOT delete from the database)
   * @param location - the location the question belongs to
   * @param question - the question to delete
   * @author AlexWesterman
   */
  deleteQuestion(location: string, question: string) {
    const locQs = this.questions[location];

    // Find and delete the question
    for (let i = 0; i < locQs.length; i++) {
      const q = locQs[i];
      if (q.question === question) {
        locQs.splice(i, 1);
      }
    }
  }

  /**
   * Converts a number to a string, for use in HTML
   * @param num - the number to convert
   * @return the converted string
   * @author AlexWesterman
   */
  numToString(num: number) {
    return num.toString();
  }


  /**
   * Adds a new team to the database
   * @author TomRHandcock
   */
  addNewTeam() {
    this.db.object('/team/' + this.teams.length).set({ID: this.teams.length, name: '', score: 0});
  }

  /**
   * Adds a new question to a given location
   * @param location - the location to add the question in to
   * @author AlexWesterman
   */
  addNewQuestion(location: string) {
    const loc = this.questions[location];
    loc[loc.length] = {question: '', answer: {correct: '', incorrect0: '', incorrect1: '', incorrect2: ''}};
  }

  /**
   * This method updates the team details in the database
   * @param id The Team id of the team to update
   * @author TomRHandcock
   */
  updateTeam(id) {
    this.db.object('/team/' + id).set(this.teams[id]);
  }

  /**
   * Deletes a given location
   * @param location - the location to delete
   * @author AlexWesterman
   */
  deleteLocation(location: string) {
    this.locations.splice(this.locations.indexOf(location), 1);
  }

  /**
   * Adds a new location
   * @author AlexWesterman
   */
  addNewLocation() {
    this.locations[this.locations.length] = {name: '', latitude: 0, longitude: 0, qrCode: ''};
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

// Class definitions, relating to the database
export class GameMaster {
  ID: string;
}

export class Player {
  public ID: string;
  public team: number;
}

export class Location {
  latitude: number;
  longitude: number;
  name: string;
  qrCode: string;
  questions: Question[];
}

export class Question {
  question: string;
  answer: { [ans: string]: any };
}

export class Team {
  ID: number;
  name: string;
  score: number;
}
