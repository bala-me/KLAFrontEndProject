import { Component } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-fishbone-component',
  imports: [],
  templateUrl: './fishbone-component.html',
  styleUrl: './fishbone-component.css'
})
export class FishboneComponent {
  diagram: go.Diagram | undefined;

  ngOnInit() {
    this.initDiagram();
  }

  initDiagram() {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, 'fishboneDiagramDiv', {
      'undoManager.isEnabled': true,
      layout: $(go.TreeLayout, {
        angle: 180,
        arrangement: go.TreeLayout.ArrangementFixedRoots,
        layerSpacing: 30,
        nodeSpacing: 20,
        setsPortSpot: false,
        setsChildPortSpot: false
      })
    });

    this.diagram.nodeTemplate =
      $(go.Node, 'Horizontal',
        { locationSpot: go.Spot.Center },
        $(go.Shape, 'Rectangle',
          { fill: 'white', stroke: 'black', width: 80, height: 30 }),
        $(go.TextBlock,
          { margin: 5, editable: true },
          new go.Binding('text', 'key'))
      );

    this.diagram.linkTemplate =
      $(go.Link,
        { routing: go.Link.Orthogonal, corner: 10 },
        $(go.Shape, { strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'OpenTriangle' })
      );

    this.diagram.model = new go.TreeModel([
      { key: 'Effect', isRoot: true },
      { key: 'Cause 1', parent: 'Effect' },
      { key: 'Cause 2', parent: 'Effect' },
      { key: 'Cause 3', parent: 'Effect' },
      { key: 'Cause 4', parent: 'Effect' },
      { key: 'Subcause 1.1', parent: 'Cause 1' },
      { key: 'Subcause 1.2', parent: 'Cause 1' },
      { key: 'Subcause 2.1', parent: 'Cause 2' },
      { key: 'Subcause 3.1', parent: 'Cause 3' }
    ]);
  }
}
