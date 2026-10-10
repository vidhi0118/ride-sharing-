import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveTrack } from './live-track';

describe('LiveTrack', () => {
  let component: LiveTrack;
  let fixture: ComponentFixture<LiveTrack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTrack]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveTrack);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
