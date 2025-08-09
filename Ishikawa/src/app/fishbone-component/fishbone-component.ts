import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FishboneService } from '../fishboneservice';
import * as go from 'gojs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fishbone',
  imports: [FormsModule, CommonModule],
  templateUrl: './fishbone-component.html',
  styleUrls: ['./fishbone-component.css']
})
export class FishboneComponent implements AfterViewInit {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;

  savedDiagrams: any[] = [];
  selectedDiagramId = '';
  newDiagramName = '';

  private myDiagram!: go.Diagram;

  constructor(private fishboneService: FishboneService) {}

  ngAfterViewInit(): void {
    this.myDiagram = this.fishboneService.initDiagram(this.diagramDiv, undefined);
    this.loadSavedDiagrams();
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

  loadSavedDiagrams(): void {
    this.fishboneService.getSavedDiagrams().subscribe({
      next: diagrams => this.savedDiagrams = diagrams,
      error: err => alert('Error loading diagrams: ' + err)
    });
  }

 loadSelectedDiagram(): void {
  const selected = this.savedDiagrams.find(d => d.id === this.selectedDiagramId);
  if (!selected) return;

  // Set name field so it auto-populates in input box
  this.newDiagramName = selected.name;

  this.fishboneService.loadDiagramById(this.selectedDiagramId).subscribe({
    next: (diagram: any) => {
      // Load into GoJS
      //const modelData = JSON.parse(diagram.jsonData);
     // this.myDiagram.model = go.TreeModel.fromJson(diagram.jsonData);
    },
    error: err => alert('Error loading diagram: ' + err)
  });
}

  saveCurrentDiagram(): void {
    if (!this.newDiagramName) {
      alert('Please enter a name');
      return;
    }
    this.fishboneService.saveDiagram(this.newDiagramName).subscribe({
      next: () => {
        this.newDiagramName = '';
        this.loadSavedDiagrams();
      },
      error: err => alert('Error saving diagram: ' + err)
    });
}

updateCurrentDiagram(): void {
  if (!this.selectedDiagramId) {
    alert('Please select a diagram to update');
    return;
  }
  if (!this.newDiagramName) {
    alert('Please enter a name for the diagram');
    return;
  }

  this.fishboneService.updateDiagram(this.selectedDiagramId, this.newDiagramName).subscribe({
    next: () => {
      this.loadSavedDiagrams(); // refresh list
      alert('Diagram updated successfully');
    },
    error: err => alert('Error updating diagram: ' + err)
  });
}
}
