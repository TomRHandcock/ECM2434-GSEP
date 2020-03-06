import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {GamemasterMainComponent} from './gamemaster-main.component';

describe('GamemasterMainComponent', () => {
  let component: GamemasterMainComponent;
  let fixture: ComponentFixture<GamemasterMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GamemasterMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamemasterMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
