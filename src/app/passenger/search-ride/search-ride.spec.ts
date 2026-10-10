import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchRide } from './search-ride';

describe('SearchRide', () => {
  let component: SearchRide;
  let fixture: ComponentFixture<SearchRide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchRide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchRide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
