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
import { MatIconModule } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card'


@Component({
  selector: 'app-fishbone',
  imports: [FormsModule, CommonModule, MatIconModule, MatCard, MatCardContent],
  templateUrl: './fishbone-component.html',
  styleUrls: ['./fishbone-component.css']
})
export class FishboneComponent implements AfterViewInit {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;

  filterMode: 'mine' | 'all' = 'mine';
  displayedDiagrams: any[] = [];
  savedDiagrams: any[] = [];
  selectedDiagramId = '';
  newDiagramName = '';
  isEditing = false;

  private myDiagram!: go.Diagram;

  constructor(private fishboneService: FishboneService, private dialog: MatDialog, private snackBar: MatSnackBar) { }

  ngOnInit() {


    this.SubsribeToNodeInfoRequestedEvent();

    this.SetDeleteNodeHandler();
  }

  ngAfterViewInit(): void {
    this.myDiagram = this.fishboneService.initDiagram(this.diagramDiv, undefined);
    this.loadSavedDiagrams();
  }

  showMyDiagrams() {
    this.filterMode = 'mine';

    const length = this.savedDiagrams.length;
    this.displayedDiagrams = this.savedDiagrams.slice(Math.max(length - 5, 0), length);// bottom 5 only
    this.checkAndResetControls();
  }


  showAllDiagrams() {
    this.filterMode = 'all';

    this.displayedDiagrams = [...this.savedDiagrams]; // all items
    // Only exit editing if current selected diagram is not in filtered list
    this.checkAndResetControls();
  }

  private checkAndResetControls() {
    if (!this.displayedDiagrams.some(d => d.id === this.selectedDiagramId)) {
      this.isEditing = false;
      this.selectedDiagramId = '';
    }
  }

  // toolbar actions
  createNewDiagram(): void {
    this.fishboneService.createDefault();

    this.isEditing = true;

    this.selectedDiagramId = '';    // clear selection
    this.newDiagramName = '';

    // Set container size before layout:
    setTimeout(() => {
      this.myDiagram.layoutDiagram(true); // recompute positions
      this.myDiagram.centerRect(this.myDiagram.documentBounds); // center it
      this.fishboneService.loadFromNested(this.fishboneService.getNestedModel());
    }, 0);
  }

  loadSavedDiagrams(keepEditing = false): void {
    this.fishboneService.getSavedDiagrams().subscribe({
      next: diagrams => {
        this.savedDiagrams = diagrams;

        if (this.filterMode === 'mine') {
          this.showMyDiagrams();
        } else {
          this.showAllDiagrams();
        }
        // If keepEditing flag is true, don't kill edit mode
        if (!keepEditing && !this.displayedDiagrams.some(d => d.id === this.selectedDiagramId)) {
          this.isEditing = false;
        }
      },
      error: err => alert('Error loading diagrams: ' + err)
    });
  }

  loadSelectedDiagram(diagram: any): void {
    this.isEditing = true;
    this.selectedDiagramId = diagram.id;
    this.newDiagramName = diagram.name;

    this.fishboneService.loadDiagramById(diagram.id).subscribe({
      next: () => {
        // model is set by the service already
      },
      error: err => alert('Error loading diagram: ' + err)
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

  deleteDiagram(diagram: any, event: MouseEvent): void {
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
        if (result) {
          this.fishboneService.deleteDiagram(diagram.id).subscribe({
            next: () => {

              this.loadSavedDiagrams(true);
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

  private saveCurrentDiagram(): void {
    if (!this.newDiagramName) {
      alert('Please enter a name');
      return;
    }
    this.fishboneService.saveDiagram(this.newDiagramName).subscribe({
      next: (response) => {
        // Assume response.id contains the new diagram ID
        this.selectedDiagramId = response.id;
        this.loadSavedDiagrams(true); // reload list including the new one
        this.loadSelectedDiagram({ id: response.id, name: this.newDiagramName });
        this.onSaveSuccess();
      },
      error: err => alert('Error saving diagram: ' + err)
    });
  }

  private updateCurrentDiagram(): void {
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
        this.loadSavedDiagrams(true); // refresh list
        this.onUpdateSuccess();
        //alert('Diagram updated successfully');
      },
      error: err => alert('Error updating diagram: ' + err)
    });
  }
  private onSaveSuccess() {
    this.showMessage('Diagram Saved Successfully', 5000);
  }

  private onUpdateSuccess() {
    this.showMessage('Diagram updated successfully', 5000);
  }

  private onDeleteSuccess() {
    this.showMessage('Diagram deleted successfully', 5000);
  }
  private showMessage(message: string, duration: number) {
    this.snackBar.open(message, 'Close', {
      duration: duration, // 5 seconds
      panelClass: ['snackbar-success']
    });
  }

  private SetDeleteNodeHandler() {
    this.fishboneService.setDeleteHandler(async (node: go.Node) => {
      let message = "Delete this node?";


      if (node.findTreeChildrenNodes().count > 0) {
        if (node.isTreeRoot) {
          this.snackBar.open('Cannot delete the root node. You can delete the whole fishbone diagram on the left pane', 'Close', {
            duration: 5000,
            panelClass: ['red-snackbar']
          });
        }
        else {
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
      }
      else {
        this.fishboneService.deleteNodeAndChildren(node);
      }


    });
  }

  private SubsribeToNodeInfoRequestedEvent() {
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
  }
}
