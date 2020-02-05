import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerMainComponent } from './player-main/player-main.component';
import { GamemasterMainComponent } from './gamemaster-main/gamemaster-main.component';


@NgModule({
  declarations: [
    AppComponent,
    PlayerMainComponent,
    GamemasterMainComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
