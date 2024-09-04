import '!prismjs/themes/prism.css'

import {
  Button,
  Container,
  render,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h, RefObject } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { highlight, languages } from 'prismjs'
import Editor from 'react-simple-code-editor'
import '!./output.css'
import styles from './styles.css'
import { AddNodeHandler, DehighlightAllNodesHandler, DehighlightNodesHandler, ExportGraphJSON, InsertCodeHandler, NotifyHandler } from './types'
import Graph from './components/Graph'
import { generateUUID } from './lib/utils'
import { DefaultResidentialEdgeCategory, ResidentialGraphData, ResidentialGraphEdgeData, ResidentialGraphJSONData, ResidentialGraphNodeData, ResidentialGraphNodeProperties, ResidentialGraphNodeJSONData, ResidentialGraphEdgeJSONData, ResidentialGraphProperties, ExternalUnitCategories } from './lib/types'
import { FigmaNodeGeometryData, GraphData, GraphEdgeData, GraphNodeData } from './lib/core'
import { GraphProvider, useGraphContext } from './components/GraphContext'
import React from 'preact/compat'

console.log("Starting Graph Builder Plugin...")
const debug = true;
const Plugin: React.FC = () => {
  /**DONT TOUCH*/
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}`)
  const containerElementRef : RefObject<HTMLDivElement> = useRef(null)
  const handleInsertCodeButtonClick = useCallback(
    function () {
      emit<InsertCodeHandler>('INSERT_CODE', code)
    },
    [code]
  )

  useEffect(function () {
    const containerElement = containerElementRef.current
    if (containerElement === null) {
      return
    }
    const textAreaElement = containerElement.querySelector('textarea')
    if (textAreaElement === null) {
      return
    }
    textAreaElement.textContent = code
    const preElement = containerElement.querySelector('pre')
    if (preElement === null) {
      return
    }
    if (textAreaElement.nextElementSibling !== preElement) {
      textAreaElement.after(preElement)
    }

  }, [code])
  /**DONT TOUCH*/


  return (
    <GraphProvider>
      <EventDispatcher/>
      <MainPage/>
    </GraphProvider>
  );
}

const MainPage: React.FC<GraphActionButtonsProps> = () => {
  const {mode} = useGraphContext(); // Use the context to get the createGraph function
  return (
    <div>
      {(() => {
        switch (mode) {
          case 'input':
            return <InputContainer />;

          default:
            return (
              <Container space="large" className="relative h-full">
                <VerticalSpace space="small" />

                {/* Consume the context to render graphs dynamically */}
                <GraphContainer />

                {/* Fixed buttons at the bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between">
                  <GraphActionButtons />
                </div>

                <VerticalSpace space="small" />
              </Container>
            );
        }
      })()}
    </div>
  );
};

interface InputContainerProps {
}

const InputContainer: React.FC<InputContainerProps> = () => {
  const { updateGraphProps, mode, setMode, currentGraph } = useGraphContext();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus the input field and select its text when the component is rendered
    if (inputRef.current) {
      inputRef.current.focus(); // Focus the input element
      inputRef.current.select(); // Select the existing text
    }

    if (debug) {
      const nameInput = document.getElementById('graphNameInput') as HTMLInputElement;
      const scaleInput = document.getElementById('graphScaleInput') as HTMLInputElement;
      const projectInput = document.getElementById('graphProjectInput') as HTMLInputElement;
      const gradeInput = document.getElementById('graphGradeInput') as HTMLInputElement;

      nameInput.value = "test";
      scaleInput.value = "1000";
      projectInput.value = "Haus on Handy";
      gradeInput.value = "1br A1";
    }
  }, [mode]); // Run this effect only once when the component mounts

  const handleInputConfirm = (newName: string, graphScale: number, graphProject:string, graphGrade: string) => {
    if (currentGraph){
      // Update the graph properties with the new name and switch back to 'default' mode
      updateGraphProps(currentGraph, { name: newName, scale:graphScale, project: graphProject, grade:graphGrade } as ResidentialGraphProperties); // Assuming the graph properties include 'name'
      setMode('default');
    }
  };

  const confirmInput = () => {
    const nameInput = document.getElementById('graphNameInput') as HTMLInputElement;
    const scaleInput = document.getElementById('graphScaleInput') as HTMLInputElement;
    const projectInput = document.getElementById('graphProjectInput') as HTMLInputElement;
    const gradeInput = document.getElementById('graphGradeInput') as HTMLInputElement;

    if (nameInput && currentGraph && scaleInput && projectInput && gradeInput) {
      try {
        const graphName = nameInput.value;
        const graphProject = projectInput.value;
        const graphGrade = gradeInput.value;
        const graphScale = Number(scaleInput.value);

        if (graphName == "" || graphName == undefined || graphName == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid text for graph name.");}
        else if (typeof graphScale !== "number" || graphScale==0){emit<NotifyHandler>('NOTIFY', true, "Please input a valid number for scale.");}
        else if (graphProject == "" || graphProject == undefined || graphProject == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid text project name.");}
        else if (graphGrade == "" || graphGrade == undefined || graphGrade == null) {emit<NotifyHandler>('NOTIFY', true, "Please input text valid grade.");}
        else {
          handleInputConfirm(graphName, graphScale, graphProject, graphGrade);
        }
      }

      catch {
        emit<NotifyHandler>('NOTIFY', true, "Please input a valid number.");
      }
    }

    else {
      emit<NotifyHandler>('NOTIFY', true, "Please input valid values for all fields.");
    }
  };

  return (
    <div className="space-y-3" style={{ padding: '16px', textAlign: 'left' }}>
      <p style={{ fontSize:'16px' }}>Please enter a name for the graph:</p>
      <input 
      type="text" 
      id="graphNameInput" 
      style={{ width: '100%', padding: '8px', border: '1px solid black' }}
      ref={inputRef}
      placeholder="Graph Name" />

      <div style={{ marginTop:'10px'}}>
        <p style={{ fontSize:'16px' }}>Graph Properties</p>
        <div id='graphProps' className="space-y-2" style={{textAlign: 'left', marginTop:'10px'}}>
          <div id='graphScaleContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Scale (to mm)</p>
            <input 
              type="text" 
              id="graphScaleInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              placeholder="Enter scale here..." />
          </div>

          <div id='graphProjectContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Project</p>
            <input 
              type="text" 
              id="graphProjectInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              placeholder="Enter project name here..." />
          </div>

          <div id='graphGradeContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Grade</p>
            <input 
              type="text" 
              id="graphGradeInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              placeholder="Enter grade here..." />
          </div>


        </div>
      </div>

      <div  style={{height:'15%'}} className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between">
        <button 
          onClick={confirmInput} 
          id="confirmButton"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          style={{ marginTop: '8px', padding: '8px 16px', fontSize:'12px', bottom:'0' }}>
            Confirm
        </button>
      </div>



    </div>
  );
};

const EventDispatcher: React.FC = () => {

  const { graphs, updateGraphData, setHighlightedNodes, mode, setMode, currentGraph } = useGraphContext();
  // Handle messages from the Figma plugin
  window.onmessage = (event) => {
    console.log('Received message:', event);

    // Ensure the message format is correct
    var { type, nodes, graphId } = event.data.pluginMessage;

    if (type === 'add-nodes') {
      // Dispatch 'receive-nodes-data' event
      const receivedNodesDataEvent = new CustomEvent('receive-nodes-data', {
        detail: {
          graphId,
          nodes,
        },
      });
      window.dispatchEvent(receivedNodesDataEvent);
    }

    else if (type === 'add-edges' || type==='auto-edges') {
      console.log(`Adding edges to graph ${graphId}`);
      const newEdges = [] as ResidentialGraphEdgeData[];
      for (let n=0; n<nodes.length; n++){
        const node=nodes[n];
        const { tNodeId, tNodeName, graphId, nodeId } = node; // Destructure node data
        
        // Construct new edge data
        const newEdge: ResidentialGraphEdgeData = {
          id: generateUUID(),
          graphId: graphId,
          sourceNodeId: nodeId, // Source node is the nodeId
          targetNodeId: tNodeId, // Target node is the tNodeId
          edgeProperties: {
            cat: DefaultResidentialEdgeCategory['Direct Access'], // Default edge property value
          },
        };
        newEdges.push(newEdge)
      }
      updateGraphData(graphId, [], newEdges);
    }

    else if (type === 'highlight-nodes'){
      console.log(`Highlighting ${nodes.length} nodes.`)
      setHighlightedNodes((prevNodes) => [...prevNodes, ...nodes]);
    }

    else if (type === 'export-graph-json'){
      const graph_ : GraphData | undefined = graphs.find((g) => {
        return g.id === graphId;
      }) as ResidentialGraphData

      if (graph_ && graph_.graphProperties) {
        console.log(`Exporting graph ${graph_.graphProperties.name}`)


        const graphScale_ = (graph_ as ResidentialGraphData).graphProperties?.scale ? (graph_ as ResidentialGraphData).graphProperties?.scale as number : 1
        const graphEdges_ = graph_.edges as ResidentialGraphEdgeData[]
        const graphNodes_ = graph_.nodes as ResidentialGraphNodeData[]

        const nodesJsonData = {} as Record<string, ResidentialGraphNodeJSONData>;
        const edgesJsonData = {} as Record<string, ResidentialGraphEdgeJSONData>;
        const nodesIdMap = {} as Record<string, string>;
        
        for (let n = 0; n < graphNodes_.length; n++) {
          const gNode_ = graphNodes_[n];
        
          // Find the corresponding Figma node data
          const fNode_ = nodes.find((n_: any) => {
            return n_.id === gNode_.id;
          });
        
          if (fNode_) {
            // Extract corner points from Figma node geometry
            const cornerA = [fNode_.x * graphScale_, (fNode_.y - fNode_.height) * graphScale_];
            const cornerB = [(fNode_.x + fNode_.width)* graphScale_, fNode_.y * graphScale_];
        
            // Compute width and depth (assuming width = horizontal distance, depth = vertical distance)
            const width = fNode_.width * graphScale_;
            const depth = fNode_.height * graphScale_;
        
            // Extract the 'cat' property from the graph node properties
            const cat = gNode_.nodeProperties?.cat || 'unknown';
            const pcat = gNode_.nodeProperties?.pcat || cat;
        
            // Use the node's unique ID
            const uid = generateUUID();
        
            // Create a new ResidentialGraphNodeJSONData object
            const nodeJsonData: ResidentialGraphNodeJSONData = {
              cornerA: cornerA,
              cornerB: cornerB,
              cat: cat,
              pcat: pcat,
              width: width,
              depth: depth,
              uid: uid,
            };
        
            // Push the extracted node data to nodesJsonData array
            nodesJsonData[uid] = (nodeJsonData);
            nodesIdMap[gNode_.id] = uid;
          }
        }

        for (let e=0; e<graphEdges_.length; e++) {
          const gEdge_ = graphEdges_[e];
          edgesJsonData[gEdge_.id]=({
            source: nodesIdMap[gEdge_.sourceNodeId],
            target: nodesIdMap[gEdge_.targetNodeId],
            cat: gEdge_.edgeProperties.cat ? gEdge_.edgeProperties.cat : 'ACCESS'
          })
        }

        var gidCount = 0;
        // Iterate over each node in nodesJsonData
        for (let nodeId in nodesJsonData) {
          const nodeJson = nodesJsonData[nodeId];

          // Collect all edges associated with this node where edgeProperties.cat is 'ACCESS'
          const associatedEdges = Object.values(edgesJsonData).filter(edge => 
            (edge.source === nodeJson.uid || edge.target === nodeJson.uid) && edge.cat === 'ACCESS'
          );

          // Initialize a group for nodes with the same 'cat' and connected via 'ACCESS' edges
          const groupNodes = [nodeJson]; // Start with the current node
          const groupNodeIds = [nodeId]; // To keep track of node IDs in the group

          // Check other nodes to see if they belong in the same group
          for (let otherNodeId in nodesJsonData) {
            if (otherNodeId === nodeId) {
              continue; // Skip the current node and already assigned nodes
            }

            const otherNodeJson = nodesJsonData[otherNodeId];

            // Check if the other node shares the same 'cat' and is connected by an 'ACCESS' edge
            const isConnected = associatedEdges.some(edge => 
              (edge.source === nodeJson.uid && edge.target === otherNodeJson.uid) ||
              (edge.source === otherNodeJson.uid && edge.target === nodeJson.uid)
            );

            if (isConnected && otherNodeJson.pcat === nodeJson.pcat) {
              groupNodeIds.push(otherNodeJson.uid)
              groupNodes.push(otherNodeJson)
            }
          }

          // Run through all nodes in groupNodes and collect those with property 'gid'.
          const existingGids = groupNodes.map(node => node.gid).filter(gid => gid !== undefined);

          if (existingGids.length > 0) {
            // If there are more than 1 with property 'gid', get the lowest value
            const lowestGid = Math.min(...existingGids);

            // Run through all nodes in nodesJsonData and assign all nodes with found 'gid' values the lowest.
            for (let allNodeId in nodesJsonData) {
              const allNode = nodesJsonData[allNodeId];
              if (allNode.gid && existingGids.includes(allNode.gid)) {
                allNode.gid = lowestGid;
              }
            }

            // Then, assign all nodes in groupNodes the same gid value.
            groupNodes.forEach(node => {
              node.gid = lowestGid;
            });
          } else {
            // If no existing gid, assign all nodes in groupNodes a new gid value
            groupNodes.forEach(node => {
              node.gid = gidCount;
            });
          }

          // Increment gidCount for the next group
          gidCount++;
        }

        // Instantiate graph global info
        const graphTotalArea = Object.values(nodesJsonData).reduce((totalArea, node) => {
          // Check if the node's category is not in ExternalUnitCategories before including its area
          if (!ExternalUnitCategories.includes(node.pcat ? node.pcat : node.cat)) {
            return totalArea + (node.width * node.depth);
          }
          return totalArea; // If it is in the ExternalUnitCategories, do not add its area
        }, 0);

        const project_ = (graph_ as ResidentialGraphData)?.graphProperties?.project ? (graph_ as ResidentialGraphData)?.graphProperties?.project : "unknown"
        const grade_ = (graph_ as ResidentialGraphData).graphProperties?.grade ? (graph_ as ResidentialGraphData)?.graphProperties?.grade : "unknown"
        const graphGlobalInfo = {
          grade: grade_,
          area: graphTotalArea,
          project: project_
        }

        const graphJSON = {
          nodes: nodesJsonData,
          edges: edgesJsonData,
          globalInfo: graphGlobalInfo
        } as ResidentialGraphJSONData;

        const jsonString = JSON.stringify(graphJSON, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project_}_${grade_}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        switch(mode) {
          case 'add-nodes':
            if (currentGraph){
              const nodesAddedEvent = new CustomEvent('nodes-added', {
                detail: {
                  currentGraph,
                },
              });
              window.dispatchEvent(nodesAddedEvent);
            }
          case 'add-edges':
            if (currentGraph){
              const edgesAddedEvent = new CustomEvent('edges-added', {
                detail: {
                  currentGraph,
                },
              });
              window.dispatchEvent(edgesAddedEvent);
            }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    null
  )
}

// Component to render the Graphs and provide buttons to add new graphs
const GraphContainer: React.FC = () => {
  const { graphs, updateGraphData, setHighlightedNodes } = useGraphContext();

  return (
    <div id="graph-info-container" className="space-y-4 mb-24">
      {/* Render Graph components here */}
      {graphs.map((graph) => (
        <Graph key={graph.id} {...graph as ResidentialGraphData} />
      ))}
    </div>
  );
};

interface GraphActionButtonsProps {
}

const GraphActionButtons: React.FC<GraphActionButtonsProps> = () => {
  const { graphs, createGraph, highlightedNodes,  setHighlightedNodes, setCurrentGraph, setMode} = useGraphContext(); // Use the context to get the createGraph function

  const handleCreateGraph = () => {
    const newGraphId = createGraph(); // Create the new graph
    setCurrentGraph(newGraphId); // Set the current graph ID to the newly created graph
    setMode('input'); // Change the mode to 'input' to render InputContainer
  };

  const unselectAllNodes = () => {
    emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES');
    setHighlightedNodes([]);
  };

  const exportAsJSON = () => {
    graphs.forEach(graph => {
      const nodeIds = graph.nodes.map(n => n.id);
      const edgesData = graph.edges.map(e => ({'id': e.id, 'source':e.sourceNodeId, 'target':e.targetNodeId}))
      const figmaNodeInterface = {
        nodes: nodeIds,
        edges: edgesData
      }
      emit<ExportGraphJSON>('EXPORT_GRAPH_JSON', graph.id, figmaNodeInterface)
    })
  }
  return (
    <div style={{height:'15%'}} className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between ">
      <Button fullWidth onClick={handleCreateGraph} id="create-graph" className="mr-2">
        Create Graph
      </Button>
      <Button fullWidth onClick={unselectAllNodes} id="dehighlight" className="mr-2">
        Clear Highlights
      </Button>
      <Button fullWidth onClick={exportAsJSON} id="export-json" className="ml-2">
        Export All
      </Button>
    </div>
  );
};

export default render(Plugin)