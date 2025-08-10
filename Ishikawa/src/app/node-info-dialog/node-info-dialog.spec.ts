import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeInfoDialog } from './node-info-dialog';

describe('NodeInfoDialog', () => {
  let component: NodeInfoDialog;
  let fixture: ComponentFixture<NodeInfoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeInfoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeInfoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
