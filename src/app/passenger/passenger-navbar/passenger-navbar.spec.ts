import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerNavbar } from './passenger-navbar';

describe('PassengerNavbar', () => {
  let component: PassengerNavbar;
  let fixture: ComponentFixture<PassengerNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
