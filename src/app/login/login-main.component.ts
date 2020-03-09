import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireDatabase} from '@angular/fire/database';

enum Screen {
  CREATING_ACCOUNT,
  PRIVACY_POLICY,
  LOGIN,
  TEAM_ID,
  GAME_ID
}

@Component({
  selector: 'app-login-main',
  templateUrl: './login-main.component.html',
  styleUrls: ['./login-main.component.scss']
})
export class LoginMainComponent implements OnInit {
  // So HTML can access it
  Screens = Screen;

  screen: Screen;
  loginEmail: string;
  loginPassword: string;
  createEmail: string;
  createPassword: string;
  createConfirmPassword: string;
  loginError: LoginError = LoginError.None;
  teamId = '';
  gameID: string;

  constructor(public authentication: AngularFireAuth, private db: AngularFireDatabase) {
    this.screen = Screen.LOGIN;
  }

  /**
   * Runs when the page is loaded
   * @author TomRHandcock
   */
  ngOnInit() {
    // This function will redirect an already logged in user to the player screen
    this.authentication.auth.onAuthStateChanged(user => {
      if (user) {
        this.checkTeamAndRedirectPlayer(this.db);
      }
    });
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
      this.authentication.auth.signInWithEmailAndPassword(this.loginEmail, this.loginPassword).then(
        () => this.checkTeamAndRedirectPlayer(this.db)
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
      switch (error.code) {
        case 'auth/argument-error':
          alert('Please ensure all fields are filled');
          break;
      }
    }
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
      this.authentication.auth.createUserWithEmailAndPassword(this.createEmail, this.createPassword).then(
        () => this.checkTeamAndRedirectPlayer(this.db),
        reason => {
          alert('Creation of account failed with reason: ' + reason);
        }
      ).catch(reason => {
        switch (reason.code) {
          case 'auth/invalid-email':
            alert('Invalid email');
            break;
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
  checkTeamAndRedirectPlayer(db: AngularFireDatabase) {
    let teams;
    let players;
    db.database.ref('games').once('value').then((games) => {
      // First we get all the games available
      games.forEach((game) => {
       players = game.child('players');
       // For each game we look at the players in that game
       players.forEach((player) => {
        // We find if they are in that game
        if (player.toJSON().toString() === this.authentication.auth.currentUser.uid) {
          // We found the current user in this game
          this.gameID = game.child('ID').toJSON().toString();
          // Now we need to find the team the current player is on
          teams = game.child('team');
          teams.forEach((team) => {
            // Array of players on a team
            const teamPlayers = team.child('players');
            teamPlayers.forEach((teamPlayer) => {
              if (teamPlayer.toJSON().toString() === this.authentication.auth.currentUser.uid) {
                // We found the team the player is on
                console.log('Redirecting to player screen');
                window.location.assign('./player');
                return;
              }
            });
          });
          if (!this.teamId) {
            // We couldn't find the team the player was on
            console.log('Redirecting to select team');
            this.screen = Screen.TEAM_ID;
            return;
          }
        }
       });
      });
      if (!this.gameID) {
        // We haven't found a game with the player in
        console.log('Redirecting to game selection');
        this.screen = Screen.GAME_ID;
      }
    });
  }


  /**
   * Callback for adding the player's team ID.
   * @author galexite
   * Modified to make sure Firebase can recognise the 'players' as an Array on a new team.
   * This had to be modified due to the way the "CheckTeam" method in player-main works.
   * @author TomRHandcock
   * @version 2
   */
  onJoinTeam() {
    this.db.database.ref('games/' + this.gameID + '/team/').once('value')
      .then((snapshot => {
        if (!snapshot.child(this.teamId).exists()) {
          alert('This team does not exist!');
          this.changeScreen(this.Screens.TEAM_ID);
        }
      }));

    // Get the player's list of the team the user inputted
    this.db.database.ref('games/' + this.gameID + '/team/' + this.teamId + '/players').once('value').then((data) => {
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
      this.db.database.ref('games/' + this.gameID + '/team/' + this.teamId + '/players/' + index)
      .set(this.authentication.auth.currentUser.uid).then(() => {
        this.checkTeamAndRedirectPlayer(this.db);
      });
    });
  }

  /**
   * Callback for joining a game
   * @author TomRHandcock
   */
  onJoinGame() {
    // Add the player to the game, once done, call the check team and redirect player method
    this.db.database.ref('games/' + this.gameID + '/players/').push(this.authentication.auth.currentUser.uid).then(() => {
      this.checkTeamAndRedirectPlayer(this.db);
    }).catch((error) => {
      alert('Unable to add you to the selected team, reason: ' + error);
    });
  }
}

export enum LoginError {
  None,
  EmailNotFound = 'Email not found',
  PasswordIncorrect = 'Password Incorrect',
  InvalidEmail = 'Invalid Email',
  ArgumentError = 'Argument Error'
}
