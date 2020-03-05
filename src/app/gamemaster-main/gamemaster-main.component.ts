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
  qrData: string = null;

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
  displayLocQr = false;

  constructor(public db: AngularFireDatabase, public auth: AngularFireAuth, private router: Router) {
    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.qrData = this.qrComponent.myQrData;

    this.screen = this.Screens.NONE;

    this.questions = this.getQuestionsFromDatabase();
    this.getTableFromDatabase(DatabaseTables.Location);
    this.getTableFromDatabase(DatabaseTables.Team);
   }

  /**
   * Called on construction
   * Checks that the user is authorised to be in the gamemaster view, or kicks them out
   * @author TomRHandcock
   */
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
   * @param tableName - the 'table' to request
   * @author AlexWesterman
   * @author TomRHandcock
   */
  getTableFromDatabase(tableName: DatabaseTables) {
    // Get the path for the table
    const path = tableName.toString().toLowerCase();

    // Get the actual contents
    this.db.list('/' + path + '/').valueChanges().subscribe((table) => {
      switch (path) {
        case 'location':
          this.locations = table;
          break;
        case 'team':
          this.teams = table;
          break;
        default:
          console.error(path + ' is not handled!');
      }
    });
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
    this.db.object('/team/' + this.teams.length).set({ID: this.teams.length, name: '', score: 0, players: []});
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
    // Find the index by name
    const locIndex: number = this.locations.map((e) => e.name).indexOf(location);
    this.locations.splice(locIndex, 1);
  }

  /**
   * Adds a new location
   * @author AlexWesterman
   */
  addNewLocation() {
    this.locations[this.locations.length] = {
      questions: [],
      name: '',
      latitude: 0,
      longitude: 0,
      qrCode: ''
    };
  }

  /**
   * Generates a new QR code
   * @author AlexWesterman
   */
  generateQRCode() {
    this.qrComponent = new QRCodeComponent();
    this.qrData = this.qrComponent.myQrData;
  }

  /**
   * Redirects to the player view
   * @author AlexWesterman
   */
  gotoPlayerView() {
    window.location.assign('./player');
  }

  /**
   * This method is used to display the QR code for locations
   * @param seed The name of the location (used for the QR seed)
   * @author TomRHandcock
   */
  displayLocQrCode(seed) {
    this.qrComponent = new QRCodeComponent();
    this.qrData = '[' + seed + ']';
    this.displayLocQr = true;
  }

  /**
   *  This method will copy the argument text to the user's clipboard.
   * @param str The string to copy to the clipboard.
   * @author TomRHandcock
   */
  copyText(str) {
    // Create a DOM element
    const textbox = document.createElement('textarea');
    // Set the value to the string to copy
    textbox.value = str;
    // 'Hide' the created element's style (not actually in the DOM yet)
    textbox.style.position = 'fixed';
    textbox.style.left = '0';
    textbox.style.top = '0';
    textbox.style.opacity = '0';
    // Add the element to the DOM
    document.body.appendChild(textbox);
    // Focus the element and select the text
    textbox.focus();
    textbox.select();
    // Copy the selected text
    document.execCommand('copy');
    // Get rid of the DOM element
    document.body.removeChild(textbox);
    document.getElementById('locCopyId').innerHTML = 'Copied!';
  }

  /**
   * This method saves the QR Code currently displayed in the location view.
   * @author TomRHandcock
   */
  saveQrCode() {
    // Get the canvas used to display the QR code
    const canvas = document.getElementsByClassName('qrcode')[0].firstChild as HTMLCanvasElement;
    // Convert canvas to image and open it in a new tab
    const img = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    window.open(img);
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

// Class definitions, relating to the database
export class User {
  ID: string;

  constructor(ID: string) {
    this.ID = ID;
  }
}

export class GameMaster extends User {
}

export class Player extends User {
}

export class Location {
  latitude: number;
  longitude: number;
  name: string;
  qrCode: string;
  questions: Question[];
  description: string;
  hint: string;
}

export class Question {
  question: string;
  answer: { [ans: string]: any };
}

export class Team {
  ID: number;
  name: string;
  score: number;
  players: Player[];
}
