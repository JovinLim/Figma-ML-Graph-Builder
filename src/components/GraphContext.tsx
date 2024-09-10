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
    ) => Promise<void>;

    updateGraphData: (
      graphId: string,
      newNodes?: GraphNodeData[],
      newEdges?: GraphEdgeData[]
    ) => Promise<void>;

    createGraph: () => Promise<string>;

    updateGraphEdges: (
      graphId: string,
      newEdges: GraphEdgeData[]
    ) => Promise<void>;

    updateGraphNodes: (
      graphId: string,
      newNodes: GraphNodeData[]
    ) => Promise<void>;

    deleteGraph: (
      graphId: string
    ) => Promise<void>;

    updateGraphEdgeProperty:(
      graphId:string,
      newEdge: GraphEdgeData
    ) => Promise<void>

    deleteNode:(
      graphId: string, 
      nodeId: string
    ) => Promise<void>

    deleteEdge:(
      graphId: string, 
      edgeId: string
    ) => void

    toJSON:(
      graphId: string, 
    ) => Promise<string | null>

    saveGraph:(
      graphId: string, 
    ) => Promise<void>
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

  const updateGraphProps = (graphId: string, props: GraphProperties): Promise<void> => {
    return new Promise((resolve) => {
      setGraphs((prevGraphs) =>
        prevGraphs.map((graph) => {
          if (graph.id !== graphId) return graph; // Skip other graphs
          graph.graphProperties = props;
          return { ...graph }; // Return updated graph
        })
      );
      resolve(); // Resolve the promise after updating the graph properties
    });
  };

  const updateGraphEdgeProperty = (graphId: string, newEdge: GraphEdgeData): Promise<void> => {
    return new Promise((resolve) => {
      setGraphs((prevGraphs) =>
        prevGraphs.map((graph) => {
          if (graph.id !== graphId) return graph; // Skip other graphs
  
          // Check if both source and target nodes exist in the graph
          const updatedEdges = [...graph.edges];
  
          // Check if the edge already exists
          const existingEdgeIndex = updatedEdges.findIndex(
            (edge) =>
              edge.sourceNodeId === newEdge.sourceNodeId &&
              edge.targetNodeId === newEdge.targetNodeId
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
            }
          } else {
            // Notify the user if the edge does not exist
            emit<NotifyHandler>(
              "NOTIFY",
              true,
              `Edge between ${newEdge.sourceNodeId} and ${newEdge.targetNodeId} does not exist in graph. Please add it first.`
            );
          }
  
          return { ...graph, edges: updatedEdges };
        })
      );
      resolve(); // Resolve the promise after updating the edge property
    });
  };

  // Function to update edges in a graph
  const updateGraphEdges = (graphId: string, newEdges: GraphEdgeData[]): Promise<void> => {
    return new Promise((resolve) => {
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
  
          resolve();  // Resolve the promise after updating the graph
  
          return { ...graph, nodes: updatedNodes, edges: updatedEdges }; // Return updated graph
        })
      );
    });
  };
  
  const updateGraphNodes = (graphId: string, newNodes: GraphNodeData[]): Promise<void> => {
    return new Promise((resolve) => {
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
  
          resolve();  // Resolve the promise after updating the graph
  
          return { ...graph, nodes: updatedNodes }; // Return updated graph
        })
      );
    });
  };

  const updateGraphData = (
    graphId: string,
    newNodes?: GraphNodeData[],
    newEdges?: GraphEdgeData[]
  ): Promise<void> => {
    return new Promise((resolve) => {
      const promises: Promise<void>[] = [];
  
      if (newNodes) {
        promises.push(updateGraphNodes(graphId, newNodes)); // Update nodes
      }
  
      if (newEdges) {
        promises.push(updateGraphEdges(graphId, newEdges)); // Update edges
      }
  
      Promise.all(promises).then(() => {
        resolve();  // Resolve after both updates are completed
      });
    });
  };

  // Function to create a new graph
  const createGraph = (): Promise<string> => {
    return new Promise((resolve) => {
      const newGraph: GraphData = {
        id: generateUUID(),
        nodes: [],
        edges: [],
        graphProperties: null,
      };
      setGraphs((prevGraphs) => [...prevGraphs, newGraph]);
      setCurrentGraph(newGraph.id);
      resolve(newGraph.id); // Resolve the promise with the new graph ID
    });
  };

  // Function to delete a graph
  const deleteGraph = (graphId: string): Promise<void> => {
    return new Promise((resolve) => {
      emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES');
      setHighlightedNodes([]);
      setGraphs((prevGraphs) => {
        // Filter out the graph with the matching graphId
        const updatedGraphs = prevGraphs.filter((graph) => graph.id !== graphId);
  
        // If the current graph is the one being deleted, reset the current graph
        if (currentGraph === graphId) {
          setCurrentGraph(updatedGraphs.length > 0 ? updatedGraphs[0].id : ""); // Set to the first graph or null if none
        }
  
        return updatedGraphs; // Update state with the new list
      });
      resolve(); // Resolve the promise after deleting the graph
    });
  };

  // Function to delete a node from a graph
  const deleteNode = (graphId: string, nodeId: string): Promise<void> => {
    return new Promise((resolve) => {
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
      resolve(); // Resolve the promise after deleting the node
    });
  };

  const deleteEdge = (graphId: string, edgeId: string): Promise<void> => {
    return new Promise((resolve) => {
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
      resolve(); // Resolve the promise after deleting the edge
    });
  };

  // Export a graph to JSON
  const toJSON = (graphId: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const graph_ = graphs.find((g) => g.id === graphId); // Find the graph by ID
  
      if (graph_) {
        // Create a JSON representation of the graph
        const graphJSON = {
          id: graph_.id,
          nodes: graph_.nodes.map((node) => ({
            id: node.id,
            label: node.label,
            graphId: node.graphId,
            nodeProperties: node.nodeProperties
              ? {
                  edges: node.nodeProperties.edges,
                  // Add other properties if needed
                }
              : undefined,
            subnodes: node.subnodes, // Include subnodes if they exist
          })),
          edges: graph_.edges.map((edge) => ({
            id: edge.id,
            graphId: edge.graphId,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            edgeProperties: edge.edgeProperties, // Include edge properties
          })),
          graphProperties: graph_.graphProperties, // Include graph properties
        };
  
        // Convert the graph JSON object to a string
        const jsonString = JSON.stringify(graphJSON, null, 2); // Pretty-print JSON with 2 spaces
        resolve(jsonString); // Resolve the promise with the JSON string
      } else {
        resolve(null); // Resolve the promise with null if the graph is not found
      }
    });
  };

  // Function to save graph as a JSON file
  const saveGraph = (graphId: string): Promise<void> => {
    return new Promise((resolve) => {
      const graph_ = graphs.find((g) => g.id === graphId); // Find the graph by ID
  
      if (graph_) {
        toJSON(graph_.id).then((graphJSON) => {
          if (graphJSON) {
            // Create a Blob from the JSON string
            const blob = new Blob([graphJSON], { type: 'application/json' });
  
            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); // Create a URL for the Blob
            link.download = `${graphId}.json`; // Set the download filename using graphId
  
            // Append the anchor to the document body and trigger a click to start the download
            document.body.appendChild(link);
            link.click();
  
            // Clean up by removing the temporary anchor element
            document.body.removeChild(link);
            resolve(); // Resolve the promise after saving the graph
          } else {
            console.error('Failed to convert graph to JSON.');
            resolve(); // Resolve even if there's an error
          }
        });
      } else {
        console.error('Graph not found.');
        resolve(); // Resolve if the graph is not found
      }
    });
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
      deleteEdge,
      toJSON,
      saveGraph
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