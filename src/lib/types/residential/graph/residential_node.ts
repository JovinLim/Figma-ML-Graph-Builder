import { GraphNodeData } from "../../../core";
import { ResidentialGraphNodeProperties } from "../property_templates/residential_node_properties";

export interface ResidentialGraphNodeData extends GraphNodeData{
    area? : number;
    nodeProperties?: ResidentialGraphNodeProperties;
}

export interface ResidentialGraphNodeJSONData {
    cornerA: number[],
    cornerB: number[],
    cat: string,
    width: number,
    depth: number,
    uid: string,
    gid?: number,
    pcat?: string
}