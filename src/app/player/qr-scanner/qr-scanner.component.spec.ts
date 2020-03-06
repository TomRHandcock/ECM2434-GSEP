import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PlayerQrScannerComponent} from './qr-scanner.component';

describe('QrscannerComponent', () => {
  let component: PlayerQrScannerComponent;
  let fixture: ComponentFixture<PlayerQrScannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerQrScannerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerQrScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
