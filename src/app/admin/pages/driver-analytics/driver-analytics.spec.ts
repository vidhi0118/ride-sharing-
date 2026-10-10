import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverAnalytics } from './driver-analytics';

describe('DriverAnalytics', () => {
  let component: DriverAnalytics;
  let fixture: ComponentFixture<DriverAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
