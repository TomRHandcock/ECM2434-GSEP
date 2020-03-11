import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireDatabase} from '@angular/fire/database';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {Router} from '@angular/router';
import * as shortid from 'shortid';
import {Game} from '../database.schema';
import {isNullOrUndefined} from 'util';
import DataSnapshot = firebase.database.DataSnapshot;

enum Screen {
  CREATING_ACCOUNT,
  PRIVACY_POLICY,
  LOGIN,
  TEAM_ID
}

@Component({
  selector: 'app-login-main',
  templateUrl: './login-main.component.html',
  styleUrls: ['./login-main.component.scss']
})
export class LoginMainComponent implements OnInit, AfterViewInit {
  // So HTML can access it
  Screens = Screen;
  objectKeys = Object.keys;

  screen = Screen.LOGIN;
  loginEmail: string;
  loginPassword: string;
  createEmail: string;
  createPassword: string;
  createConfirmPassword: string;
  loginError: LoginError = LoginError.None;
  /**
   * A list of all games and their teams in the database
   */
  games: { [gameId: string]: [{ teamId: string, teamName: string }] };

  teamId: string = null;
  gameId: string = null;

  spinnerIcon = faSpinner;

  /**
   * Called on selecting a team from the drop down list. Unmarshals the selected team's data.
   * @param newTeamData string containing the game ID and team ID
   */
  set selectedTeam(newTeamData: string) {
    const data = newTeamData.split('\t');
    this.gameId = data[0];
    this.teamId = data[1];
  }

  /**
   * Whether the view is still loading or not
   */
  loading = true;

  /**
   * Whether or not to show the help modal dialog.
   */
  showHelpModal = false;

  constructor(private afAuth: AngularFireAuth,
              private db: AngularFireDatabase,
              private router: Router) {
  }

  /**
   * Runs when the page is loaded and finds all teams
   * @author AlexWesterman
   */
  ngOnInit() {
    this.findTeams();
  }

  /**
   * Runs after the view loads and, if the player is logged in, transfers them to the game ID screen
   * @author TomRHandcock, AlexWesterman
   */
  ngAfterViewInit() {
    // This function will redirect an already logged in user to the player screen
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.changeScreen(Screen.TEAM_ID);
      }
    });

    setTimeout(() => {
      this.loading = false;
    }, 500
    );
  }

  /**
   * Changes the screen to a new screen
   * @param newScreen - the new screen to change to
   * @author AlexWesterman
   */
  changeScreen(newScreen: Screen) {
    this.screen = newScreen;
  }

  /**
   * This is a callback for when the login button is pressed, it handles the
   * login using just the email and password, if the login is successful then
   * the user will be redirected to the "player view" screen, if the login
   * is unsuccessful then an error message will be displayed.
   *
   * @author TomRHandcock
   */
  onLoginPressed() {
    try {
      this.afAuth.auth.signInWithEmailAndPassword(this.loginEmail, this.loginPassword).then(
        () => this.checkTeamAndRedirectPlayer()
      ).catch((reason) => {
        switch (reason.code) {
          case 'auth/invalid-email':
            alert('Invalid email');
            this.loginError = LoginError.InvalidEmail;
            break;
          case 'auth/argument-error':
            alert('Ensure all fields have been filled in');
            this.loginError = LoginError.ArgumentError;
            break;
          case 'auth/wrong-password':
            alert('Wrong password');
            this.loginError = LoginError.PasswordIncorrect;
            break;
          case 'auth/user-not-found':
            alert('No user with that email address');
            this.loginError = LoginError.EmailNotFound;
            break;
        }
      });
    } catch (error) {
      console.log(error);
      if (error.code === 'auth/argument-error') {
        alert('Please ensure all fields are filled');
      }
    }
  }

  onAnonymousSignIn() {
    this.afAuth.auth.signInAnonymously().then(() => {
      this.checkTeamAndRedirectPlayer();
    }).catch((reason) => {
      alert('Anonymous Sign in failed, error: ' + reason.code);
      console.log(reason);
    });
  }

  /**
   * Callback for when the account creation form is submitted, it first
   * verifies the inputted user credentials and then creates the user
   * account via Firebase. Upon successfully creating the account the
   * user is automatically logged in and redirected to the player view.
   * @author TomRHandcock, AlexWesterman
   */
  onCreationPressed() {
    // Check passwords have been entered and match
    if (this.createPassword === this.createConfirmPassword && this.createPassword && this.createConfirmPassword) {
      this.afAuth.auth.createUserWithEmailAndPassword(this.createEmail, this.createPassword).then(
        () => this.checkTeamAndRedirectPlayer(),
        reason => {
          alert('Creation of account failed with reason: ' + reason);
        }
      ).catch(reason => {
        if (reason.code === 'auth/invalid-email') {
          alert('Invalid email');
        }
      });
    } else {
      alert('Passwords must be non-empty and match');
    }
  }

  /**
   * Check if the user is already on a team.
   * If not, ask them for their team's ID.
   * @author galexite
   * Extended to add support for multiple games
   * @author TomRHandcock
   * @version 2
   */
  checkTeamAndRedirectPlayer() {
    const uid = this.afAuth.auth.currentUser.uid;

    if (this.teamId) {
      console.log(`Player ${uid}'s team is ${this.teamId} in game ${this.gameId}, redirecting to player view...`);
      this.router.navigate(['/game', this.gameId]);
    }

    console.log(`Checking ${uid} is already a member of an team in game ${this.gameId}...`);

    this.db.database.ref(`games/${this.gameId}/team/`)
      .once('value')
      .then((teams: DataSnapshot) => {
        teams.forEach((team: DataSnapshot) => {
          team.child('players').forEach((player: DataSnapshot) => {
            if (player.toJSON() as string === uid) {
              this.teamId = team.child('id').toJSON() as string;
              console.log(`Found player on team ${this.teamId} in game ${this.gameId}, redirecting to player view...`);
              this.router.navigate(['/game', this.gameId]);
            }
          });
        });

        if (!this.teamId) {
          console.log('teamId was not set, and couldn\'t find player on a team,' +
            'so redirecting user to Screen.TEAM_ID...');
          this.screen = Screen.TEAM_ID;
        }
      });
  }


  /**
   * Attach the team ID to the user's account to allocate them to a team.
   * @author galexite
   * Modified to make sure Firebase can recognise the 'players' as an Array on a new team.
   * This had to be modified due to the way the "CheckTeam" method in player-main works.
   * @author TomRHandcock
   * @version 2
   */
  onJoinTeam() {
    const uid = this.afAuth.auth.currentUser.uid;
    console.log(`Trying to join game ${this.gameId} on team ${this.teamId}...`);

    this.db.database.ref(`games/${this.gameId}/team/`).once('value')
      .then(snapshot => {
        if (!snapshot.child(this.teamId).exists()) {
          alert('This team does not exist!');
        } else {
          // Team exists, add the player to the team
          this.db.database.ref(`games/${this.gameId}/players/${uid}`)
            .set(uid)
            .catch(error => {
              alert('Unable to add you to the selected game, reason: ' + error);
            });
          // Get the player's list of the team the user inputted
          this.db.database.ref('games/' + this.gameId + '/team/' + this.teamId +
            '/players').once('value').then(data => {
            const currentCount = data.val();
            // Get the index for the player in the players list
            let index;
            if (currentCount == null) {
              // If it is empty start the list at 0
              index = 0;
            } else {
            // Otherwise, get the length
            index = currentCount.length;
          }
          // Insert the player into the team
            this.db.database.ref('games/' + this.gameId + '/team/' + this.teamId + '/players/' + index)
              .set(uid).then(() => {
              this.checkTeamAndRedirectPlayer();
            });
        });
      }
    });
  }

  /**
   * Called when the user selects the 'Create a new game...' button to allow them to create their
   * own custom games (and therefore become a gamemaster for this game).
   * @author galexite
   */
  onCreateNewGame() {
    // The current user's UID.
    const uid = this.afAuth.auth.currentUser.uid;
    // The new game ID.
    const id = shortid.generate();

    this.db.database.ref(`/games/${id}`)
      .set(new Game(id, uid))
      .then(() => this.router.navigate(['/game', id, 'gamemaster']))
      .catch(error => alert('Couldn\'t create your game! Try reloading the page. Error: ' + error));
  }

  /**
   * Find all teams in the database
   * @author AlexWesterman
   */
  findTeams() {
    const foundGames = {};

    // Loop through all games and find all teams
    this.db.list('/games/').valueChanges().subscribe((games: any) => {
      games.forEach((game: Game) => {
        if (isNullOrUndefined(game.id)) {
          return; // We don't want to add an undefined entry to this list!
        }
        foundGames[game.id] = [];
        // If there are not teams, ignore
        if (game.team) {
          for (const teamId of Object.keys(game.team)) {
            foundGames[game.id].push({teamId, teamName: game.team[teamId].name});
          }
        }
      });
    });
    this.games = foundGames;
  }
}

export enum LoginError {
  None,
  EmailNotFound = 'Email not found',
  PasswordIncorrect = 'Password Incorrect',
  InvalidEmail = 'Invalid Email',
  ArgumentError = 'Argument Error'
}
