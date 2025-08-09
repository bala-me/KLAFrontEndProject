import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FishboneService } from '../fishboneservice';
import * as go from 'gojs';

@Component({
  selector: 'app-fishbone',
  templateUrl: './fishbone-component.html',
  styleUrls: ['./fishbone-component.css']
})
export class FishboneComponent implements AfterViewInit {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  private myDiagram!: go.Diagram;

  constructor(private fishboneService: FishboneService) {}

  ngAfterViewInit(): void {
    this.myDiagram = this.fishboneService.initDiagram(this.diagramDiv, undefined);
    this.resizeDiagram(); // initial sizing
  }

  // toolbar actions
  createNewDiagram(): void {
    this.fishboneService.createDefault();
    this.fishboneService.loadFromNested(this.fishboneService.getNestedModel());
  }

  // expose nested data for debugging / saving
  getNestedJson(): any {
    return this.fishboneService.getNestedModel();
  }

  // Add child to selection (delegates to service)
  addChildSelected(): void {
    const sel = this.myDiagram.selection.first();
    if (sel instanceof go.Node) this.fishboneService.addChild(sel);
  }

  // Delete selected node (delegates)
  deleteSelected(): void {
    const sel = this.myDiagram.selection.first();
    if (sel instanceof go.Node) this.fishboneService.deleteNode(sel);
  }

  @HostListener('window:resize')
  resizeDiagram(): void {
    if (this.myDiagram) {
      // let the diagram container match viewport height (if you have toolbar height subtract it)
      const toolbarHeight = document.querySelector('.toolbar')?.clientHeight ?? 0;
      const height = window.innerHeight - toolbarHeight;
      this.myDiagram.div!.style.height = height + 'px';
      this.myDiagram.div!.style.width = window.innerWidth + 'px';
      this.myDiagram.requestUpdate();
    }
  }
}
