import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideOptions } from './ride-options';

describe('RideOptions', () => {
  let component: RideOptions;
  let fixture: ComponentFixture<RideOptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideOptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideOptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
