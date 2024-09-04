import React, { useEffect, useRef, useState } from 'react';
import { h, RefObject } from 'preact'
import { ResidentialEdgeCategories, ResidentialGraphEdgeData, ResidentialGraphNodeData } from '../lib/types';
import { useGraphContext } from './GraphContext';
import { emit } from '@create-figma-plugin/utilities';
import { DehighlightAllNodesHandler, DehighlightNodesHandler, HighlightNodesHandler } from '../types';
import { GraphFigmaNodesInterface } from '../lib/core';


const GraphEdge: React.FC<ResidentialGraphEdgeData> = ({ graphId, sourceNodeId, targetNodeId, edgeProperties, id }) => {
  const { graphs, updateGraphData, setCurrentGraph, setCurrentGraphEdges, currentGraphEdges, highlightedNodes, setHighlightedNodes } = useGraphContext();
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

      const edgeLineFId = edgeLine.highlight_id;
      if (edgeLineFId) {
        // Remove the node from highlighted nodes
        setHighlightedNodes((prevNodes) =>
          prevNodes.filter((node_) => !(node_.type == 'edge' && node_.id == id))
        );
    
        // Remove edge id from current edges
        setCurrentGraphEdges((prevEdges) => prevEdges.filter((edgeId) => edgeId !== id));
    
        // Emit the dehighlight event
        emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', [edgeLineFId]);
    
        // Update the input field UI
        inputRef.current?.classList.replace('bg-gray-500', 'bg-gray-100');
    
        // Set the highlighted state to false
        setHighlighted(false);
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

    // Update the edge's cat property
    const updatedEdges = graph.edges.map((edge) => {
      if (edge.id === id) {
        return {
          ...edge,
          edgeProperties: {
            ...edge.edgeProperties,
            cat: newCatValue,
          },
        };
      }
      return edge;
    });

    // Update the graph context with the updated edges
    updateGraphData(graphId, [], updatedEdges);
  };

  useEffect(() => {

  }, [graphs, edgeProperties, currentGraphEdges])

  return (
    <div className="edge bg-gray-100 p-2 rounded-md shadow-sm my-1" onClick={handleEdgeSelect} ref={inputRef}>
      <span>
        Edge from <strong>{(sNode_ as ResidentialGraphNodeData)?.nodeProperties?.cat}</strong> to <strong>{(tNode_ as ResidentialGraphNodeData)?.nodeProperties?.cat}</strong>
      </span>
      <div className="mt-2">
        <label className="font-bold mr-2">Cat:</label>
        <select value={(currentEdge as ResidentialGraphEdgeData)?.edgeProperties.cat} onChange={handleCatChange} className="border p-1 rounded">
          {/* Dynamically generate options from ResidentialEdgeCategories */}
          {Object.entries(ResidentialEdgeCategories).map(([categoryName, categoryValue]) => (
            <option key={categoryValue} value={categoryValue}>
              {categoryName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GraphEdge;