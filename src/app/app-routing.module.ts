import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PlayerMainComponent} from './player/player-main.component';
import {GamemasterMainComponent} from './gamemaster/gamemaster-main.component';
import {LoginMainComponent} from './login/login-main.component';


const routes: Routes = [
  {path: 'player', component: PlayerMainComponent},
  {path: 'gamemaster', component: GamemasterMainComponent},
  {path: 'login', component: LoginMainComponent},
  {path: '', redirectTo: '/login', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
