import { GraphEdgeProperties } from "../../../core";

export interface ResidentialGraphEdgeProperties extends GraphEdgeProperties {
    cat: string
}

export const ResidentialEdgeCategories = {
    'Direct Access' : 'ACCESS',
    'Adjacent' : 'ADJ',
    'Door' : 'DOOR',
}

export const DefaultResidentialEdgeCategory = {
    'Direct Access' : 'ACCESS'
}