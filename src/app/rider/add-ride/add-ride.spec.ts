import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRide } from './add-ride';

describe('AddRide', () => {
  let component: AddRide;
  let fixture: ComponentFixture<AddRide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
