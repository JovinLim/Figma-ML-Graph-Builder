import { emit } from "@create-figma-plugin/utilities";
import { ResidentialGraphData } from "./residential_graph";
import { NotifyHandler } from "../../../../types";
import { ResidentialGraphNodeProperties } from "../property_templates/residential_node_properties";
import { ResidentialGraphEdgeProperties } from "../property_templates/residential_edge_properties";

export function ValidateResidentialUnitGraph(graph: ResidentialGraphData) {
    const nodes = graph.nodes;
    const edges = graph.edges;
    const props = graph.graphProperties;
  
    // Check for nodes and properties existence
    if (!nodes || nodes.length === 0) {
      emit<NotifyHandler>('NOTIFY', true, "No nodes in graph! Please add some nodes.");
      return false;
    }
  
    if (!props) {
      emit<NotifyHandler>('NOTIFY', true, "Residential graph has no properties! Please check or re-do the graph.");
      return false;
    }

    else if (props){
        // Validate graph properties
        if (!props.br || !Number.isInteger(props.br)) {
            emit<NotifyHandler>('NOTIFY', true, `Invalid graph property: bedroom. Please ensure bedroom is an integer!`);
            return false;
        }

        if (!props.descriptor || props.descriptor == "") {
            emit<NotifyHandler>('NOTIFY', true, `Invalid graph property: descriptor. Please check descriptor!`);
            return false;
        }

        if (!props.attachment || props.attachment == "") {
            emit<NotifyHandler>('NOTIFY', true, `Invalid graph property: attachment. Please check attachment!`);
            return false;
        }

        if (!props.levels || props.levels.length == 0) {
            emit<NotifyHandler>('NOTIFY', true, `Invalid graph property: levels. Please check levels!`);
            return false;
        }
    }
  
    // Validate nodes
    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
  
      // Checking node data
      if (!node.id || node.id.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has an invalid node id.`);
        return false;
      }
      if (!node.graphId || node.graphId.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has an invalid graph id.`);
        return false;
      }
  
      // Checking node properties
      if (!node.nodeProperties) {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has no node properties.`);
        return false;
      }
  
      const nodeProps = node.nodeProperties as ResidentialGraphNodeProperties;
      if (!nodeProps.cat || nodeProps.cat.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has no category (cat) assigned.`);
        return false;
      }
  
      if (!nodeProps.pcat || nodeProps.pcat.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has no parent category (pcat) assigned.`);
        return false;
      }

      if (!nodeProps.gid || Number.isSafeInteger(nodeProps.gid) ) {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has no parent category (pcat) assigned.`);
        return false;
      }
  
      if (!nodeProps.edges || nodeProps.edges.length === 0) {
        emit<NotifyHandler>('NOTIFY', true, `Node "${node.label}" has either no edges or invalid edges assigned.`);
        return false;
      }
    }
  
    // Validate edges
    if (!edges || edges.length === 0) {
      emit<NotifyHandler>('NOTIFY', true, "No edges in graph! Please add some edges.");
      return;
    }
  
    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
  
      // Validate edge data
      if (!edge.id || edge.id.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Edge ${e + 1} has an invalid edge id.`);
        return false;
      }
      if (!edge.sourceNodeId || edge.sourceNodeId.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Edge ${e + 1} has an invalid source node id.`);
        return false;
      }
      if (!edge.targetNodeId || edge.targetNodeId.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Edge ${e + 1} has an invalid target node id.`);
        return false;
      }
  
      // Validate edge properties
      const edgeProps = edge.edgeProperties as ResidentialGraphEdgeProperties;
      if (!edgeProps.cat || edgeProps.cat.trim() === "") {
        emit<NotifyHandler>('NOTIFY', true, `Edge ${e + 1} has no category (cat) assigned.`);
        return false;
      }
    }


    
    return true;
  }