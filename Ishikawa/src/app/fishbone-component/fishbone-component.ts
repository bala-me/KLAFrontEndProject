import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FishboneService } from '../fishboneservice';
import * as go from 'gojs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { InfoDialogComponent } from '../info-dialog/info-dialog';
import { NodeInfoDialog } from '../node-info-dialog/node-info-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(private fishboneService: FishboneService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(){

    this.fishboneService.nodeInfoRequested.subscribe(node => {
    const currentInfo = node.data.info || '';

    const dialogRef = this.dialog.open(NodeInfoDialog, {
      width: '350px',
      panelClass: 'square-dialog',
      data: { info: currentInfo }
    });

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result !== undefined) {
        this.fishboneService.updateNodeInfo(node, result);
      }
    });
  });

    this.fishboneService.setDeleteHandler(async (node: go.Node) => {
    let message = "Delete this node?";
    
    if (node.findTreeChildrenNodes().count > 0) {
      message = "This node has child nodes. Delete the node and ALL its children?";
      const confirmed = await this.dialog
      .open(ConfirmDialogComponent, {
        width: '350px',
        panelClass: 'square-dialog',
        data: { message }
      })
      .afterClosed()
      .toPromise();

      if (confirmed) {
        this.fishboneService.deleteNodeAndChildren(node);
      }
    }
    else{
      this.fishboneService.deleteNodeAndChildren(node);
    }

    
  });
  }
  ngAfterViewInit(): void {
    this.myDiagram = this.fishboneService.initDiagram(this.diagramDiv, undefined);
    this.loadSavedDiagrams();
    //this.resizeDiagram(); // initial sizing
  }

  
onSaveSuccess() {
  /*this.dialog.open(InfoDialogComponent, {
    width: '350px',
    data: { message: 'Diagram saved successfully!' }
  });*/
  this.snackBar.open('Diagram saved successfully', 'Close', {
    duration: 5000, // 5 seconds
    panelClass: ['snackbar-success'] // optional for styling
});
}

onUpdateSuccess() {
  // this.dialog.open(InfoDialogComponent, {
  //   width: '350px',
  //   data: { message: 'Diagram updated successfully!' }
  // });
  this.snackBar.open('Diagram updated successfully', 'Close', {
    duration: 5000, // 5 updated
    panelClass: ['snackbar-success'] // optional for styling
   });
}

onDeleteSuccess() {
  // this.dialog.open(InfoDialogComponent, {
  //   width: '350px',
  //   data: { message: 'Diagram deleted successfully!' }
  // });
   this.snackBar.open('Diagram deleted successfully', 'Close', {
    duration: 5000, // 5 updated
    panelClass: ['snackbar-success'] // optional for styling
   });
}

  // toolbar actions
  createNewDiagram(): void {
    this.fishboneService.createDefault();
    this.fishboneService.loadFromNested(this.fishboneService.getNestedModel());
    this.selectedDiagramId = '';    // clear selection
    this.newDiagramName = '';   
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
    if (sel instanceof go.Node) this.fishboneService.deleteNodeAndChildren(sel);
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

 loadSelectedDiagram(diagram: any): void {
  this.selectedDiagramId = diagram.id;
  this.newDiagramName = diagram.name;

  this.fishboneService.loadDiagramById(diagram.id).subscribe({
    next: () => {
      // model is set by the service already
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
        this.onSaveSuccess();
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
      this.onUpdateSuccess();
      //alert('Diagram updated successfully');
    },
    error: err => alert('Error updating diagram: ' + err)
  });
}

saveOrUpdateDiagram(): void {
  if (!this.newDiagramName) {
    alert('Please enter a diagram name');
    return;
  }

  if (this.selectedDiagramId) {
    // Update existing diagram
    this.updateCurrentDiagram();
  } else {
    // Save new diagram
    this.saveCurrentDiagram();
  }
}

deleteDiagram(diagram: any, event: MouseEvent): void  {
  event.stopPropagation(); // prevent tile click from firing
  
   const message = `Are you sure you want to delete "${diagram.name}"? This action cannot be undone.`;
    const confirmed = this.dialog
    .open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'square-dialog',
      data: { message }
    }).afterClosed();

  confirmed.subscribe(
    result => {
      if(result){
          this.fishboneService.deleteDiagram(diagram.id).subscribe({
          next: () => {
        
            this.loadSavedDiagrams();
            this.onDeleteSuccess();

            if (this.selectedDiagramId === diagram.id) {
              this.selectedDiagramId = '';
              this.newDiagramName = '';
              this.fishboneService.createDefault();
              this.fishboneService.loadFromNested(this.fishboneService.getNestedModel());
            }
          },
          error: err => alert(`Error deleting diagram: ${err}`)
    });
  }
});
}
}
