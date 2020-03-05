import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {PlayerMainComponent} from './player/player-main.component';
import {GamemasterMainComponent} from './gamemaster/gamemaster-main.component';
import {LoginMainComponent} from './login/login-main.component';
import {MapComponent} from './common/map/map.component';
import {ScoreboardComponent} from './gamemaster/scoreboard/scoreboard.component';
import {NgxTimerModule} from 'ngx-timer';

import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
// Firebase modules
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireDatabaseModule} from '@angular/fire/database';
// Other modules and dependencies
import {QRCodeModule} from 'angularx-qrcode';
import {NgQrScannerModule} from 'ang-qrscanner';
import {QuizComponent} from './player/quiz/quiz.component';
import {PlayerQrScannerComponent} from './player/qr-scanner/qr-scanner.component';


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
    LoginMainComponent,
    ScoreboardComponent,
    MapComponent,
    AppComponent,
    QuizComponent,
    PlayerQrScannerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    FontAwesomeModule,
    QRCodeModule,
    NgQrScannerModule,
    ReactiveFormsModule,
    NgxTimerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
