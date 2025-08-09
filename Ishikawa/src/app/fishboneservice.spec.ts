import { TestBed } from '@angular/core/testing';

import { Fishboneservice } from './fishboneservice';

describe('Fishboneservice', () => {
  let service: Fishboneservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fishboneservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
