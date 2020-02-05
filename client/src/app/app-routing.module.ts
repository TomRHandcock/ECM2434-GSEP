import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerMainComponent } from './player-main/player-main.component';
import { GamemasterMainComponent } from './gamemaster-main/gamemaster-main.component';


const routes: Routes = [
  { path: 'player', component: PlayerMainComponent },
  { path: 'gamemaster', component: GamemasterMainComponent },
  { path: '', redirectTo: '/player', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
