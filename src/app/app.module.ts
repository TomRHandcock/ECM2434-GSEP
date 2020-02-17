import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerMainComponent } from './player-main/player-main.component';
import { GamemasterMainComponent } from './gamemaster-main/gamemaster-main.component';
import { LoginMainComponent } from './login-main/login-main.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Firebase modules
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { QRCodeModule } from 'angularx-qrcode';

const firebaseConfig = {
  apiKey: 'AIzaSyAL4V69MO2IiQtUgkAgDPlbrgX4Yu7-j9I',
  authDomain: 'exe-marks-the-spot.firebaseapp.com',
  databaseURL: 'https://exe-marks-the-spot.firebaseio.com',
  projectId: 'exe-marks-the-spot',
  storageBucket: 'exe-marks-the-spot.appspot.com',
  messagingSenderId: '737006524525',
  appId: '1:737006524525:web:0a2ccc985e00d0da120764'
};

@NgModule({
  declarations: [
    AppComponent,
    PlayerMainComponent,
    GamemasterMainComponent,
    LoginMainComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    FontAwesomeModule,
    QRCodeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
