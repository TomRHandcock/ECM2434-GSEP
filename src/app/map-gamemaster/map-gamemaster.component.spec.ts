import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapGamemasterComponent } from './map-gamemaster.component';

describe('MapGamemasterComponent', () => {
  let component: MapGamemasterComponent;
  let fixture: ComponentFixture<MapGamemasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapGamemasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapGamemasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
