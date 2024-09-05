import { h, createContext } from "preact";
import { generateUUID, GraphData, GraphEdgeData, GraphEdgeProperties, GraphNodeData, GraphNodeProperties, GraphProperties } from "../lib/core";
import { ReactNode, useContext, useState } from "preact/compat";
import { emit } from "@create-figma-plugin/utilities";
import { DehighlightAllNodesHandler, InputNameHandler, NotifyHandler } from "../types";

// Define context type
interface GraphContextType {
    graphs: GraphData[];
    currentGraph: string;
    currentGraphEdges: string[];
    currentGraphNodes: string[];
    highlightedNodes: any[];
    mode:string;
    bidirectional: boolean;

    setCurrentGraphNodes: React.Dispatch<React.SetStateAction<string[]>>;
    setCurrentGraphEdges: React.Dispatch<React.SetStateAction<string[]>>;
    setCurrentGraph: React.Dispatch<React.SetStateAction<string>>;
    setHighlightedNodes: React.Dispatch<React.SetStateAction<any[]>>;
    setMode:React.Dispatch<React.SetStateAction<string>>;

    updateGraphProps: (
      graphId: string,
      props: GraphProperties,
    ) => void;

    updateGraphData: (
      graphId: string,
      newNodes?: GraphNodeData[],
      newEdges?: GraphEdgeData[]
    ) => void;

    createGraph: () => string;

    updateGraphEdges: (
      graphId: string,
      newEdges: GraphEdgeData[]
    ) => void;

    updateGraphNodes: (
      graphId: string,
      newNodes: GraphNodeData[]
    ) => void;

    deleteGraph: (
      graphId: string
    ) => void;

    updateGraphEdgeProperty:(
      graphId:string,
      newEdge: GraphEdgeData
    ) => void

    deleteNode:(graphId: string, 
      nodeId: string
    ) => void

    deleteEdge:(graphId: string, 
      edgeId: string
    ) => void
  }

// Create context
const GraphContext = createContext<GraphContextType | undefined>(undefined);

// Provider component
export const GraphProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [graphs, setGraphs] = useState<GraphData[]>([]);
  const [currentGraphNodes, setCurrentGraphNodes] = useState<string[]>([]);
  const [currentGraphEdges, setCurrentGraphEdges] = useState<string[]>([]);
  const [currentGraph, setCurrentGraph] = useState<string>("");
  const [highlightedNodes, setHighlightedNodes] = useState<any[]>([]);
  const [mode, setMode] = useState<string>("default");
  const bidirectional = true;

  const updateGraphProps = (
    graphId: string,
    props: GraphProperties
  ) => {
    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs
        graph.graphProperties = props;
        return { ...graph }; // Return updated graph
      })
    );
  }

  const updateGraphEdgeProperty = (graphId: string, newEdge: GraphEdgeData) => {
    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs
  
        // Check if both source and target nodes exist in the graph
        const updatedEdges = [...graph.edges];
  
        // Check if the edge already exists
        const existingEdgeIndex = updatedEdges.findIndex(
          (edge) =>
            (edge.sourceNodeId === newEdge.sourceNodeId &&
              edge.targetNodeId === newEdge.targetNodeId)
        );
  
        if (existingEdgeIndex !== -1) {
          // Check if the existing edge properties are different from the new edge properties
          const existingEdge = updatedEdges[existingEdgeIndex];
  
          if (JSON.stringify(existingEdge.edgeProperties) !== JSON.stringify(newEdge.edgeProperties)) {
            // Update the existing edge's properties
            updatedEdges[existingEdgeIndex] = {
              ...existingEdge,
              edgeProperties: newEdge.edgeProperties,
            };
            console.log(`Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} was updated with new properties.`);
          } else {
            console.log(`Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} already exists with the same properties.`);
          }
        } else {
          // Notify the user if the edge does not exist
          console.log(`Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} does not exist in graph ${graphId}.`);
          emit<NotifyHandler>(
            "NOTIFY",
            true,
            `Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} does not exist in graph. Please add it first.`
          );
        }
  
        return { ...graph, edges: updatedEdges };
      })
    );
  };

  // Function to update edges in a graph
  const updateGraphEdges = (graphId: string, newEdges: GraphEdgeData[]) => {
    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs
  
        // Check if both source and target nodes exist in the graph
        const updatedNodes = [...graph.nodes];
        const updatedEdges = [...graph.edges];
  
        newEdges.forEach((newEdge) => {
          const sourceNodeExists = updatedNodes.some((node) => node.id === newEdge.sourceNodeId);
          const targetNodeExists = updatedNodes.some((node) => node.id === newEdge.targetNodeId);
  
          if (!sourceNodeExists || !targetNodeExists) {
            // Post a message to alert the user if a node does not exist
            const missingNode = !sourceNodeExists ? newEdge.sourceNodeId : newEdge.targetNodeId;
            console.log(`Node with ID ${missingNode} does not exist in graph ${graphId}.`);
            emit<NotifyHandler>(
              "NOTIFY",
              true,
              "Node does not exist in graph. Please add it to the graph first."
            );
            return; // Skip adding this edge
          }
  
          // Check if the edge already exists
          const existingEdgeIndex = updatedEdges.findIndex(
            (edge) =>
              (edge.sourceNodeId === newEdge.sourceNodeId &&
                edge.targetNodeId === newEdge.targetNodeId)
          );
  
          if (existingEdgeIndex !== -1) {
            // Check if the existing edge properties are different from the new edge properties
            const existingEdge = updatedEdges[existingEdgeIndex];
  
            if (JSON.stringify(existingEdge.edgeProperties) !== JSON.stringify(newEdge.edgeProperties)) {
              // Replace the existing edge with the new edge
              updatedEdges[existingEdgeIndex] = newEdge;
              console.log(`Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} was updated with new properties.`);
            } else {
              console.log(`Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} already exists with the same properties.`);
            }
            return; // Skip adding this edge if it already exists with the same properties
          }
  
          // If both nodes exist and edge does not already exist, update the edges in the graph
          updatedEdges.push(newEdge);
  
          // Add the reverse edge
          const reverseEdgeIndex = updatedEdges.findIndex(
            (edge) =>
              edge.sourceNodeId === newEdge.targetNodeId && edge.targetNodeId === newEdge.sourceNodeId
          );
  
          if (reverseEdgeIndex === -1) {
            // Add the reverse edge if it doesn't exist
            updatedEdges.push({
              ...newEdge,
              sourceNodeId: newEdge.targetNodeId,
              targetNodeId: newEdge.sourceNodeId,
              id: generateUUID(), // Generate a new unique ID for the reverse edge
            });
          }
  
          // Update the source and target nodes with the new edge ID
          updatedNodes.forEach((node) => {
            if (node.id === newEdge.sourceNodeId || node.id === newEdge.targetNodeId) {
              if (!node.nodeProperties) {
                node.nodeProperties = { edges: [], cat: "" } as GraphNodeProperties; // Initialize if not present
              }
              if (!node.nodeProperties.edges.includes(newEdge.id)) {
                node.nodeProperties.edges.push(newEdge.id); // Add the new edge ID
              }
            }
  
            // Update the reverse edge ID for the opposite nodes
            if (node.id === newEdge.targetNodeId || node.id === newEdge.sourceNodeId) {
              const reverseEdgeId = updatedEdges.find(
                (edge) =>
                  edge.sourceNodeId === newEdge.targetNodeId &&
                  edge.targetNodeId === newEdge.sourceNodeId
              )?.id;
  
              if (reverseEdgeId && !node.nodeProperties?.edges.includes(reverseEdgeId)) {
                node.nodeProperties?.edges.push(reverseEdgeId);
              }
            }
          });
        });
  
        return { ...graph, nodes: updatedNodes, edges: updatedEdges }; // Return updated graph
      })
    );
  };
  

  const updateGraphNodes = (graphId: string, newNodes: GraphNodeData[]) => {
    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs
  
        const updatedNodes = [...graph.nodes];
  
        newNodes.forEach((newNode) => {
          // Check if nodeProperties is null or undefined, and set default properties
          if (!newNode.nodeProperties) {
            newNode.nodeProperties = {
              edges: [], // Initialize with an empty array for edges
            } as GraphNodeProperties;
          }
  
          const existingNodeIndex = updatedNodes.findIndex((node) => node.id === newNode.id);
          if (existingNodeIndex !== -1) {
            updatedNodes[existingNodeIndex] = newNode as GraphNodeData;
          } else {
            updatedNodes.push(newNode as GraphNodeData);
          }
        });
  
        return { ...graph, nodes: updatedNodes }; // Return updated graph
      })
    );
  };

  const updateGraphData = (
    graphId: string,
    newNodes?: GraphNodeData[],
    newEdges?: GraphEdgeData[]
  ) => {
    if (newNodes) {
      updateGraphNodes(graphId, newNodes); // Update nodes
    }
  
    if (newEdges) {
      updateGraphEdges(graphId, newEdges); // Update edges
    }
  };

  // Function to create a new graph
  const createGraph = () => {
    const newGraph: GraphData = {
      id: generateUUID(),
      nodes: [],
      edges: [],
      graphProperties: null,
    };
    // var graphId_ = newGraph.id;
    // emit<InputNameHandler>('INPUT_NAME', graphId_);
    setGraphs((prevGraphs) => [...prevGraphs, newGraph]);
    setCurrentGraph(newGraph.id)
    return newGraph.id;
  };

  // Function to delete a graph
  const deleteGraph = (graphId: string) => {
    emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES');
    setHighlightedNodes([]);
    setGraphs((prevGraphs) => {
      // Filter out the graph with the matching graphId
      const updatedGraphs = prevGraphs.filter((graph) => graph.id !== graphId);
  
      // If the current graph is the one being deleted, reset the current graph
      if (currentGraph === graphId) {
        setCurrentGraph(updatedGraphs?.length > 0 ? updatedGraphs[-1].id : ""); // Set to the first graph or null if none
      }
  
      return updatedGraphs; // Update state with the new list
    });
  };

  // Function to delete a node from a graph
  const deleteNode = (graphId: string, nodeId: string) => {
    emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES'); // Emit event to dehighlight all nodes
    setHighlightedNodes([]); // Clear highlighted nodes

    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs

        // Remove the node from the graph's nodes
        const updatedNodes = graph.nodes.filter((node) => node.id !== nodeId);

        // Find and remove edges associated with the node
        const updatedEdges = graph.edges.filter(
          (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
        );

        // Update each node's nodeProperties to remove deleted edge references
        const nodesWithUpdatedEdges = updatedNodes.map((node) => {
          if (node.nodeProperties) {
            const filteredEdges = node.nodeProperties.edges.filter((edgeId) =>
              updatedEdges.some((edge) => edge.id === edgeId) // Keep only the edges that still exist
            );
            node.nodeProperties.edges = filteredEdges;
          }
          return node;
        });

        return { ...graph, nodes: nodesWithUpdatedEdges, edges: updatedEdges }; // Return updated graph
      })
    );
  };

  const deleteEdge = (graphId: string, edgeId: string) => {
    setGraphs((prevGraphs) =>
      prevGraphs.map((graph) => {
        if (graph.id !== graphId) return graph; // Skip other graphs
  
        // Remove the edge from the graph's edges
        const updatedEdges = graph.edges.filter((edge) => edge.id !== edgeId);
  
        // Update each node's nodeProperties to remove the deleted edge reference
        const nodesWithUpdatedEdges = graph.nodes.map((node) => {
          if (node.nodeProperties) {
            const filteredEdges = node.nodeProperties.edges.filter((eId) => eId !== edgeId); // Remove the deleted edge ID
            node.nodeProperties.edges = filteredEdges;
          }
          return node;
        });
  
        return { ...graph, nodes: nodesWithUpdatedEdges, edges: updatedEdges }; // Return updated graph
      })
    );

    emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES');
  };

  return (
    <GraphContext.Provider value={{
      graphs, 
      currentGraph, 
      currentGraphEdges, 
      currentGraphNodes, 
      highlightedNodes,
      mode,
      bidirectional,
      setCurrentGraphNodes,
      setCurrentGraphEdges,
      setCurrentGraph,
      setHighlightedNodes,
      setMode,
      updateGraphData, 
      createGraph, 
      updateGraphEdges, 
      updateGraphNodes, 
      updateGraphProps,
      deleteGraph,
      updateGraphEdgeProperty,
      deleteNode,
      deleteEdge
    }}>
      {children}
    </GraphContext.Provider>
  );
};

// Custom hook to use the GraphContext
export const useGraphContext = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraphContext must be used within a GraphProvider');
  }
  return context;
};