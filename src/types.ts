import { EventHandler } from '@create-figma-plugin/utilities'
import { GraphFigmaNodesInterface } from './lib/core'

export interface InsertCodeHandler extends EventHandler {
  name: 'INSERT_CODE'
  handler: (code: string) => void
}

export interface AddNodeHandler extends EventHandler {
  name: 'ADD_NODE'
  handler: (id: string) => void
}

export interface NotifyHandler extends EventHandler {
  name: 'NOTIFY'
  handler: (error: boolean, id: string) => void
}

export interface AddEdgeHandler extends EventHandler {
  name: 'ADD_EDGE'
  handler: (graphId:string, nodeId:string) => void
}

export interface AutoEdgeHandler extends EventHandler {
  name: 'AUTO_EDGE'
  handler: (graphId:string, nodeId:string, gNodeIds:string[]) => void
}

export interface InputNameHandler extends EventHandler {
  name: 'INPUT_NAME'
  handler: (graphId:string) => void
}

export interface ExportGraphJSON extends EventHandler{
  name:'EXPORT_GRAPH_JSON'
  handler: (graphId:string, fNodes:GraphFigmaNodesInterface) => void
}

export interface HighlightNodesHandler extends EventHandler{
  name:'HIGHLIGHT_NODES'
  handler: (fNodes:GraphFigmaNodesInterface) => void
}

export interface DehighlightNodesHandler extends EventHandler{
  name:'DEHIGHLIGHT_NODES'
  handler: (fNodeIds:string[]) => void
}

export interface DehighlightAllNodesHandler extends EventHandler{
  name:'DEHIGHLIGHT_ALL_NODES'
  handler: () => void
}