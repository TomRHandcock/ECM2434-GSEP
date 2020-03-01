import { Component, OnInit, ViewChild } from '@angular/core';

import { faCamera, faGlobe, faHome } from '@fortawesome/free-solid-svg-icons';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import {QrScannerComponent} from 'ang-qrscanner';
import {Location, Question, Team} from '../gamemaster-main/gamemaster-main.component';
import {AngularFireDatabase} from '@angular/fire/database';

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

export class PlayerMainComponent implements OnInit {
  // Re-export Font Awesome icons for use in HTML
  scanQrCodeIcon = faCamera;
  visitWebsiteIcon = faGlobe;
  homeIcon = faHome;

  screens = Screen;
  screen;
  score: number;

  questions: { [loc: string]: Array<Question> };
  currQuestion: {num: number, question: string, answers: string[], correct: number};

  showMenu = false;

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  constructor(private db: AngularFireDatabase, private router: Router, private afAuth: AngularFireAuth) {
    this.score = 0;
    this.screen = this.screens.HOME;

    this.currQuestion = {num: null, question: null, answers: null, correct: null};

    this.questions = this.getQuestionsFromDatabase();
    console.log(this.questions);
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
      }
    });
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
        team.players.forEach(((playerID) => {
          if (user.uid === playerID) {
            isInTeam = true;
          }
        }));
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

    console.log(questions);

    return questions;
  }

  /**
   * Goes to the next question
   * @author AlexWesterman
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
    const location = 'Forum';
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
  }

  /**
   * Begins the answering questions routine
   * @author AlexWesterman
   */
  beingAnswering() {
    this.screen = this.screens.ANSWER_QS;
    this.nextQuestion();
  }

  /**
   * Finishes the quiz
   * @author AlexWesterman
   */
  finishQuiz() {
    /* TODO this should also show the player with their score for that round, and total score
        before then moving on */
    this.screen = this.screens.HOME;
  }
}
