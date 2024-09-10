import { GraphProperties } from "../../../core";

export interface ResidentialGraphProperties extends GraphProperties {
    br?: number
    unit_type?: string
    descriptor?: string
    attachment?: string
    area?: number
    scale?: number
    project?: string
    levels?: number[]
    comments?: string[]
    annotators?: string[]
}

export const ResidentialGraphDescriptor = { // descriptor : descriptor shortened
    "none": "",
    "compact": "co",
    "premium": "pr",
    "flexi": "fl",
    "penthouse": "ph",
}

export const ResidentialGraphAttachment = {
    "none": "",
    "study": "s",
}

export interface GraphGlobalProperties {
    'grade':string,
    'area':number,
    'area_unit':string,
    'levels':number[],
    'comments':string[],
    'annotators':string[],
    'project':string,
    'unit_type':string,
}

export const defaultAreaUnit = 'sqm';