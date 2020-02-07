import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-main',
  templateUrl: './login-main.component.html',
  styleUrls: ['./login-main.component.scss']
})

export class LoginMainComponent implements OnInit {

  loginEmail:string;
  loginPassword:string;
  constructor(public authentication: AngularFireAuth) {
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
    this.authentication.auth.signInWithEmailAndPassword(this.loginEmail,this.loginPassword).then(
      (credential) => {
        console.log("Logged in as: " + credential.user.email);
      },
      (reason) => {
        console.log("Login failed: " + reason);
      }
    );
  }

  onCreatePressed() {

  }

}
