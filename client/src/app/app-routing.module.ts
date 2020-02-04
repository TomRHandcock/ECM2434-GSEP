import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerMainComponent } from './player-main/player-main.component';


const routes: Routes = [
  { path: 'player', component: PlayerMainComponent },
  { path: '', redirectTo: '/player', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
