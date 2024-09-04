import { GraphEdgeData } from "../../../core";
import { ResidentialGraphEdgeProperties } from "../property_templates/residential_edge_properties";

export interface ResidentialGraphEdgeData extends GraphEdgeData {
    edgeProperties : ResidentialGraphEdgeProperties
}

export interface ResidentialGraphEdgeJSONData {
    source: string
    target: string
    cat: string
}