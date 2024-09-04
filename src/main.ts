import { getSelectedNodesOrAllNodes, loadFontsAsync, once, showUI, on } from '@create-figma-plugin/utilities'
import { AddEdgeHandler, AddNodeHandler, AddNodesGroupHandler, AutoEdgeHandler, DehighlightAllNodesHandler, DehighlightNodesHandler, ExportGraphJSON, HighlightNodesHandler, InputNameHandler, InsertCodeHandler, NotifyHandler } from './types'
import { generateUUID } from './lib/utils';
import { FigmaNodeGeometryData, GraphFigmaNodesInterface } from './lib/core';

export default function () {
  once<InsertCodeHandler>('INSERT_CODE', async function (code: string) {
    const text = figma.createText();
    await loadFontsAsync([text]);
    text.characters = code;
    figma.currentPage.selection = [text];
    figma.viewport.scrollAndZoomIntoView([text]);
    figma.closePlugin();
  })

  on<NotifyHandler>('NOTIFY', function (error: boolean, prompt: string) {
      const notificationOptions_ = {
        error: error,
      }
      figma.notify(prompt, notificationOptions_);
  })

  on<AddNodeHandler>('ADD_NODE', function (graphId: string) {
    // Check if there are currently selected nodes in the Figma file
    const selectedNodes = figma.currentPage.selection;
    
    if (selectedNodes.length > 0) {
      // If nodes are currently selected, send them back with 'add-nodes' message
      const nodesData = selectedNodes.map(node => ({
        fNodeId: node.id,
        fNodeName: node.name,
        graphId: graphId,
        graphNodeId: generateUUID(), // Generate a unique ID for each graph node
      }));

      figma.ui.postMessage({
        type: 'add-nodes',
        nodes: nodesData, // Send the list of selected nodes
        graphId: graphId,
      });

      // Empty selection
      figma.currentPage.selection = [];

    } else {
      figma.notify('No objects selected. Please try again.');
    }
  })

  on<AddNodesGroupHandler>('ADD_NODES_BY_GROUP', function (graphId: string) {
    // Check if there are currently selected nodes in the Figma file
    const selectedNodes = figma.currentPage.selection;
  
    if (selectedNodes.length > 0) {
      // Filter to check if all selected nodes are groups and contain only valid children
      const validGroups = selectedNodes.filter((node) => {
        if (node.type === 'GROUP') {
          // Check if all children of the group are of valid types
          const groupChildren = (node as GroupNode).children;
          return groupChildren.every(
            (child) =>
              child.type === 'RECTANGLE' ||
              child.type === 'POLYGON' ||
              child.type === 'GROUP' ||
              child.type === 'VECTOR'
          );
        }
        return false;
      });
  
      if (validGroups.length > 0) {
        // If valid groups are found, process each valid group and its children
        const nodesData = validGroups.flatMap((group) =>
          (group as GroupNode).children.map((node) => ({
            fNodeId: node.id,
            fNodeName: node.name,
            graphId: graphId,
            graphNodeId: generateUUID(), // Generate a unique ID for each graph node
          }))
        );
  
        figma.ui.postMessage({
          type: 'add-nodes',
          nodes: nodesData, // Send the list of selected nodes
          graphId: graphId,
        });
  
        // Empty selection
        figma.currentPage.selection = [];
      } else {
        figma.notify('No groups selected or invalid objects in groups selected. Please try again.');
      }
    } else {
      figma.notify('No objects selected. Please try again.');
    }
  });

  on<AddEdgeHandler>('ADD_EDGE', function (graphId: string, nodeId:string) {
    // Check if there are currently selected nodes in the Figma file
    const selectedNodes = figma.currentPage.selection;
    
    if (selectedNodes.length > 0) {
      // If nodes are currently selected, send them back with 'add-nodes' message
      const nodesData = selectedNodes.map(node => ({
        tNodeId: node.id,
        tNodeName: node.name,
        graphId: graphId,
        nodeId: nodeId,
      }));
      
      figma.ui.postMessage({
        type: 'add-edges',
        nodes: nodesData, // Send the list of selected nodes
        graphId: graphId,
      });

      // Empty selection
      figma.currentPage.selection = [];

    } else {
      // If no nodes are selected, prompt the user to select nodes
      figma.notify('Please select target objects in the Figma file.');
    }
  })

  on<AutoEdgeHandler>('AUTO_EDGE', async function (graphId: string, nodeId: string, gNodeIds: string[]) {
    const cNode_ = await figma.getNodeByIdAsync(nodeId) as RectangleNode | PolygonNode | GroupNode;
    const nodesData = [] as { tNodeId: string; tNodeName: string; graphId: string; nodeId: string }[]; // Array to store edges data
    
    if (!cNode_ || !cNode_.absoluteBoundingBox) {
      console.error('Current node not found or does not have an absoluteBoundingBox.');
      return;
    }
  
    const cNodeBox = cNode_.absoluteBoundingBox as Rect;
  
    // Define a threshold distance to consider nodes as "beside" or "above/below" each other
    const margin = 3; // Adjust the margin value based on your requirements
  
    for (let n = 0; n < gNodeIds.length; n++) {
      const gNodeId = gNodeIds[n];
      const fNode = await figma.getNodeByIdAsync(gNodeId) as RectangleNode | PolygonNode | GroupNode;
  
      if (!fNode || !fNode.absoluteBoundingBox) {
        console.error(`Node with ID ${gNodeId} not found or does not have an absoluteBoundingBox.`);
        continue;
      }
  
      const fNodeBox = fNode.absoluteBoundingBox as Rect;
      
      const alignedHorizontal = 
      ((cNodeBox.x >= fNode.x) && (fNodeBox.x + fNodeBox.width >= cNodeBox.x)) ||
      ((fNodeBox.x >= cNodeBox.x) && (cNodeBox.x + cNodeBox.width >= fNodeBox.x)) ||
      (Math.abs(fNodeBox.x + fNodeBox.width - cNodeBox.x) <= margin) ||
      (Math.abs(cNodeBox.x + cNodeBox.width - fNodeBox.x) <= margin)

      const alignedVertical =
      ((cNodeBox.y >= fNode.y) && (fNodeBox.y + fNodeBox.height >= cNodeBox.y)) ||
      ((fNodeBox.y >= cNodeBox.y) && (cNodeBox.y + cNodeBox.height >= fNodeBox.y)) ||
      (Math.abs(fNodeBox.y + fNodeBox.height - cNodeBox.y) <= margin) ||
      (Math.abs(cNodeBox.y + cNodeBox.height - fNodeBox.y) <= margin)
      
      if (alignedHorizontal && alignedVertical) {
        // If nodes are aligned horizontally and vertically, create an edge
        nodesData.push({
          tNodeId: fNode.id,
          tNodeName: fNode.name,
          graphId: graphId,
          nodeId: nodeId,
        });
      }
    }
  
    // Send the list of edges to the UI
    figma.ui.postMessage({
      type: 'auto-edges',
      nodes: nodesData, // Send the list of selected nodes
      graphId: graphId,
    });
  });

  on<ExportGraphJSON>('EXPORT_GRAPH_JSON', async function (graphId:string, fNodes:GraphFigmaNodesInterface) {
    const allNodesInformation = [] as FigmaNodeGeometryData[];
    const nodeIds_ = fNodes['nodes'] ? fNodes['nodes'] : [];

    for (const id of nodeIds_) {
      const node_ = await figma.getNodeByIdAsync(id) as RectangleNode | PolygonNode | GroupNode;
      const absolutebb_ = node_.absoluteBoundingBox as Rect;
  
      const nodesData = {
        type:'node',
        id: id,
        x: absolutebb_.x,
        y: absolutebb_.y,
        width: absolutebb_.width,
        height: absolutebb_.height,
      };
  
      allNodesInformation.push(nodesData);
    }
    
    figma.ui.postMessage({
      type: 'export-graph-json',
      nodes: allNodesInformation,
      graphId: graphId
    });

  })

  on<HighlightNodesHandler>('HIGHLIGHT_NODES', async function (fNodes: GraphFigmaNodesInterface) {
    const allNodesInformation = [] as any[];
    
    const nodeIds_ = fNodes['nodes'] ? fNodes['nodes'] : [];
    const edges = fNodes['edges'] ? fNodes['edges'] : [];

    // Use for...of loop to handle async/await properly
    for (const id of nodeIds_) {
      const node_ = await figma.getNodeByIdAsync(id) as RectangleNode | PolygonNode | GroupNode;
      const absolutebb_ = node_.absoluteBoundingBox as Rect;
  
      // Draw a translucent yellow rectangle for each node
      const highlightRect = figma.createRectangle();  // Create a new rectangle
      highlightRect.setPluginData('graph-builder', 'node');
      highlightRect.x = absolutebb_.x;  // Set X position
      highlightRect.y = absolutebb_.y;  // Set Y position
      highlightRect.resize(absolutebb_.width, absolutebb_.height);  // Set size to match the node
  
      // Set the rectangle's fill to translucent yellow
      highlightRect.fills = [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 0 },  // Yellow color
        opacity: 0.3  // 30% opacity
      }];
  
      const nodesData = {
        type:'node',
        id: id,
        x: absolutebb_.x,
        y: absolutebb_.y,
        width: absolutebb_.width,
        height: absolutebb_.height,
        highlight_id: highlightRect.id
      };
  
      allNodesInformation.push(nodesData);
      // Append the rectangle to the current page
      figma.currentPage.appendChild(highlightRect);
    }

    for (const edge_ of edges) {
      const sourceNode_ = await figma.getNodeByIdAsync(edge_['source']) as RectangleNode | PolygonNode | GroupNode;
      const targetNode_ = await figma.getNodeByIdAsync(edge_['target']) as RectangleNode | PolygonNode | GroupNode;
      const sourceAbsolutebb_ = sourceNode_.absoluteBoundingBox as Rect;
      const targetAbsolutebb_ = targetNode_.absoluteBoundingBox as Rect;
    
      const sourceAbsolutebbCenter = [
        sourceAbsolutebb_.x + sourceAbsolutebb_.width / 2,
        sourceAbsolutebb_.y + sourceAbsolutebb_.height / 2,
      ];
      const targetAbsolutebbCenter = [
        targetAbsolutebb_.x + targetAbsolutebb_.width / 2,
        targetAbsolutebb_.y + targetAbsolutebb_.height / 2,
      ];
    
      const edgeLine = figma.createVector();
      edgeLine.setPluginData('graph-builder', 'edge');

      // Set stroke properties
      edgeLine.strokeWeight = 1;  // Stroke width
      edgeLine.strokes = [{
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },  // Red color
      }];

      edgeLine.vectorNetwork = {
        vertices: [
          {x: sourceAbsolutebbCenter[0], y: sourceAbsolutebbCenter[1], strokeCap: "NONE"},
          {x: targetAbsolutebbCenter[0], y: targetAbsolutebbCenter[1], strokeCap: "ARROW_LINES"},
        ],
        segments: [
          {
            start: 0,
            end: 1
          }
        ]
      }
      
      // // Set the vector path data between source center and target center
      // edgeLine.vectorPaths = [{
      //   windingRule: "EVENODD",
      //   data: `M ${sourceAbsolutebbCenter[0]} ${sourceAbsolutebbCenter[1]} L ${targetAbsolutebbCenter[0]} ${targetAbsolutebbCenter[1]}`,
      // }];
      
      const edgesData = {
        type:'edge',
        sourceId: edge_['source'],
        targetId: edge_['target'],
        x: edgeLine.x,
        y: edgeLine.y,
        highlight_id: edgeLine.id,
        id: edge_['id']
      };
    
      allNodesInformation.push(edgesData);
      // Append the edge line to the current page
      figma.currentPage.appendChild(edgeLine);
    }
  
    // Post the message only after all operations are complete
    figma.ui.postMessage({
      type: 'highlight-nodes',
      nodes: allNodesInformation,
      graphId: "",
    });
  });
  
  on<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', async function (fNodeIds: string[]) {
    for (const id of fNodeIds){
      const node = await figma.getNodeByIdAsync(id); // Get the node by its ID
      if (node && node.getPluginData('graph-builder') !== '') { // Check if the node exists and has 'graph-builder' plugin data
        node.remove(); // Remove the node if it has 'graph-builder' plugin data
      }
    }
  });

  on<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES', function () {
    // Find all nodes in the current page that have plugin data with the key 'graph-builder'
    const nodesToRemove = figma.currentPage.findAll(node => {
      return node.getPluginData('graph-builder') !== '';
    });
  
    // Remove all found nodes
    for (const node of nodesToRemove) {
      node.remove();
    }
  });


  const wth_ratio = 4/3;
  const height = 600;
  const width = wth_ratio*height;
  showUI({ height: height, width: width })
  
  figma.on('close', function () {
    // Find all nodes in the current page that have plugin data with the key 'graph-builder'
    const nodesToRemove = figma.currentPage.findAll(node => {
      return node.getPluginData('graph-builder') !== '';
    });
  
    // Remove all found nodes
    for (const node of nodesToRemove) {
      node.remove();
    }
  });
}
