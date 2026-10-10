import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerPayments } from './passenger-payments';

describe('PassengerPayments', () => {
  let component: PassengerPayments;
  let fixture: ComponentFixture<PassengerPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerPayments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerPayments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
