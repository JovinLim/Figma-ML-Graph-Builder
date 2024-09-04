import { GraphEdgeData } from "./edge_properties";
import { GraphNodeData } from "./node_properties";

export interface GraphData {
    id: string;
    nodes: GraphNodeData[];
    edges: GraphEdgeData[];
    graphProperties: GraphProperties | null;
}

export interface GraphProperties{
    name: string;
}