import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetRoute } from './set-route';

describe('SetRoute', () => {
  let component: SetRoute;
  let fixture: ComponentFixture<SetRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
