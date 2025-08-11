import { Injectable, ElementRef, EventEmitter } from '@angular/core';
import * as go from 'gojs';
// adjust path if your assets folder path is different
import { FishboneLayout, FishboneLink } from '../assets/FishboneLayout.js';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { NodeInfoDialog } from './node-info-dialog/node-info-dialog.js';


@Injectable({ providedIn: 'root' })
export class FishboneService {
  private diagram!: go.Diagram;
  private fishboneData: any; // holds nested model

  private apiUrl = 'http://localhost:5000/api/fishbones';

  nodeInfoRequested = new EventEmitter<go.Node>();

  constructor(private http: HttpClient) {

  }
  // initialize diagram and templates, load initial data
  public initDiagram(diagramDiv: ElementRef, initialData?: any): go.Diagram {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      isReadOnly: false,
      allowHorizontalScroll: true,
      allowVerticalScroll: true,
      scrollMode: go.Diagram.InfiniteScroll,
      minScale: 0.5
    });

    // Node template (editable)
    this.diagram.nodeTemplate =
      $(go.Node, 'Auto',
        $(go.Shape, 'RoundedRectangle',
          {
            fill: '#e0f7fa',
            stroke: '#006064',
            strokeWidth: 2
          }
        ),
        $(go.TextBlock,
          {
            editable: true,
            margin: 8,
            wrap: go.TextBlock.WrapFit
          },
          new go.Binding('text').makeTwoWay(),
          new go.Binding('font', '', (data: any) => {
            const size = data.size ?? 13;
            const weight = data.weight ?? '';
            return `${weight} ${size}px sans-serif`;
          })
        ),
        {
          selectionAdornmentTemplate:
            $(go.Adornment, "Spot",
              $(go.Panel, "Auto",
                $(go.Shape, { fill: null, stroke: "dodgerblue", strokeWidth: 2 }),
                $(go.Placeholder) // Node shape placeholder
              ),
              // Floating toolbar panel
              $(go.Panel, "Horizontal",
                {
                  alignment: go.Spot.TopRight,
                  alignmentFocus: go.Spot.BottomRight
                },
                $("Button",
                  {
                    click: (e, obj) => {
                      const node = (obj.part as go.Adornment)?.adornedPart as go.Node;
                      this.addChild(node);
                    },
                    toolTip: $("ToolTip", $(go.TextBlock, "Add Child"))
                  },
                  $(go.TextBlock, "+", { margin: 2, stroke: "green", font: "bold 14px sans-serif" })
                ),
                $("Button",
                  {
                    click: (e, obj) => {
                      const node = (obj.part as go.Adornment)?.adornedPart as go.Node;
                      if (node && this.deleteHandler) {
                        this.deleteHandler(node);
                      }
                    },
                    toolTip: $("ToolTip", $(go.TextBlock, "Delete Node"))
                  },
                  $(go.TextBlock, "×", { margin: 2, stroke: "red", font: "bold 14px sans-serif" })
                ),

                $("Button",
                  {
                    click: (e, obj) => {
                      const node = (obj.part as go.Adornment)?.adornedPart as go.Node;
                      if (node) {
                        this.requestNodeInfo(node); // tells component "open dialog for this node"
                      }
                    },
                    toolTip: $("ToolTip", $(go.TextBlock, "Add info to node"))
                  },
                  $(go.TextBlock, "ℹ", { margin: 2, stroke: "red", font: "bold 14px sans-serif" })
                )


              )
            )
        }
      );

    // Link template (FishboneLink)
    this.diagram.linkTemplate =
      $(FishboneLink,
        $(go.Shape, { stroke: '#004d40', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: null, fill: '#004d40' })
      );

    // layout defaults
    this.diagram.layout = $(FishboneLayout, {
      angle: 180,
      layerSpacing: 40,
      nodeSpacing: 40,
      rowSpacing: 40
    });

    // model-changed listener to keep nested data in sync
    this.diagram.addModelChangedListener(e => {
      if (e.isTransactionFinished) {
        this.fishboneData = this.treeModelToNestedObject(this.diagram.model as go.TreeModel);
      }
    });

    // load initial data (nested or flat)
    if (initialData) {
      this.loadFromNested(initialData);
    }

    else {
      // keep existing fishboneData if exists; otherwise default
      if (!this.fishboneData) this.createDefault();
      //this.loadFromNested(this.fishboneData);
    }

    return this.diagram;
  }

  private deleteHandler: ((node: go.Node) => void) | null = null;

  setDeleteHandler(handler: (node: go.Node) => void) {
    this.deleteHandler = handler;
  }

  // expose diagram instance
  public getDiagram(): go.Diagram {
    return this.diagram;
  }

  // create a new default diagram (nested model)
  public createDefault(): void {
    this.fishboneData = {
      text: 'Problem',
      causes: [
        { text: 'People' },
        { text: 'Management' },
        { text: 'Machine' },
        { text: 'Environment' },
        { text: 'Measurement' },
        { text: 'Material' },
      ]
    };
  }

  // load from nested object (your original format)
  public loadFromNested(nested: any): void {
    this.fishboneData = nested;
    const nodeDataArray: any[] = [];
    this.walkJson(JSON.parse(JSON.stringify(nested)), nodeDataArray); // clone to avoid mutating source
    this.diagram.model = new go.TreeModel(nodeDataArray);
    //  console.log("finished setting model" + JSON.stringify(nested));
  }

  // read nested object (current model)
  public getNestedModel(): any {
    return this.fishboneData;
  }

  // adds a child to a given node (node is go.Node)
  public addChild(node: go.Node): void {
    this.diagram.startTransaction('add node');
    const newNode = { text: 'New Cause', parent: node.data.key };
    (this.diagram.model as go.TreeModel).addNodeData(newNode);
    this.diagram.commitTransaction('add node');
  }

  // deletes a node (and its subtree)
  public deleteNode(node: go.Node): void {
    this.diagram.startTransaction('delete node');
    this.diagram.remove(node);
    this.diagram.commitTransaction('delete node');
  }

  deleteNodeAndChildren(node: go.Node) {
    if (!node) return;
    const diagram = node.diagram;
    if (!diagram) return;

    if (node.findTreeChildrenNodes().count > 0) { }
    diagram.startTransaction("delete subtree");

    // Helper: collect all children recursively
    const collectSubtree = (n: go.Node, coll: go.Set<go.Part>) => {
      coll.add(n);
      n.findTreeChildrenNodes().each(child => collectSubtree(child, coll));
    };

    const parts = new go.Set<go.Part>();
    collectSubtree(node, parts);

    diagram.removeParts(parts, true); // `true` removes links too
    diagram.commitTransaction("delete subtree");
  }
  // helper: flatten nested JSON into nodeDataArray for TreeModel
  private walkJson(obj: any, arr: any[]) {
    const key = arr.length;
    obj.key = key;
    arr.push(obj);
    if (obj.causes) {
      obj.causes.forEach((c: any) => {
        c.parent = key;
        this.walkJson(c, arr);
      });
    }
  }

  // convert TreeModel (flat) back to nested object (removes key/parent)
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
      if (!obj.causes || obj.causes.length === 0) delete obj.causes;
      else obj.causes.forEach(clean);
    }
    if (root) clean(root);
    return root;
  }

  // Load diagram by ID from backend
  public loadDiagramById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          if (response && response.jsonData) {
            // JSON data is stored as string in DB, parse it before loading
            const nested = typeof response.jsonData === 'string' ? JSON.parse(response.jsonData) : response.jsonData;
            this.loadFromNested(nested);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Get all saved diagrams metadata (id + name)
  public getSavedDiagrams(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  // Save a new diagram
  public saveDiagram(name: string): Observable<any> {
    if (!this.fishboneData) {
      throw new Error('No diagram data to save');
    }
    return this.http.post<any>(this.apiUrl, {
      name,
      jsonData: JSON.stringify(this.fishboneData) // stringify nested JSON for DB storage
    }).pipe(catchError(this.handleError));
  }

  // Update existing diagram
  public updateDiagram(id: string, name: string): Observable<any> {
    if (!this.fishboneData) {
      throw new Error('No diagram data to update');
    }
    return this.http.put<any>(`${this.apiUrl}/${id}`, {
      name,
      jsonData: JSON.stringify(this.fishboneData)
    }).pipe(catchError(this.handleError));
  }

  // Delete diagram
  public deleteDiagram(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  requestNodeInfo(node: go.Node) {
    this.nodeInfoRequested.emit(node);
  }

  updateNodeInfo(node: go.Node, info: string) {
    if (!node || !this.diagram) return;
    this.diagram.startTransaction("updateNodeInfo");
    this.diagram.model.setDataProperty(node.data, "info", info);
    this.diagram.commitTransaction("updateNodeInfo");
  }

  private handleError(error: any) {
    console.error('API error:', error);
    return throwError(error.message || 'Server error');
  }



}
