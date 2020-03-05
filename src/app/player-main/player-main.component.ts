import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';

import {faCamera, faGlobe, faHome} from '@fortawesome/free-solid-svg-icons';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {QrScannerComponent} from 'ang-qrscanner';
import {Location, Question, Team} from '../gamemaster-main/gamemaster-main.component';
import {AngularFireDatabase} from '@angular/fire/database';
import {FormControl, FormGroup} from '@angular/forms';
import {FullscreenControl, Map as MapboxMap, Popup as MapboxPopup} from 'mapbox-gl';

enum Screen {
  ANSWER_QS,
  HOME,
  PROGRESS,
  QR_SCANNER
}

@Component({
  selector: 'app-player-main',
  templateUrl: './player-main.component.html',
  styleUrls: ['./player-main.component.scss']
})
export class PlayerMainComponent implements OnInit, AfterViewInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  homeIcon = faHome;

  screens = Screen;
  screen;
  score: number;
  user;
  answerForm;
  correctAnswer: number;
  roundScore: number;
  teamData;

  currTarget: {location: string, hint: string, description: string, showHint: boolean};

  isAGamemaster: boolean;

  questions: { [loc: string]: Array<Question> };
  currQuestion: {num: number, question: string, answers: string[], playerAnswer: string, correct: number};

  map: MapboxMap;
  mapFsControl: FullscreenControl;

  showMenu = false;

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  constructor(private db: AngularFireDatabase, private router: Router, private afAuth: AngularFireAuth) {
    this.score = 0;
    this.screen = this.screens.HOME;
    this.user = null;
    this.isAGamemaster = null;
    this.currQuestion = {num: null, question: null, answers: null, playerAnswer: null, correct: null};

    // TODO again, needs to be automatically assigned
    this.currTarget = {location: 'The Forum', hint: null, description: null, showHint: false};
    this.getLocation();

    this.questions = this.getQuestionsFromDatabase();
  }

  /**
   * Runs when the page is loaded
   * @author AlexWesterman
   */
  ngOnInit() {
    // This function will redirect an already logged in user to the player screen
    this.afAuth.auth.onAuthStateChanged((user: any) => {
      if (user) {
        this.checkTeam(user);
        this.checkGamemaster(user);
      }
    });

    this.answerForm = new FormGroup({
      answer: new FormControl(),
    });
    this.roundScore = 0;
    // Set some default values to stop the console errors screaming at you
    this.teamData = {name: '', score: 0, hintsUsed: 0, locationsCompleted: 0};
    // Then get the actual values
    this.getTeamStats();
  }

  /**
   * Add the campus polygons to the map
   * @author galexite
   */
  onMapLoad(map: MapboxMap) {
    map.addSource('campus', {
      type: 'geojson',
      data: '/assets/campus.geojson'
    });
    map.addLayer({
      id: 'campus',
      source: 'campus',
      type: 'fill',
      paint: {
        'fill-color': 'rgba(0,0,0,0.4)'
      }
    });
    map.addLayer({
      id: 'campus-labels',
      source: 'campus',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'name']
      }
    });
    map.on('click', 'campus', (event) => {
      new MapboxPopup()
        .setLngLat(event.lngLat)
        .setHTML(event.features[0].properties.name)
        .addTo(this.map);
    });
  }

  /**
   * Runs when the view is rendered, adds the Mapbox map
   * @author galexite
   */
  ngAfterViewInit() {
    this.map = new MapboxMap({
      container: 'mapSection',
      accessToken: 'pk.eyJ1IjoidG9tcmhhbmRjb2NrIiwiYSI6ImNrNjZpemRzMDA4Nmcza3A2ZXB4YzR3MDQifQ.ut4uLWl97TVdhGxP1TEgoQ',
      style: 'mapbox://styles/mapbox/navigation-guidance-day-v4',
      center: [-3.533636, 50.736],
      zoom: 15
    });
    this.mapFsControl = new FullscreenControl();
    this.map.addControl(this.mapFsControl);

    // Add the campus building GeoJSON dataset
    this.map.on('load', () => this.onMapLoad(this.map));
  }

  /**
   * Changes the screen
   * @param newScreen - the new screen to change to
   * @author AlexWesterman
   */
  changeScreen(newScreen: Screen) {
    this.screen = newScreen;
  }

  /**
   * Checks whether the user is part of a team. If they aren't, gives them a dialog box to do so
   * @param user - the user currently logged in
   * @author AlexWesterman
   */
  checkTeam(user: any) {
    // Check whether they are on a team or not
    this.db.list('/team/').valueChanges().subscribe((teams) => {
      let isInTeam = false;

      teams.forEach((team: Team) => {
        team.players.forEach((playerID) => {
          if (user.uid === playerID) {
            isInTeam = true;
          }
        });
      });

      // End as not necessary
      if (isInTeam) {
        return;
      }

      // Ask the user for their team ID
      const input: string = window.prompt('Please enter your team id: ');

      // User declined
      if (!input) {
        return;
      }

      try {
        const tID: number = Number(input);
        const team: Team = teams[tID] as Team;

        this.db.object('/team/' + tID + '/players/' + team.players.length).set(user.uid)
          .catch((err) => {
            window.alert('A database error occurred! ' + err);
          })
        ;
      } catch (e) {
        window.alert('Team ID must be a number and be an existing team!' + e);
        return;
      }
    });
  }

  /**
   * Opens the user's camera
   * @author OGWSaunders
   */
  openCamera() {
    this.qrScannerComponent.getMediaDevices().then(devices => {
      const videoDevices: MediaDeviceInfo[] = [];
      for (const device of devices) {
        if (device.kind.toString() === 'videoinput') {
          videoDevices.push(device);
        }
      }
      if (videoDevices.length > 0) {
        let choosenDev;
        for (const dev of videoDevices) {
          if (dev.label.includes('front')) {
            choosenDev = dev;
            break;
          }
        }
        if (choosenDev) {
          this.qrScannerComponent.chooseCamera.next(choosenDev);
        } else {
          this.qrScannerComponent.chooseCamera.next(videoDevices[0]);
        }
      }
    });

    this.qrScannerComponent.capturedQr.subscribe(result => {
      console.log(result);
    });
  }

  /**
   * Sends the user to the university page
   * @author OGWSaunders
   */
  openUniWebsite() {
    const win = window.open('https://www.exeter.ac.uk/students/', '_blank');
    win.focus();
  }

  /**
   * Sign the user out of their account.
   * @author George White
   */
  signOut() {
    this.afAuth.auth.signOut().then(() => this.router.navigate(['login']));
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
   * Goes to the next question
   * @author AlexWesterman
   * Minor revision: (Re)-enabling the answer upon a new question being displayed
   * @author TomRHandcock
   * @version 2
   */
  nextQuestion() {
    // Check screen is correct
    if (this.screen !== this.screens.ANSWER_QS) {
      console.warn('Next question is not applicable to this screen!');
      return;
    }

    // Either initialise or increment for next question index
    if (this.currQuestion.num == null) {
      this.currQuestion.num = 0;
    } else {
      this.currQuestion.num++;
    }

    // TODO once the QR scanner verifies the location, store the location in an instance var
    const location = 'The Forum';
    if (this.currQuestion.num >= this.questions[location].length) {
      this.finishQuiz();
      return;
    }

    const question = this.questions[location][this.currQuestion.num];
    const answers = question.answer;

    // Fill in the relevant information
    this.currQuestion.question = question.question;
    this.currQuestion.answers = [
      answers.correct,
      answers.incorrect0,
      answers.incorrect1,
      answers.incorrect2
    ];
    this.currQuestion.correct = answers.correct;

    // Shuffle the answer's position
    // A basic function that will sort (not the fairest but easily good enough for four elements)
    this.currQuestion.answers.sort(() => Math.random() - 0.5);
    // (Re)-enable the form answers
    this.correctAnswer = null;
    this.answerForm.controls.answer.reset();
    this.answerForm.controls.answer.enable();
  }

  /**
   * Begins the answering questions routine
   * @author AlexWesterman
   * @author TomRHandcock
   */
  beingAnswering() {
    this.changeScreen(this.screens.ANSWER_QS);
    /**
     * Note from Tom:
     * I know this is already been initialised but this is being re-initialised to
     * stop a potential exploit where the player answers a question correctly then
     * backs out to re-answer the same question to build up points.
     */
    this.roundScore = 0;
    this.nextQuestion();
  }

  /**
   * This method is called when the current round of quiz questions has been finished,
   * the player's team is then found and the score for that team is updated.
   * @author AlexWesterman
   * @author TomRHandcock
   */
  finishQuiz() {
    /* TODO this should also show the player with their score for that round, and total score
    before then moving on */

    // First find out which team the player is on, iterate through the teams
    this.db.database.ref('/team/').once('value').then((snapshotData) => {
      let teamID;
      snapshotData.forEach((dataSnapshot) => {
        // Iterate through the players on the team, find out if the current UID and any of the team UIDs match
        dataSnapshot.child('/players/').forEach((player) => {
          // Once we find one, make a note of the team ID
          if (player.toJSON().toString() === this.afAuth.auth.currentUser.uid) {
            teamID = dataSnapshot.key;
          }
        });
      });

      if (teamID == null) {
        // We haven't found a team that the player is on
        alert('Your team has not been found, please reload the application to join a team');
        this.score = this.screens.HOME;
        return;
      }

      let teamCurrentScore;
      // Find out the teams current score
      this.db.database.ref('/team/' + teamID + '/score').once('value').then((score) => {
        teamCurrentScore = score.toJSON();
        // Add the score obtained from this round to the score in the database
        this.db.database.ref('/team/' + teamID + '/score').set(teamCurrentScore + this.roundScore).then(() => {
          // Database updated -> Send the player on back home
          this.changeScreen(this.screens.HOME);
        });
      });
    });

    // Reset for next set of questions
    this.currQuestion = {num: null, question: null, answers: null, playerAnswer: null, correct: null};
  }

  /**
   * This method check the player answer and disables the form to prevent changing the answer
   * @author TomRHandcock
   */
  verifyAnswer() {
    // First we disable the form for more inputs
    this.answerForm.controls.answer.disable();
    // Set up variables for the player/correct answer
    const playerAnswer = this.answerForm.value.answer;
    let correctAnswer;
    // Find which answer index is the correct answer
    this.currQuestion.answers.forEach((item, index) => {
      if (item.toString() === this.currQuestion.correct.toString()) {
        correctAnswer = index;
      }
    });

    this.correctAnswer = correctAnswer;
    // Validate the answer
    if (playerAnswer === correctAnswer) {
      // Correct answer
      this.roundScore++;
    } else {
      // Incorrect answer
    }
  }

  /**
   * Returns whether the logged in player is a gamemaster
   * @param user - the current user logged in
   * @return boolean - whether the player is a gamemaster
   * @author AlexWesterman
   */
  checkGamemaster(user: any) {
    if (!user) {
      return false;
    }

    // Check each gamemaster id with this user's
    this.db.list('/gameMaster/').valueChanges().subscribe((gamemasters) => {
      let gamemaster = false;

      gamemasters.forEach((item: string) => {
        if (user.uid === item) {
          gamemaster = true;
        }
      });

      this.isAGamemaster = gamemaster;
    });
  }

  /**
   * Redirects to the gamemaster view, if the user is a gamemaster
   * An alert will pop up if they are not authorised
   * @author AlexWesterman
   */
  goToGamemaster() {
    if (this.isAGamemaster) {
      window.location.assign('./gamemaster');
    } else {
      window.alert('You are not authorised to go to the gamemaster control view!');
    }
  }

  /**
   * Sets the location variables (such as description) to the player view
   * @author AlexWesterman
   */
  getLocation() {
    this.db.list('/location').valueChanges().subscribe((locations) => {
      locations.forEach((item: Location) => {
        if (item.name === this.currTarget.location) {
          console.log(item);
          this.currTarget.description = item.description;
          this.currTarget.hint = item.hint;
        }
      });
    });
  }

  /**
   * Shows a popup for confirmation and then shows the hint
   * @author AlexWesterman
   */
  showHint() {
    if (confirm('Are you sure you want to use a hint? (it will cost you score!)')) {
      this.currTarget.showHint = true;
      // TODO Deduct score here
    }
  }

  /**
   * This method obtains the teams current stats from the database.
   * @author TomRHandcock
   */
  getTeamStats() {
    // First, find the team's ID by looking for the player within a team
    this.db.database.ref('/team/').once('value').then((snapshotData) => {
      let teamID;
      snapshotData.forEach((dataSnapshot) => {
        // Iterate through the players on the team, find out if the current UID and any of the team UIDs match
        dataSnapshot.child('/players/').forEach((player) => {
          // Once we find one, make a note of the team ID
          if (player.toJSON().toString() === this.afAuth.auth.currentUser.uid) {
            teamID = dataSnapshot.key;
          }
        });
      });

      if (teamID == null) {
        // We haven't found a team that the player is on
        alert('Your team has not been found, please reload the application to join a team');
        return;
      }

      // Find out the teams current score
      this.db.object('/team/' + teamID).valueChanges().subscribe((data) => {
        this.teamData = data;
        console.log(this.teamData);
      });
    });
  }
}
