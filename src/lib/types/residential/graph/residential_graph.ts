import { ResidentialGraphProperties } from "../..";
import { GraphData } from "../../../core";
import { ResidentialGraphEdgeData, ResidentialGraphEdgeJSONData } from "./residential_edge";
import { ResidentialGraphNodeData, ResidentialGraphNodeJSONData } from "./residential_node";

// Residential-specific graph data
export interface ResidentialGraphData extends GraphData {
    nodes: ResidentialGraphNodeData[]; // Override nodes with ResidentialGraphNodeData
    edges: ResidentialGraphEdgeData[];
    graphProperties: ResidentialGraphProperties | null;
}

export interface ResidentialGraphJSONData {
  nodes: Record<string, ResidentialGraphNodeJSONData>;
  edges: Record<string, ResidentialGraphEdgeJSONData>;
  globalInfo: ResidentialUnitGlobalInfo;
}

export interface ResidentialUnitGlobalInfo {
  grade: string,
  project: string,
  area: number
}