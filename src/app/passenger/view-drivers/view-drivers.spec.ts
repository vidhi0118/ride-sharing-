import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDrivers } from './view-drivers';

describe('ViewDrivers', () => {
  let component: ViewDrivers;
  let fixture: ComponentFixture<ViewDrivers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDrivers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDrivers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
