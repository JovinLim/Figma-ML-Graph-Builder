import React, { useCallback, useEffect, useState } from 'react';
import GraphEdge from './GraphEdge';
import { h, RefObject } from 'preact'
import GraphNode from './GraphNode';
import { AddNodeHandler, AddNodesGroupHandler, DehighlightAllNodesHandler, DehighlightNodesHandler, HighlightNodesHandler, NotifyHandler } from '../types';
import { emit } from '@create-figma-plugin/utilities';
import { ResidentialGraphData, ResidentialGraphNodeData } from '../lib/types';
import { useGraphContext } from './GraphContext';
import { GraphFigmaNodesInterface } from '../lib/core';
import { Checkbox } from '@create-figma-plugin/ui';

const Graph: React.FC<ResidentialGraphData> = ({ id, nodes, edges, graphProperties }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [useNodeLabels, setUseNodeLabels] = useState<boolean>(false);
    const [nodesDropdownOpen, setNodesDropdownOpen] = useState<boolean>(false);
    const [edgesDropdownOpen, setEdgesDropdownOpen] = useState<boolean>(false);
    const {graphs, setCurrentGraph, setHighlightedNodes, highlightedNodes, mode, setMode, updateGraphData, deleteGraph} = useGraphContext();

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target_ = event.target as HTMLInputElement;
        setUseNodeLabels(target_.checked);
      };

    const selectGraph = () => {
        const highlightedNodeIds = highlightedNodes.map(node => node.highlight_id);
        emit<DehighlightNodesHandler>('DEHIGHLIGHT_NODES', highlightedNodeIds);
        setCurrentGraph(id);

        const nodes_to_highlight = {
            'nodes': [] as string[],
            'edges': [{
              'source' : "",
              'target' : ""
            }]
        } as GraphFigmaNodesInterface;
        
        nodes_to_highlight['nodes'] = nodes.map(node_ => node_.id)
        emit<HighlightNodesHandler>('HIGHLIGHT_NODES', nodes_to_highlight);
    }

    // Function to handle adding new nodes by manual selection
    const handleAddNode = (type:string) => {
        switch (type){
            case 'manual':
                setMode('add-nodes');
            case 'group':
                setMode('add-nodes-group');
        }   
        if (type=='manual'){
            setMode('add-nodes');
        }

        emit<NotifyHandler>('NOTIFY', false, "Please select objects in the Figma file. Press confirm to add nodes.");
    };

    const confirmAddNode = () => {
        if (mode == 'add-nodes') {emit<AddNodeHandler>('ADD_NODE', id) }
        else if (mode == 'add-nodes-group') {emit<AddNodesGroupHandler>('ADD_NODES_BY_GROUP', id)}
    }

    const cancelAddNode = () => {
        setMode('default');
    }

    useEffect(() => {
        const handleNodesAdded = (event: Event) => {
            const { graphId, nodes } = (event as CustomEvent).detail;
            if (graphId === id) {
                const newNodes = [] as ResidentialGraphNodeData[];
                for (let n=0; n<nodes.length; n++){
                    const node = nodes[n];
                    const { fNodeId, fNodeName, graphId } = node; // Destructure node data

                    // Create new node data to pass to the graph component
                    const newNode: ResidentialGraphNodeData = { id: fNodeId, label: fNodeName, graphId: graphId };
                    if (useNodeLabels){
                        newNode.nodeProperties = {
                            edges: [],
                            cat: fNodeName,
                            pcat: ""
                        };
                    }
                    newNodes.push(newNode)
                }
                // Update the corresponding graph component
                updateGraphData(graphId, newNodes, []); // Pass new node to be added
                console.log(`Adding nodes to graph ${graphId}`)
                setMode('default');
                setNodesDropdownOpen(true)
            }
          };
    
        // Add event listener
        window.addEventListener('receive-nodes-data', handleNodesAdded);
    
        // Clean up the event listener when the component is unmounted
        return () => {
          window.removeEventListener('receive-nodes-data', handleNodesAdded);
        };
    }, [id, useNodeLabels]); // Dependencies include 'id' to reattach if the graph id changes

    return (
        <div id={`graph-${id}`} className="bg-white p-4 shadow-md rounded-md">
          <button
            className="w-full text-left font-bold text-lg mb-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '▼' : '▶'} Graph: {graphProperties?.name || ""}
          </button>
    
          {isOpen && (
            <div className="space-y-4">
                {/* Nodes Dropdown */}
                <div className="bg-gray-100 p-2 rounded-md shadow-md">
                <button
                    className="w-full text-left font-bold text-md mb-1"
                    onClick={() => setNodesDropdownOpen(!nodesDropdownOpen)}
                >
                    {nodesDropdownOpen ? '▼' : '▶'} Nodes
                </button>

                {nodesDropdownOpen && (
                    <div className="ml-4 space-y-2">
                    {nodes.map((node) => (
                        <GraphNode
                        key={node.id}
                        id={node.id}
                        label={node.label}
                        graphId={id}
                        nodeProperties={node.nodeProperties}
                        />
                    ))}
                    </div>
                )}
                </div>

                {/* Edges Dropdown */}
                <div className="bg-gray-100 p-2 rounded-md shadow-md">
                <button
                    className="w-full text-left font-bold text-md mb-1"
                    onClick={() => setEdgesDropdownOpen(!edgesDropdownOpen)}
                >
                    {edgesDropdownOpen ? '▼' : '▶'} Edges
                </button>

                {edgesDropdownOpen && (
                    <div className="ml-4 space-y-2">
                    {edges.map((edge, index) => (
                        <GraphEdge
                        key={index}
                        sourceNodeId={edge.sourceNodeId}
                        targetNodeId={edge.targetNodeId}
                        graphId={id}
                        edgeProperties={edge.edgeProperties}
                        id={edge.id}
                        />
                    ))}
                    </div>
                )}
                </div>

                {/* Buttons to Add Nodes */}
                <div className="mt-4 space-x-2" style={{display:'flex', flexDirection:'row'}}>
                    <button
                        onClick={() => handleAddNode('manual')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Nodes
                    </button>

                    <button
                        onClick={() => handleAddNode('group')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Nodes by Group
                    </button>

                    {(() => {
                        switch(mode){
                            case 'add-nodes':
                            case 'add-nodes-group':
                                return (
                                    <div className="space-x-2" style={{display:'flex', flexDirection:'row', textAlign:'center', alignItems:'center'}}>
                                        <div className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                                            <input
                                                id='use-node-labels'
                                                type='checkbox'
                                                name='use-node-labels'
                                                checked={useNodeLabels}
                                                onChange={handleCheckboxChange}
                                                style={{ border: 'solid 1px #ccc', appearance: 'auto' }}
                                            />
                                            <div style={{marginLeft:'2px'}}>
                                                Use Object Name
                                            </div>
                                        </div>

                                        <button
                                        onClick={confirmAddNode}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                        Confirm
                                        </button>

                                        <button
                                        onClick={cancelAddNode}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-green-600"
                                        >
                                        Cancel
                                        </button>
                                    </div>
                                )

                            default:
                                return null
                        }
                    })()}

                    <button
                        onClick={selectGraph}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Highlight
                    </button>

                    <button
                        onClick={() => deleteGraph(id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-blue-600"
                    >
                        Delete
                    </button>
                </div>

                {/* Graph Properties Display */}
                <div id={`graph-${id}-properties`} className="bg-gray-100 p-2 rounded-md shadow-md">
                <h3 className="text-md font-bold mb-2">Graph Properties</h3>
                <div className="ml-4 space-y-1">
                    {graphProperties ? (
                    Object.entries(graphProperties).map(([key, value]) => (
                        <p key={key} className="text-sm">
                        <strong>{key}:</strong> {value}
                        </p>
                    ))
                    ) : (
                    <p className="text-sm">No properties available.</p>
                    )}
                </div>
                </div>

            </div>
          )}
        </div>
      );
};

export default Graph;