import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverRideControl } from './driver-ride-control';

describe('DriverRideControl', () => {
  let component: DriverRideControl;
  let fixture: ComponentFixture<DriverRideControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverRideControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverRideControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
