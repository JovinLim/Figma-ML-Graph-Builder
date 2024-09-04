export interface GraphNodeProperties {
    edges: string[];
}

export interface GraphNodeData {
  id: string;
  label: string;
  graphId: string;
  nodeProperties?: GraphNodeProperties;
  subnodes?: GraphNodeData[];
}