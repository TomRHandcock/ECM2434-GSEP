import {Component, OnInit, ViewChild} from '@angular/core';

import {faCamera, faGlobe, faHome} from '@fortawesome/free-solid-svg-icons';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {QrScannerComponent} from 'ang-qrscanner';
import {Location, Team} from '../gamemaster/gamemaster-main.component';
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
  user;
  teamId: string;
  teamData;

  /**
   * Object ID on the Firebase database for the current location.
   */
  currTargetId = 0;

  /**
   * Next location for the player to reach.
   */
  currTarget = new Location();

  /**
   * Whether or not the hint should be displayed.
   */
  isShowingHint = false;

  /**
   * Whether or not the player is a gamemaster (and thus whether they should have access to the gamemaster UI)
   */
  isAGamemaster: boolean;

  /**
   * Whether or not to show the menu on a mobile device.
   */
  showMenu = false;

  @ViewChild(QrScannerComponent, {static: false}) qrScannerComponent !: QrScannerComponent;

  constructor(private db: AngularFireDatabase, private router: Router, private afAuth: AngularFireAuth) {
    this.screen = this.screens.HOME;
    this.user = null;
    this.isAGamemaster = null;
    this.updateLocation(this.currTargetId);
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

    // Set some default values to stop the console errors screaming at you
    this.teamData = {name: '', score: 0, hintsUsed: 0, locationsCompleted: 0};
    // Then get the actual values
    this.getTeamStats();
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
  updateLocation(id: number) {
    this.db.object('/location/' + id).valueChanges().subscribe((item: Location) => {
      this.currTarget = item;
    });
  }

  /**
   * Shows a popup for confirmation and then shows the hint
   * @author AlexWesterman
   */
  showHint() {
    if (confirm('Are you sure you want to use a hint? (it will cost you score!)')) {
      this.isShowingHint = true;
      this.updateDatabaseHints();
    }
  }

  /**
   * Updates the hints used in the database, and subtracts points from the
   * team score in the database.
   * @author OGWSaunders
   *
   * Handle creation of QuizComponent
   * @author galexite
   * @version 2
   */
  updateDatabaseHints() {
    // Change score
    this.updatePlayerScore(-10);

    // Find out the teams current hints used
    let teamCurrentHints;
    this.db.database.ref('/team/' + this.teamId + '/hintsUsed').once('value').then((hints) => {
      teamCurrentHints = hints.toJSON();
      // Add the hint used to the database
      this.db.database.ref('/team/' + this.teamId + '/hintsUsed').set(teamCurrentHints + 1).then(() => {
        this.changeScreen(this.screens.HOME);
      });
    });
  }

  /**
   * Apply the player's score to the database by addition (can be negative).
   * @param addition the number to add to the player's score on the database
   * @author galexite
   */
  updatePlayerScore(addition: number) {
    let teamCurrentScore;
    // Find out the teams current score
    this.db.database.ref('/team/' + this.teamId + '/score').once('value').then(data => {
      teamCurrentScore = data.toJSON();
      // Add the score obtained from this round to the score in the database
      this.db.database.ref('/team/' + this.teamId + '/score').set(teamCurrentScore + addition);
    });
  }

  /**
   * This method obtains the teams current stats from the database.
   * @author TomRHandcock
   */
  getTeamStats() {
    // First, find the team's ID by looking for the player within a team
    this.db.database.ref('/team/').once('value').then((snapshotData) => {
      snapshotData.forEach((dataSnapshot) => {
        // Iterate through the players on the team, find out if the current UID and any of the team UIDs match
        dataSnapshot.child('/players/').forEach((player) => {
          // Once we find one, make a note of the team ID
          if (player.toJSON().toString() === this.afAuth.auth.currentUser.uid) {
            this.teamId = dataSnapshot.key;
          }
        });
      });

      if (this.teamId == null) {
        // We haven't found a team that the player is on
        alert('Your team has not been found, please reload the application to join a team');
        return;
      }

      // Find out the teams current score
      this.db.object('/team/' + this.teamId).valueChanges().subscribe((data) => {
        this.teamData = data;
        console.log(this.teamData);
      });
    });
  }

  /**
   * Called when the quiz has finished, and the final score has been given
   * @param finalScore the finishing score of the quiz
   * @author galexite
   */
  onQuizFinalScore(finalScore: number) {
    this.updateLocation(++this.currTargetId);
    this.changeScreen(this.screens.HOME);
  }
}
