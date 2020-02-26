import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

enum Screen {
  CREATING_ACCOUNT,
  PRIVACY_POLICY,
  LOGIN
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

  constructor(public authentication: AngularFireAuth) {
    this.screen = Screen.LOGIN;
  }

  /**
   * Runs when the page is loaded
   * @author TomRHandcock
   */
  ngOnInit() {
    // This function will redirect an already logged in user to the player screen
    this.authentication.auth.onAuthStateChanged((user) => {
      if (user) {
        window.location.assign('./player');
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
        () => {
          window.location.assign('./player');
       }
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
        () => {
          // Go to the player view
          window.location.assign('./player');
        },
        (reason) => {
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
}

export enum LoginError {
  None,
  EmailNotFound = 'Email not found',
  PasswordIncorrect = 'Password Incorrect',
  InvalidEmail = 'Invalid Email',
  ArgumentError = 'Argument Error'
}
