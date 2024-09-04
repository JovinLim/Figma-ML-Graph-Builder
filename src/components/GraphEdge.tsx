import React, { useEffect, useState } from 'react';
import { h, RefObject } from 'preact'
import { ResidentialEdgeCategories, ResidentialGraphEdgeData, ResidentialGraphNodeData } from '../lib/types';
import { useGraphContext } from './GraphContext';
import { emit } from '@create-figma-plugin/utilities';
import { DehighlightNodesHandler, HighlightNodesHandler } from '../types';
import { GraphFigmaNodesInterface } from '../lib/core';


const GraphEdge: React.FC<ResidentialGraphEdgeData> = ({ graphId, sourceNodeId, targetNodeId, edgeProperties, id }) => {
  const { graphs, updateGraphData, setCurrentGraph, setCurrentNodes, highlightedNodes } = useGraphContext();

  const handleMouseEnter = () => {
    const graph_ = graphs.find((g) => g.id === graphId);

    const nodes_to_highlight = {
      'nodes': [] as string[],
      'edges': [] as {
        source : string,
        target : string
      }[]
    } as GraphFigmaNodesInterface;
    
    if (graph_ && nodes_to_highlight['edges']) {
      nodes_to_highlight['edges'].push({source:sourceNodeId, target:targetNodeId})
      emit<HighlightNodesHandler>("HIGHLIGHT_NODES", nodes_to_highlight)
      setCurrentGraph(graphId);
      setCurrentNodes([])
    }
  };

  const handleMouseLeave = () => {
    const highlightedNodeIds = highlightedNodes.map(node => node.highlight_id);
    emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', highlightedNodeIds);
  };

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
    console.log(graphs)
  }, [graphs, edgeProperties])

  return (
    <div className="edge bg-gray-100 p-2 rounded-md shadow-sm my-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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