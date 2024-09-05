import React, { useEffect, useRef, useState } from 'react';
import { h, RefObject } from 'preact'
import { ResidentialEdgeCategories, ResidentialGraphEdgeData, ResidentialGraphNodeData, ResidentialNodeCategories } from '../lib/types';
import { useGraphContext } from './GraphContext';
import { emit } from '@create-figma-plugin/utilities';
import { DehighlightAllNodesHandler, DehighlightNodesHandler, HighlightNodesHandler } from '../types';
import { GraphFigmaNodesInterface } from '../lib/core';


const GraphEdge: React.FC<ResidentialGraphEdgeData> = ({ graphId, sourceNodeId, targetNodeId, edgeProperties, id }) => {
  const { graphs, updateGraphData, setCurrentGraph, setCurrentGraphEdges, currentGraphEdges, highlightedNodes, setHighlightedNodes, updateGraphEdgeProperty, deleteEdge } = useGraphContext();
  const [highlighted, setHighlighted] = useState<boolean>(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const handleEdgeSelect = () => {
    if (currentGraphEdges?.includes(id)) {
      // Find the edge line's highlight ID and dehighlight it
      const edgeLine = highlightedNodes.find((node_) => {
        if (node_.type == 'edge' && node_.id == id) {
          return node_;
        }
      });  // Extract the highlight_id

      // Remove edge id from current edges
      setCurrentGraphEdges((prevEdges) => prevEdges.filter((edgeId) => edgeId !== id));

      // Update the input field UI
      inputRef.current?.classList.replace('bg-gray-500', 'bg-gray-100');

      // Set the highlighted state to false
      setHighlighted(false);

      if (edgeLine){
        const edgeLineFId = edgeLine.highlight_id;
        if (edgeLineFId) {
          // Remove the node from highlighted nodes
          setHighlightedNodes((prevNodes) =>
            prevNodes.filter((node_) => !(node_.type == 'edge' && node_.id == id))
          );
      
          // Emit the dehighlight event
          emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', [edgeLineFId]);
        }
      }

    }

    else {
      setCurrentGraphEdges((cEdges) => [...cEdges, id]);
      inputRef.current?.classList.replace('bg-gray-100','bg-gray-500');
      const graph_ = graphs.find((g) => g.id === graphId);

      const nodes_to_highlight = {
        'nodes': [] as string[],
        'edges': [] as {
          source : string,
          target : string
        }[]
      } as GraphFigmaNodesInterface;
      
      if (graph_ && nodes_to_highlight['edges']) {
        nodes_to_highlight['edges'].push({id:id, source:sourceNodeId, target:targetNodeId})
        emit<HighlightNodesHandler>("HIGHLIGHT_NODES", nodes_to_highlight)
        setCurrentGraph(graphId);
      }
      setHighlighted(true);
    }
  }

  // Find the current graph and node from context
  const graph = graphs.find((g) => g.id === graphId);
  const currentEdge = graph?.edges.find((e) => e.id === id);
  const sNode_ = graph?.nodes.find((n) => n.id === sourceNodeId) as ResidentialGraphNodeData;
  const tNode_ = graph?.nodes.find((n) => n.id === targetNodeId) as ResidentialGraphNodeData;

  const handleCatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCatValue = (event.target as HTMLSelectElement).value; // Get new value from the select input
    if (!graph) return;
  
    // Find the edge to update
    const edgeToUpdate = graph.edges.find((edge) => edge.id === id);
  
    if (edgeToUpdate) {
      // Create an updated edge object with the new category
      const updatedEdge: ResidentialGraphEdgeData = {
        ...edgeToUpdate,
        edgeProperties: {
          ...edgeToUpdate.edgeProperties,
          cat: newCatValue,
        },
      };
  
      // Use the previous function to update the graph with the new edge properties
      updateGraphEdgeProperty(graph.id, updatedEdge);
    } else {
      console.error(`Edge with ID ${id} not found in graph.`);
    }
  };

  useEffect(() => {
    
  }, [graphs, edgeProperties, currentGraphEdges])

  return (
    <div className="bg-gray-100 p-2 rounded-md shadow-sm my-1" style={{width:'45%', maxWidth:'45%'}} onClick={handleEdgeSelect} ref={inputRef}>
      <span>
        Edge from <strong>{(sNode_ as ResidentialGraphNodeData)?.nodeProperties?.cat}</strong> to <strong>{(tNode_ as ResidentialGraphNodeData)?.nodeProperties?.cat}</strong>
      </span>
      <div className="mt-2" style={{alignItems:'center', alignContent:'center', display:'flex', flexDirection:'row', gap:'3px', height:'30px'}}>
        <label style={{height:'100%', alignItems:'center'}} className="font-bold mr-2">Cat:</label>
        <select style={{height:'100%'}} value={(currentEdge as ResidentialGraphEdgeData)?.edgeProperties.cat} onChange={handleCatChange} className="border p-1 rounded">
          {/* Dynamically generate options from ResidentialEdgeCategories */}
          {Object.entries(ResidentialEdgeCategories).map(([categoryName, categoryValue]) => (
            <option key={categoryValue} value={categoryValue}>
              {categoryName}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            deleteEdge(graphId, id)}
          }
          className="bg-red-500 text-white rounded hover:bg-blue-600"
          style={{width:'30px', height:'100%', paddingLeft:'2px', paddingRight:'2px', paddingTop:'2px', paddingBottom:'2px',}}
        >
          X
        </button>
      </div>
    </div>
  );
};

export default GraphEdge;