import { GraphProperties } from "../../../core";

export interface ResidentialGraphProperties extends GraphProperties {
    grade?: string
    area?: number
    scale?: number
    project?: string
}