import { Component, AfterViewInit } from '@angular/core';
import * as go from 'gojs';
// @ts-ignore - no types for FishboneLayout
import { FishboneLayout, FishboneLink } from '../../assets/FishboneLayout.js';

@Component({
  selector: 'app-fishbone',
  templateUrl: './fishbone-component.html',
  styleUrls: ['./fishbone-component.css']
})
export class FishboneComponent implements AfterViewInit {

  private fishboneData = {
  text: 'Incorrect Deliveries',
  size: 18,
  weight: 'Bold',
  causes: [
    {
      text: 'Skills',
      size: 14,
      weight: 'Bold',
      causes: [
        {
          text: 'knowledge',
          weight: 'Bold',
          causes: [
            {
              text: 'procedures',
              causes: [
                { 
                  text: 'documentation',
                  causes: [
                    {
                      text: 'sub documentation'
                    }
                  ]
                }
              ]
            },
            { text: 'products' }
          ]
        },
        { text: 'literacy', weight: 'Bold' }
      ]
    },
    {
      text: 'Procedures',
      size: 14,
      weight: 'Bold',
      causes: [
        {
          text: 'manual',
          weight: 'Bold',
          causes: [{ text: 'consistency' }]
        },
        {
          text: 'automated',
          weight: 'Bold',
          causes: [{ text: 'correctness' }, { text: 'reliability' }]
        }
      ]
    },
    {
      text: 'Communication',
      size: 14,
      weight: 'Bold',
      causes: [
        { text: 'ambiguity', weight: 'Bold' },
        {
          text: 'sales staff',
          weight: 'Bold',
          causes: [
            {
              text: 'order details',
              causes: [{ text: 'lack of knowledge' }]
            }
          ]
        },
        {
          text: 'telephone orders',
          weight: 'Bold',
          causes: [{ text: 'lack of information' }]
        },
        {
          text: 'picking slips',
          weight: 'Bold',
          causes: [{ text: 'details' }, { text: 'legibility' }]
        }
      ]
    },
    {
      text: 'Transport',
      size: 14,
      weight: 'Bold',
      causes: [
        {
          text: 'information',
          weight: 'Bold',
          causes: [
            { text: 'incorrect person' },
            {
              text: 'incorrect addresses',
              causes: [
                {
                  text: 'customer data base',
                  causes: [
                    { text: 'not up-to-date' },
                    { text: 'incorrect program' }
                  ]
                }
              ]
            },
            { text: 'incorrect dept' }
          ]
        },
        {
          text: 'carriers',
          weight: 'Bold',
          causes: [{ text: 'efficiency' }, { text: 'methods' }]
        }
      ]
    }
  ]
};

private myDiagram!: go.Diagram;

  ngAfterViewInit(): void {
    this.initDiagram();
  }
  
  initDiagram(): void {

     // Define reusable context menu buttons
    const makeButton = (text: string, action: (e: go.InputEvent, obj: go.GraphObject) => void) =>
      $("ContextMenuButton",
        $(go.TextBlock, text),
        { click: action }
      );

    const $ = go.GraphObject.make;
    this.myDiagram = $(go.Diagram, 'myDiagramDiv', {
      'undoManager.isEnabled': true, 
      isReadOnly: false
    });

    const nodeMenu =
      $("ContextMenu",
        makeButton("Add Child", (e, obj) => {
          const node = (obj.part as go.Adornment)?.adornedPart;
          if (node instanceof go.Node) {
            this.myDiagram.startTransaction("add node");
            (this.myDiagram.model as go.TreeModel).addNodeData({
              text: "New Cause",
              parent: node.data.key
            });
            this.myDiagram.commitTransaction("add node");
          }
        }),
        makeButton("Delete", (e, obj) => {
          const node = (obj.part as go.Adornment)?.adornedPart;
          if (node instanceof go.Node) {
            this.myDiagram.startTransaction("delete node");
            this.myDiagram.remove(node);
            this.myDiagram.commitTransaction("delete node");
          }
        })
      );

    this.myDiagram.nodeTemplate =
      $(go.Node, 'Auto',
      { contextMenu: nodeMenu },
      $(go.Shape, 'RoundedRectangle', // Circle, Ellipse, Diamond, etc.
      {
        fill: '#e0f7fa',  // background color
        stroke: '#006064', // border color
        strokeWidth: 2
      }
      ),
        $(go.TextBlock,
          {
            editable: true // allow inline editing
          },
          new go.Binding('text').makeTwoWay(),
          new go.Binding('font', '', (data: any) => {
            const size = data.size ?? 13;
            const weight = data.weight ?? '';
            return `${weight} ${size}px sans-serif`;
          })
        )
      );

    this.myDiagram.linkTemplate =
      $(FishboneLink,

    $(go.Shape, { stroke: '#004d40', strokeWidth: 2 }), // link line
    $(go.Shape, { toArrow: 'Standard', stroke: null, fill: '#004d40' }) // arrowhead
      );

    function walkJson(obj: any, arr: any[]) {
      const key = arr.length;
      obj.key = key;
      arr.push(obj);
      if (obj.causes) {
        obj.causes.forEach((c: { parent: number; }) => {
          c.parent = key;
          walkJson(c, arr);
        });
      }
    }
    
    const json = this.fishboneData;
    const nodeDataArray: any[] = [];
    walkJson(json, nodeDataArray);
    this.myDiagram.model = new go.TreeModel(nodeDataArray);

    this.myDiagram.layout = $(FishboneLayout, {
      angle: 180,
      layerSpacing: 50,
      nodeSpacing: 40,
      rowSpacing: 40
    });

      // Listen for changes and update Angular object
  this.myDiagram.addModelChangedListener(e => {
    if (e.isTransactionFinished) {
      const updated = this.myDiagram.model.toJson();
      console.log('Updated JSON:', updated);
      // Optional: persist to Angular variable
      this.fishboneData = this.treeModelToNestedObject(this.myDiagram.model as go.TreeModel);
    }
  });
  
  }

    // Convert TreeModel back to nested object
  private treeModelToNestedObject(model: go.TreeModel): any {
    const dataMap: any = {};
    model.nodeDataArray.forEach((n: any) => {
      dataMap[n.key] = { ...n, causes: [] };
    });

    let root: any = null;
    model.nodeDataArray.forEach((n: any) => {
      if (n.parent !== undefined && n.parent !== null) {
        dataMap[n.parent].causes.push(dataMap[n.key]);
      } else {
        root = dataMap[n.key];
      }
    });

    function clean(obj: any) {
      delete obj.key;
      delete obj.parent;
      if (obj.causes.length === 0) delete obj.causes;
      else obj.causes.forEach(clean);
    }
    clean(root);
    return root;
  }
}
