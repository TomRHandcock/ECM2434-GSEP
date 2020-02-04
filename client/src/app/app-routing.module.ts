import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerMainComponent } from './player-main/player-main.component';


const routes: Routes = [
  {
    path: 'player',
    component: PlayerMainComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
