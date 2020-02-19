import { Component, OnInit } from '@angular/core';
import { faBars, faArrowLeft, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import {AngularFireDatabase, AngularFireList, SnapshotAction} from '@angular/fire/database';
import {Observable, throwError} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {FirebaseListObservable} from '@angular/fire/database-deprecated';

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
  Player,
  Location,
  Gamemaster,
  Team
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
  deleteIcon = faTrashAlt;

  showMenu: boolean;
  Screens = Screen;
  screen: Screen;
  questions: { [loc: string]: Array<Question> };

  constructor(public db: AngularFireDatabase, public auth: AngularFireAuth, private router: Router) {
    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.myQrData = this.qrComponent.myQrData;

    this.screen = this.Screens.NONE;
    this.showMenu = true;

    this.questions = this.getQuestionsFromDatabase();
   }

  ngOnInit() {
    this.auth.auth.onAuthStateChanged((loggedInUser) => {
      if (loggedInUser) {
        // There is a user logged in
        // Check the logged in user's id against the id's of all known gamemasters
        let gamemaster = false;
        this.db.list('/player/').valueChanges().subscribe((gamemasters) => {
          gamemasters.forEach((item: User, index ) => {
            if (loggedInUser.uid === item.uid) {
              console.log('Gamemaster');
              gamemaster = true;
            }
          });
          // If user is a gamemaster, do nothing else redirect them
          if (!gamemaster) {
            // window.location.assign('./player');
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
      locations.forEach((item: Location, index) => {
        questions[item.name] = item.questions;
      });
    });

    return questions;
  }

  /**
   * Requests a 'table' from the database
   * @param request - the 'table' to request
   * @return Observable<unknown[]>
   * @author AlexWesterman
   */
  getTableDatabase(request: DatabaseTables) {
    // Simply return that 'table'
    const path = request.toString().toLowerCase();
    return this.db.list('/' + path).valueChanges();
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
   * Show or hide the navbar menu
   * @author George White
   */
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  /**
   * Sign the user out of their account.
   * @author George White
   */
  signOut() {
    this.auth.auth.signOut().then(() => this.router.navigate(['login']));
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

    console.log(locQs);
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

  addNewQuestion(location: string) {
    const loc = this.questions[location];
    loc[loc.length] = {question: '', answer: {correct: '', incorrect0: '', incorrect1: '', incorrect2: ''}};
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
