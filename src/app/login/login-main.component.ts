import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { FirebaseDatabase } from '@angular/fire';

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
   */
  checkTeamAndRedirectPlayer(db: AngularFireDatabase) {
    db.database.ref('/team/').once('value').then(dataSnapshot => {
      dataSnapshot.forEach(team => team.child('/players/').forEach(player => {
        if (player.toJSON().toString() ===
            this.authentication.auth.currentUser.uid) {
          window.location.assign('./player');
        }
      }));

      // Ask the user for their Team ID
      this.changeScreen(Screen.TEAM_ID);
    });
  }


  /**
   * Callback for adding the player's team ID.
   * @author galexite
   */
  onJoinTeam() {
    this.authentication.user.subscribe(user => {
      this.db.database.ref('/team/' + this.teamId + '/players/')
        .push(user.uid)
        .then(() => this.checkTeamAndRedirectPlayer(this.db))
        .catch(error => alert('Couldn\'t add you to that team: ' + error));
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
