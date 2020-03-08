import {AfterViewInit, Component, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {faMapMarkerAlt, faPen, faPlus, faQrcode, faSort, faTrashAlt} from '@fortawesome/free-solid-svg-icons';
import {AngularFireDatabase} from '@angular/fire/database';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {MapComponent} from '../common/map/map.component';
import * as mapboxgl from 'mapbox-gl';
import { LOCATION_INITIALIZED } from '@angular/common';
import { error } from 'protractor';

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
  Team = 'team',
  Lost = 'lost'
}


@Component({
  selector: 'app-gamemaster-main',
  templateUrl: './gamemaster-main.component.html',
  styleUrls: ['./gamemaster-main.component.scss']
})

export class GamemasterMainComponent implements OnInit, AfterViewInit {

  /**
   * Component for generating QR Codes
   */
  qrComponent: QRCodeComponent = null;

  /**
   * The qr code data that holds a location as a random number
   */
  qrData: string = null;


  /**
   * Icons for buttons and actions
   */
  plusIcon = faPlus;
  editIcon = faPen;
  deleteIcon = faTrashAlt;
  sortIcon = faSort;
  mapIcon = faMapMarkerAlt;
  qrCodeIcon = faQrcode;

  @ViewChildren(MapComponent) mapComponent: MapComponent;

  /**
   * Boolean for whether menu is shown on a screen
   */
  showMenu = false;

  /**
   * The set of screens in game master view
   */
  Screens = Screen;

  /**
   * The current screen that is in view
   */
  screen: Screen;

  /**
   * The list of questions for the questions screen
   */
  questions: { [loc: string]: Array<Question> };

  /**
   * The list of locations for the locations screen
   */
  locations: Array<any>;

  /**
   * The list of teams for the teams screen
   */
  teams: Array<any>;

  /**
   * The list of lost teams that is shown in a dialog alert in game master
   */
  lostTeams: Array<any>;

  /**
   * Whether the QR Code dialog is shown for a location in locations screen
   */
  displayLocQr = false;

  /**
   * Whether the location description dialog is shown
   */
  displayLocDesc = false;

  /**
   * The currently selected location
   */
  selectedLocation;

  /**
   * Whether the Lost Team dialog is shown in the overview screen
   */
  displayLost = false;

  constructor(public db: AngularFireDatabase, public auth: AngularFireAuth, private router: Router) {
    // myQrData is shown on the Code
    this.qrComponent = new QRCodeComponent();
    this.qrData = this.qrComponent.myQrData;

    this.screen = this.Screens.NONE;
    this.lostTeams = [];

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
        this.db.list('games/0/gameMaster/').valueChanges().subscribe((gamemasters) => {
          gamemasters.forEach((item: string) => {
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
   * Starts the lost teams procedure, once the map has loaded
   * @author AlexWesterman
   */
  ngAfterViewInit() {
    this.onLostPlayer();
  }

  /**
   * Returns all questions stored in the database, nested by location
   * @return [loc: string]: Array<Question> - the (location,questions) pair for each location
   * @author AlexWesterman
   */
  getQuestionsFromDatabase() {
    // This will loop through each location and get the questions
    const questions: {[loc: string]: Array<Question>} = {};

    this.db.list('games/0/location').valueChanges().subscribe((locations: Location[]) => {
      locations.forEach((item: Location) => {
        questions[item.name] = item.questions || [];
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
    this.db.list('games/0/' + path + '/').valueChanges().subscribe((table) => {
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
    this.db.object('games/0/team/' + id).remove();
  }

  /**
   * Deletes a question locally
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

    this.updateQuestion(location);
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
   * @author TomRHandcock, OGWSaunders
   */
  addNewTeam() {
    const id = this.generateTeamID();
    this.db.object('games/0/team/' + id).set({
      ID: id,
      name: '',
      score: 0,
      players: [],
      currentTarget: 0,
      nextTarget: 0,
      hintsUsed: 0,
      locationsCompleted: 0
    });
  }

  /**
   * Subscribes the table of lost teams to the game master component
   * AlexWesterman - adjusted to use an Array representation for lostTeams
   * @author OGWSaunders
   */
  onLostPlayer() {
    this.db.list('games/0/lost/').valueChanges().subscribe((lost) => {
      lost.forEach((lostTeam: Lost) => {
        this.lostTeams.push(
          {
            ID: lostTeam.ID,
            lat: lostTeam.lat,
            lon: lostTeam.lon
          }
        );

        // Lost players show up on gamemaster login
        this.displayLost = true;
      });

      // Show lost players on the map, if there are any
      if (this.lostTeams.length > 0) {
        this.showLostPlayersOnMap();
      }
    });
  }

  /**
   * Shows lost players on the overview map
   * @author AlexWesterman
   */
  showLostPlayersOnMap() {
    // Add each lost player as a marker
    this.lostTeams.forEach((lostTeam) => {
      const markerElem = document.createElement('div');
      markerElem.className = 'marker';

      // Getting 'add is not a function' error...
      this.mapComponent.add(markerElem, lostTeam.lat, lostTeam.lon);
    });
  }

  /**
   * Adds a new question to a given location
   * @param locationName - the location to add the question in to
   * @author AlexWesterman
   */
  addNewQuestion(locationName: string) {
    const sub = this.db.list('games/0/location/').valueChanges().subscribe((locations: Location[]) => {
      locations.forEach((item: Location, index: number) => {
        if (item.name === locationName) {
          this.addNewQuestionToLocation(index, item);
          // Cancel subscription to prevent unnecessary looping
          sub.unsubscribe();
        }
      });
    });
  }

  /**
   * Adds a new question to a location in the database
   * @param locationId - the location id
   * @param location - the location object
   * @author AlexWesterman
   */
  addNewQuestionToLocation(locationId: number, location: Location) {
    if (!location.questions) {
      location.questions = [];
    }

    this.db.object('games/0/location/' +  locationId + '/questions/' + location.questions.length).set({
      question: '',
      answer: {
        correct: '',
        incorrect0: '',
        incorrect1: '',
        incorrect2: ''
      }
    });
  }

  /**
   * Generates a new team ID for creating a team
   * @author OGWSaunders
   */
  generateTeamID() {
    const usedIDs: Array<number> = this.getUsedIDs();
    let randID = Math.floor(Math.random() * Math.floor(999));

    while (usedIDs.includes(randID)) {
      randID = Math.floor(Math.random() * Math.floor(999));
    }

    return randID;
  }

  /**
   * Finds all the currently used team IDs to ensure unique team ID
   * @author OGWSaunders
   */
  getUsedIDs() {
    const usedIDs = [];

    this.db.list('games/0/team/').valueChanges().subscribe((table) => {
      table.forEach((item: Team) => {
          usedIDs.push(item.ID);
      });
    });
    return usedIDs;
  }

  /**
   * Updates the question in the database
   * @param locationName - the location name
   * @author AlexWesterman
   */
  updateQuestion(locationName: string) {
    const sub = this.db.list('games/0/location/').valueChanges().subscribe((locations: Location[]) => {
      locations.forEach((item: Location, index: number) => {
        if (item.name === locationName) {
          this.db.object('games/0/location/' + index + '/questions/').set(this.questions[locationName]);
          sub.unsubscribe();
        }
      });
    });
  }


  /**
   * This method updates the team details in the database
   * @param id The Team id of the team to update
   * @author TomRHandcock, OGWSaunders
   */
  updateTeam(id) {
    this.teams.forEach(element => {
      if (element.ID === id) {
        this.db.object('games/0/team/' + element.ID).set(element);
      }
    });
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
   * This method is called when the user selects the "Edit Description" button
   * for a location.
   * @param location The location object which has been selected.
   * @author TomRHandcock
   */
  editLocation(location) {
    this.displayLocDesc = true;
    this.selectedLocation = location;
  }

  /**
   * This method is called when the user presses the "Submit" button in the
   * edit location dialog of the game master.
   * @author TomRHandcock
   */
  onSubmitEditLocation() {
    // Find the location we should be editing
    this.db.database.ref('games/0/location/').once('value').then((locations) => {
      let locationID;
      locations.forEach((location) => {
        // If we find the location, take note of the location ID
        if (location.child('name').toJSON().toString() === this.selectedLocation.name) {
          locationID = location.key;
        }
      });
      if (locationID) {
        // Found a matching location, update it
        this.db.database.ref('games/0/location/' + locationID).set(this.selectedLocation).catch((dbError) => {
          console.error('Error whilst updating database: ' + dbError);
        });
      } else {
        // Not found location, user needs to try again (most likely because the location name changed)
        console.error('Could not match currently selected location in the database. Please try again');
      }
    });
    this.displayLocDesc = false;
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

/**
 * This class creates QR Codes and allows them to be referenced via myQRData.
 * @author OGWSaunders
 */
export class QRCodeComponent {
  public myQrData = 'default';
  randInteger: number = null;

  constructor() {
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

export class Lost {
  ID: number;
  lat: number;
  lon: number;
}
