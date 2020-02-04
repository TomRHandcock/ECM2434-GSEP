import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerMainComponent } from './player-main.component';

describe('PlayerMainComponent', () => {
  let component: PlayerMainComponent;
  let fixture: ComponentFixture<PlayerMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
