import React, { ChangeEvent, useEffect, useState } from 'react';
import { h, RefObject } from 'preact'
import { ResidentialGraphData, ResidentialGraphEdgeData, ResidentialGraphNodeData, ResidentialGraphNodeProperties, ResidentialNodeCategories } from '../lib/types';
import { useGraphContext } from './GraphContext';
import { AddEdgeHandler, AutoEdgeHandler, DehighlightNodesHandler, HighlightNodesHandler, NotifyHandler } from '../types';
import { emit } from '@create-figma-plugin/utilities';
import GraphEdge from './GraphEdge';
import { GraphData, GraphFigmaNodesInterface } from '../lib/core';

const GraphNode: React.FC<ResidentialGraphNodeData> = ({ id, label, graphId, nodeProperties }) => {
  const [nInputValue, setNInputValue] = useState<string>(nodeProperties?.cat || '');
  const [nCatValue, setNCatValue] = useState<string>('');
  const [pInputValue, setPInputValue] = useState<string>(nodeProperties?.pcat || '');
  const [pCatValue, setPCatValue] = useState<string>('');
  const [isNDropdownOpen, setIsNDropdownOpen] = useState<boolean>(false);
  const [isPDropdownOpen, setIsPDropdownOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [localMode, setLocalMode] = useState<string>("default");
  const {graphs, updateGraphData, highlightedNodes, setCurrentGraph, setCurrentNodes} = useGraphContext();

  // Find the current graph and node from context
  const graph = graphs.find((g) => g.id === graphId);
  const currentNode = graph?.nodes.find((n) => n.id === id);

  const deselectNode = () => {
    const highlightedNodeIds = highlightedNodes.map(node => node.highlight_id);
    emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', highlightedNodeIds);
  }

  const selectNode = () => {
    const highlightedNodeIds = highlightedNodes.map(node => node.highlight_id);
    emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', highlightedNodeIds);
    const graph_ : GraphData | undefined = graphs.find((g) => {
      return g.id === graphId;
    })

    const nodes_to_highlight = {
      'nodes': [] as string[],
      'edges': [] as {
        source : string,
        target : string
      }[]
    } as GraphFigmaNodesInterface;

    if (nodes_to_highlight['nodes']){
      nodes_to_highlight['nodes'].push(id)
    }

    if (graph_) {
      if (nodes_to_highlight['edges']){
        const edges_ = graph_.edges as ResidentialGraphEdgeData[]
        for (let e in edges_){
          const edge_ = edges_[e]
          if (edge_.sourceNodeId == id || edge_.targetNodeId == id){
            nodes_to_highlight['edges'].push({source: edge_.sourceNodeId, target:edge_.targetNodeId})
          }
        }
      }
    }
    setCurrentGraph(graphId);
    setCurrentNodes([id])
    emit<HighlightNodesHandler>('HIGHLIGHT_NODES', nodes_to_highlight);
  }

  // Filter options dynamically based on user input for category or parent category
  const filteredCategoryOptions = Object.entries(ResidentialNodeCategories).filter(([categoryName]) =>
    categoryName.toLowerCase().includes(nInputValue.toLowerCase())
  );

  const filteredParentCategoryOptions = Object.entries(ResidentialNodeCategories).filter(([categoryName]) =>
    categoryName.toLowerCase().includes(pInputValue.toLowerCase())
  );

  // Handle input change for text field
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target_ = event.target as HTMLInputElement;
    const prop_ = target_.getAttribute('data-prop');

    switch (prop_) {
      case 'category':
        var newValue = target_.value;
        setNInputValue(newValue); // Update input value
        setIsNDropdownOpen(true); // Show dropdown when typing
        break;

      case 'parent-category':
        var newValue = target_.value;
        setPInputValue(newValue); // Update input value
        setIsPDropdownOpen(true); // Show dropdown when typing
        break;
    }
  };

  // Handle selection from dropdown
  const handleOptionSelect = (event: MouseEvent) => {
    const target_ = event.currentTarget as HTMLDivElement;
    const prop_ = target_.getAttribute('data-prop');
    const value = target_.getAttribute('data-cat') as string;

    switch (prop_) {
      case 'category':
        setNInputValue(value); // Update input with selected option
        if (value in ResidentialNodeCategories) {
          handleCatChange('category', ResidentialNodeCategories[value as keyof typeof ResidentialNodeCategories]);
          setNCatValue(ResidentialNodeCategories[value as keyof typeof ResidentialNodeCategories]);
        } else {
          setNCatValue(''); // Reset catValue or handle as needed if the input doesn't match any category
        }
        setIsNDropdownOpen(false); // Close dropdown
        break;

      case 'parent-category':
        setPInputValue(value); // Update input with selected option
        if (value in ResidentialNodeCategories) {
          handleCatChange('parent-category', ResidentialNodeCategories[value as keyof typeof ResidentialNodeCategories]);
          setPCatValue(ResidentialNodeCategories[value as keyof typeof ResidentialNodeCategories]);
        } else {
          setPCatValue(''); // Reset catValue or handle as needed if the input doesn't match any category
        }
        setIsPDropdownOpen(false); // Close dropdown
        break;
    }
  };

  // Handle changing 'cat' property
  const handleCatChange = (prop: string, categoryValue: string) => {
    if (!graph) return; // If graph is not found, return

    switch (prop) {
      case 'category':
        // Find the node by id and update 'cat' property
        var updatedNodes = graph.nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              nodeProperties: {
                ...node.nodeProperties,
                cat: categoryValue,
              } as ResidentialGraphNodeProperties,
            };
          }
          return node; // Return unchanged nodes
        });

        // Update the graph data with the updated nodes
        updateGraphData(graphId, updatedNodes);
        break;

      case 'parent-category':
        // Find the node by id and update 'pcat' property
        var updatedNodes = graph.nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              nodeProperties: {
                ...node.nodeProperties,
                pcat: categoryValue,
              } as ResidentialGraphNodeProperties,
            };
          }
          return node; // Return unchanged nodes
        });

        // Update the graph data with the updated nodes
        updateGraphData(graphId, updatedNodes);
        break;
    }
  };

  // Handle dropdown toggle
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Function to handle adding a new node by emitting an event
  const handleAddEdge = () => {
    setLocalMode('add-edges');
    emit<NotifyHandler>('NOTIFY', false, "Please select objects in the Figma file. Press confirm to add edges.");
  };

  // Function to handle adding a new node by emitting an event
  const handleAutoEdges = () => {
    const graph_ : GraphData | undefined = graphs.find((g) => {
      return g.id === graphId;
    })

    if (graph_){
      const gNodeIds = graph_.nodes
      .filter((n) => n.id !== id) 
      .map((n) => n.id);

      emit<AutoEdgeHandler>('AUTO_EDGE', graphId, id, gNodeIds);
    }
  };

  // Function to handle adding a new node by emitting an event
  const confirmAddEdge = () => {
    setLocalMode('default');
    emit<AddEdgeHandler>('ADD_EDGE', graphId, id);
  };

  useEffect(() => {
    if (nodeProperties?.cat){
      setNInputValue(nodeProperties.cat)
    }

    const handleEdgesAdded = (event: Event) => {
      const { graphId } = (event as CustomEvent).detail;
      if (graphId === id) {
      setLocalMode('default');
        confirmAddEdge();
      }
    };

    // Add event listener
    window.addEventListener('edges-added', handleEdgesAdded);

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener('edges-added', handleEdgesAdded);
    };
  }, [graphs, nodeProperties])

  return (
    <div id={`node-${id}`} className="node bg-white p-2 shadow-md rounded-md">
      {/* Node header with toggle button */}
      <button
        className="w-full text-left font-bold text-md mb-1"
        onClick={handleToggleDropdown}
      >
        {isOpen ? '▼' : '▶'} Node: {label} (ID: {id})
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="ml-4 space-y-2">
          {/* Split container with flexbox */}
          <div className="flex">
            {/* Left side: Properties */}
            <div className="w-1/2 pr-4 border-r border-gray-300">
              <div>
                <span className="font-bold">Properties:</span>
                <p>ID: {id}</p>
                <p>Label: {label}</p>
                <p>Graph ID: {graphId}</p>

                {nodeProperties && (
                  <div className="mt-2 relative">
                    <div> 
                      {/* Text Input for Filtering Options */}
                      <label className="font-bold mr-2">Category:</label>
                      <input
                        type="text"
                        value={nInputValue} // Shows only the user's input
                        onChange={handleInputChange}
                        className="border p-1 rounded"
                        style={{border: '1px solid black'}}
                        onFocus={() => setIsNDropdownOpen(true)} // Show dropdown on input focus
                        data-prop="category"
                        id='node-category-input'
                      />

                      {/* Dropdown for Filtered Options */}
                      {isNDropdownOpen && filteredCategoryOptions.length > 0 && (
                        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-md z-10">
                          {filteredCategoryOptions.map(([categoryName, categoryValue]) => (
                            <div
                              key={categoryValue}
                              onClick={handleOptionSelect}
                              className="cursor-pointer p-2 hover:bg-gray-100"
                              data-prop="category"
                              data-cat={categoryName}
                            >
                              {categoryName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div> 
                      {/* Text Input for Filtering Options */}
                      <label className="font-bold mr-2">Parent Category:</label>
                      <input
                        type="text"
                        value={pInputValue} // Shows only the user's input
                        onChange={handleInputChange}
                        className="border p-1 rounded"
                        style={{border: '1px solid black'}}
                        onFocus={() => setIsPDropdownOpen(true)} // Show dropdown on input focus
                        data-prop="parent-category"
                      />

                      {/* Dropdown for Filtered Options */}
                      {isPDropdownOpen && filteredParentCategoryOptions.length > 0 && (
                        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-md z-10">
                          {filteredParentCategoryOptions.map(([categoryName, categoryValue]) => (
                            <div
                              key={categoryValue}
                              onClick={handleOptionSelect}
                              className="cursor-pointer p-2 hover:bg-gray-100"
                              data-prop="parent-category"
                              data-cat={categoryName}
                            >
                              {categoryName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                )}
              </div>
            </div>

            {/* Right side: Edges */}
            <div className="w-1/2 pl-4">
              <div>
                <span className="font-bold">Edges: </span>

                {currentNode && currentNode.nodeProperties && currentNode.nodeProperties.edges.length > 0 ? (
                  <div className="space-y-1">
                    {currentNode.nodeProperties.edges.map((edgeId, index) => {
                      const edge = graph?.edges.find((e) => e.id === edgeId) as ResidentialGraphEdgeData;
                      if (!edge) return null;
                      return <GraphEdge key={index} {...edge} />;
                    })}
                  </div>
                ) : (
                  <p>No connected edges.</p>
                )}
              </div>
            </div>
          </div>

          {/* Button to add edges */}
          <div className="mt-4 space-x-2">
            <button
              onClick={selectNode}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Highlight Node
            </button>

            <button
              onClick={handleAddEdge}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Edges
            </button>

            <button
              onClick={handleAutoEdges}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Auto Edges
            </button>

            {(() => {
              switch(localMode){
                  case 'add-edges':
                      return (
                          <button
                          onClick={confirmAddEdge}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                          Confirm
                          </button>
                      )

                  default:
                      return null
                    }
                })()}

          </div>
        </div>
      )}
    </div>
  );
};

export default GraphNode;

