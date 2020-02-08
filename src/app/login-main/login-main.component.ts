import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-main',
  templateUrl: './login-main.component.html',
  styleUrls: ['./login-main.component.scss']
})

export class LoginMainComponent implements OnInit {

  loginEmail: string;
  loginPassword: string;
  creatingAccount: boolean;
  createEmail: string;
  createPassword: string;
  createConfirmPassword: string;

  constructor(public authentication: AngularFireAuth) {
    // Alex - Intellij wanted me to do this for some reason...
    this.creatingAccount = false;
  }

  ngOnInit() {
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
    this.authentication.auth.signInWithEmailAndPassword(this.loginEmail, this.loginPassword).then(
      (credential) => {
        window.location.assign('./player');
      },
      (reason) => {
        console.log('Login failed: ' + reason);
      }
    );
  }

  onCreatePressed() {
    this.creatingAccount = true;
  }

  onCreationPressed() {
    if (this.createPassword === this.createConfirmPassword) {
      this.authentication.auth.createUserWithEmailAndPassword(this.createEmail, this.createPassword).then(
        (credential) => {
          window.location.assign('./player');
        },
        (reason) => {
          console.log('Creation of account failed with reason: ' + reason);
        }
      );
    }
  }

}
