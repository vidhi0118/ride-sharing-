import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rides } from './rides';

describe('Rides', () => {
  let component: Rides;
  let fixture: ComponentFixture<Rides>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rides]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rides);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
