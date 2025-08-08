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

  ngAfterViewInit(): void {
    this.initDiagram();
  }
  
  initDiagram(): void {


    const $ = go.GraphObject.make;
    const myDiagram = $(go.Diagram, 'myDiagramDiv', {
      'undoManager.isEnabled': true, 
      isReadOnly: false
    });

    myDiagram.nodeTemplate =
      $(go.Node, 'Auto',
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

    myDiagram.linkTemplate =
      $(FishboneLink,

    $(go.Shape, { stroke: '#004d40', strokeWidth: 2 }), // link line
    $(go.Shape, { toArrow: 'Standard', stroke: null, fill: '#004d40' }) // arrowhead
      );

      const json = {
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

    const nodeDataArray: any[] = [];
    walkJson(json, nodeDataArray);
    myDiagram.model = new go.TreeModel(nodeDataArray);

    myDiagram.layout = $(FishboneLayout, {
      angle: 180,
      layerSpacing: 50,
      nodeSpacing: 40,
      rowSpacing: 40
    });

      // Listen for changes and update Angular object
  myDiagram.addModelChangedListener(e => {
    if (e.isTransactionFinished) {
      const updated = myDiagram.model.toJson();
      console.log('Updated JSON:', updated);
      // Optional: persist to Angular variable
      //this.fishboneData = this.treeModelToNestedObject(myDiagram.model);
    }
  });
  }
}
