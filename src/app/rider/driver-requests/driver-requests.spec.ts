import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverRequests } from './driver-requests';

describe('DriverRequests', () => {
  let component: DriverRequests;
  let fixture: ComponentFixture<DriverRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverRequests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
