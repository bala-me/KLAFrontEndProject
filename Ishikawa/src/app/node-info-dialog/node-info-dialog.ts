import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-node-info-dialog',
  templateUrl: './node-info-dialog.html',
  styleUrls: ['./node-info-dialog.css'],
  standalone: true,
  imports: [FormsModule, MatDialogContent, MatDialogActions]
})
export class NodeInfoDialog {
  infoText: string;

  constructor(
    public dialogRef: MatDialogRef<NodeInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { info: string }
  ) {
    this.infoText = data.info;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.infoText);
  }
}
