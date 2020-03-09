import {Component, OnInit} from '@angular/core';

import {faCamera, faCompass, faGlobe, faHome} from '@fortawesome/free-solid-svg-icons';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, Router} from '@angular/router';
import {Location, Team, User} from '../database.schema';
import {AngularFireDatabase} from '@angular/fire/database';
import {map} from 'rxjs/operators';

enum Screen {
  ANSWER_QS,
  HOME,
  PROGRESS,
  QR_SCANNER,
  IM_LOST
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
  lostIcon = faCompass;

  screens = Screen;
  screen = Screen.HOME;

  /**
   * Current game ID. Taken from the route.
   */
  gameId = '';

  /**
   * This player's team ID.
   */
  teamId = '';

  /**
   * The player's team data.
   */
  teamData;

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
  isAGamemaster = false;

  /**
   * Whether or not to show the menu on a mobile device.
   */
  showMenu = false;

  /**
   * Whether or not to show the location as being reported to the gamemaster.
   */
  locationReported = false;

  /**
   * Has the player finished the quiz yet?
   */
  finishedQuiz = false;

  constructor(private activatedRoute: ActivatedRoute,
              private afAuth: AngularFireAuth,
              private db: AngularFireDatabase,
              private router: Router) {
  }

  ngOnInit() {
    // Get the gameId from the current route.
    const gameIdObservable = this.activatedRoute.paramMap.pipe(map(p => p.get('id')));
    gameIdObservable.subscribe(id => {
      this.gameId = id;
      this.checkUser();
    });
  }

  /**
   * Runs when the page is loaded
   * @author AlexWesterman
   */
  checkUser() {
    // This function will redirect an already logged in user to the player screen
    this.afAuth.auth.onAuthStateChanged((user: any) => {
      if (user) {
        this.checkTeam(user);
        this.checkGamemaster(user);
      }
    });

    // Set some default values to stop the console errors screaming at you
    this.teamData = new Team();
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
    this.db.list(`games/${this.gameId}/team/`).valueChanges().subscribe((teams) => {
      let currentTeam: Team;
      let isInTeam = false;
      teams.forEach((team: Team) => {
        try {
          team.players.forEach((playerID: User) => {
            console.log(playerID);
            if (user.uid === playerID.toString()) {
              currentTeam = team;
              isInTeam = true;
            }
          });
        } catch (error) {}
      });

      // End as not necessary
      if (isInTeam) {
        console.log('Found team');
        return;
      } else {
        this.router.navigate(['/login']);
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
    this.db.list(`games/${this.gameId}/gameMaster/`).valueChanges().subscribe((gamemasters) => {
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
   * Sets the location variables (such as description) to the player view
   * @author AlexWesterman
   * @author TomRHandcock
   */
  updateLocation() {
    this.db.database.ref(`games/${this.gameId}/location`).once('value').then((data) => {
      if (data.val().length <= this.teamData.locationsCompleted) {
        // Team has finished the game
        this.finishedQuiz = true;
      } else {
        // Team hasn't finished the game
        this.db.object(`games/${this.gameId}/location/${this.teamData.nextTarget}`)
          .valueChanges()
          .subscribe(location => this.currTarget = location as Location);
      }
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
    this.db.database.ref(`games/${this.gameId}/team/${this.teamId}/hintsUsed`).once('value').then((hints) => {
      teamCurrentHints = hints.toJSON();
      // Add the hint used to the database
      this.db.database.ref(`games/${this.gameId}/team/${this.teamId}/hintsUsed`).set(teamCurrentHints + 1).then(() => {
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
    this.db.database.ref(`games/${this.gameId}/team/${this.teamId}/score`).once('value').then(data => {
      teamCurrentScore = data.toJSON();
      // Add the score obtained from this round to the score in the database
      this.db.database.ref(`games/${this.gameId}/team/${this.teamId}/score`).set(teamCurrentScore + addition);
    });
  }

  /**
   * This method obtains the teams current stats from the database.
   * @author TomRHandcock
   */
  getTeamStats() {
    // First, find the team's ID by looking for the player within a team
    this.db.database.ref(`games/${this.gameId}/team/`).once('value').then((snapshotData) => {
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
      this.db.object(`games/${this.gameId}/team/${this.teamId}`).valueChanges().subscribe((data) => {
        this.teamData = data;
        console.log(this.teamData);
        this.updateLocation();
      });
    });
  }

  /**
   * Called when the quiz has finished, and the final score has been given
   * @param finalScore the finishing score of the quiz
   * @author galexite
   * Changed the method to update variables in the database rather than on the client.
   * @author TomRHandcock
   */
  onQuizFinalScore(finalScore: number) {
    // Add 1 to locations completed
    this.teamData.locationsCompleted++;
    // TODO: Randomise the next target to kne not already visited
    this.teamData.nextTarget++;
    // Update the team's score
    this.teamData.score += finalScore;
    // Update the database values
    this.db.database.ref(`games/${this.gameId}/team/${this.teamData.ID}`).set(this.teamData);
    // Update the location view
    this.updateLocation();
    // Go back home
    this.changeScreen(this.screens.HOME);
  }

  /**
   * Called when a QR code was successfully scanned, with the QR code.
   * @param qrCode the scanned QR code
   * @author galexite
   */
  onQrCodeScanned(qrCode: string) {
    if (qrCode === '[' + this.currTarget.name + ']') {
      this.changeScreen(Screen.ANSWER_QS);
    } else {
      alert('This isn\'t the right QR code for this location! Are you in the right place?');
      this.changeScreen(Screen.HOME);
    }
  }

  /**
   * Places the location of the current user in the lost section of the database, with
   * the team ID as reference to which team is reporting as being lost.
   *
   * @author OGWSaunders
   */
  getLostLocation() {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      this.db.database.ref(`games/${this.gameId}/lost/${this.teamData.ID}`).set({
        ID: this.teamId,
        lat,
        lon
      });
      this.locationReported = true;
    });
  }

}
