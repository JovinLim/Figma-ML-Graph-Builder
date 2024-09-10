import '!prismjs/themes/prism.css'

import {
  Button,
  Container,
  render,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h, JSX, RefObject } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { highlight, languages } from 'prismjs'
import Editor from 'react-simple-code-editor'
import '!./output.css'
import styles from './styles.css'
import { AddNodeHandler, AutoEdgeHandler, DehighlightAllNodesHandler, DehighlightNodesHandler, ExportGraphJSON, InsertCodeHandler, NotifyHandler } from './types'
import Graph from './components/Graph'
import { drawingScale, generateUUID, getRandomColor, pixelToM, toggleDropdown, UIHeight, UIWidth } from './lib/utils'
import { DefaultResidentialEdgeCategory, ResidentialGraphData, ResidentialGraphEdgeData, ResidentialGraphJSONData, ResidentialGraphNodeData, ResidentialGraphNodeProperties, ResidentialGraphNodeJSONData, ResidentialGraphEdgeJSONData, ResidentialGraphProperties, ExternalUnitCategories, ResidentialEdgeCategories, ResidentialGraphDescriptor, ResidentialGraphAttachment, GraphGlobalProperties, defaultAreaUnit, ResidentialNodeCategories, nonGFACategories, WalledCategories } from './lib/types'
import { FigmaNodeGeometryData, GraphData, GraphEdgeData, GraphNodeData } from './lib/core'
import { GraphProvider, useGraphContext } from './components/GraphContext'
import React, { ChangeEvent, createPortal } from 'preact/compat'
import { ValidateResidentialUnitGraph } from './lib/types/residential/graph/validation'

console.log("Starting Graph Builder Plugin...")
const debug = true;
const Plugin: React.FC = () => {
  /**DONT TOUCH*/
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}`)
  const containerElementRef : RefObject<HTMLDivElement> = useRef(null)
  const handleInsertCodeButtonClick = useCallback(
    function () {
      emit<InsertCodeHandler>('INSERT_CODE', code)
    },
    [code]
  )
  

  useEffect(function () {
    const containerElement = containerElementRef.current
    if (containerElement === null) {
      return
    }
    const textAreaElement = containerElement.querySelector('textarea')
    if (textAreaElement === null) {
      return
    }
    textAreaElement.textContent = code
    const preElement = containerElement.querySelector('pre')
    if (preElement === null) {
      return
    }
    if (textAreaElement.nextElementSibling !== preElement) {
      textAreaElement.after(preElement)
    }

  }, [code])
  /**DONT TOUCH*/


  return (
    <GraphProvider>
      <EventDispatcher/>
      <MainPage/>
    </GraphProvider>
  );
}

const MainPage: React.FC<GraphActionButtonsProps> = () => {
  const {mode} = useGraphContext(); // Use the context to get the createGraph function
  return (
    <div style={{width: `${UIWidth}`, height:`${UIHeight}`}}>
      {(() => {
        switch (mode) {
          case 'input':
            return <InputContainer/>;

          default:
            return (
              <Container space="large" className="relative h-full" style={{width: `100%`, height:`100%`}}>
                <VerticalSpace space="small" />

                {/* Consume the context to render graphs dynamically */}
                <GraphContainer />

                {/* Fixed buttons at the bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between">
                  <GraphActionButtons />
                </div>

                <VerticalSpace space="small" />
              </Container>
            );
        }
      })()}
    </div>
  );
};

interface InputContainerProps {
}

const InputContainer: React.FC<InputContainerProps> = () => {
  const { updateGraphProps, mode, setMode, currentGraph, graphs } = useGraphContext();


  // For unit descriptor
  const [dInputValue, setDInputValue] = useState<string>("");

  // For unit attachment
  const [aInputValue, setAInputValue] = useState<string>("");

  // For annotators
  const [annotators, setAnnotators] = useState<JSX.Element[]>([]); // State to hold the names
  const [annotatorInputValue, setAnnotatorInputValue] = useState<string>(''); // State to hold input value
  const [remainingAnnotators, setRemainingAnnotators] = useState<string[]>([]); // Annotators to be processed

  // For comments
  const [comments, setComments] = useState<JSX.Element[]>([]); // State to hold the names
  const [commentsInputValue, setCommentsInputValue] = useState<string>(''); // State to hold input value

  const inputRef = useRef<HTMLInputElement>(null);
  const dDropdownRef = useRef<HTMLDivElement>(null);
  const aDropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter options dynamically based on user input for category or parent category
  const filteredDescriptorOptions = Object.entries(ResidentialGraphDescriptor).filter(([key]) =>
    key.toLowerCase().includes(dInputValue.toLowerCase())
  );

  const filteredAttachmentOptions = Object.entries(ResidentialGraphAttachment).filter(([key]) =>
    key.toLowerCase().includes(aInputValue.toLowerCase())
  );

  // Function to handle adding a new annotator
  const handleAddAnnotator = () => {
    if (annotatorInputValue.trim() !== '') {
      const annotatorName = annotatorInputValue.trim();
      const randomColor = getRandomColor(); // Generate random color
      const annotatorDiv = (
        <div
          key={annotatorInputValue.trim()}
          data-prop="annotator"
          data-key={annotatorInputValue.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 10px',
            backgroundColor: randomColor, // Assign random background color
            borderRadius: '5px',
            color: '#fff',
          }}
        >
          {annotatorInputValue.trim()}
          <button
            onClick={() => handleDeleteAnnotator(annotatorInputValue.trim())} // Delete name on click
            style={{
              marginLeft: '10px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>
      );

      setAnnotators((prevAnnotators) => [...prevAnnotators, annotatorDiv]); // Add the new annotator div to the state
      setAnnotatorInputValue(''); // Clear input field
    }
  };

  // Function to handle deleting an annotator
  const handleDeleteAnnotator = (name: string) => {
    setAnnotators((prevAnnotators) =>
      prevAnnotators.filter(
        (annotator) => annotator.props['data-key'] !== name // Remove annotator with matching data-key
      )
    );
  };

  // Function to handle adding a new comment
  const handleAddComment = () => {
    if (commentsInputValue.trim() !== '') {
      const commentId = generateUUID();
      const commentDiv = (
        <div style={{width:'100%'}}>
          <div
            key={commentsInputValue.trim()}
            data-prop="comment"
            data-key={commentId}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '5px 10px',
              backgroundColor: 'rgb(240 240 240)', // Assign grey bg
              borderRadius: '5px',
              color: 'black',
              textAlign: 'left',
            }}
          >
            {commentsInputValue}
            <button
              onClick={() => handleDeleteComment(commentId)} // Delete name on click
              style={{
                marginLeft: '10px',
                background: 'transparent',
                border: 'none',
                color: 'black',
                cursor: 'pointer',
              }}
            >
              X
            </button>
          </div>
        </div>
      );

      setComments((prevComments) => [...prevComments, commentDiv]); // Add the new annotator div to the state
      setCommentsInputValue(''); // Clear input field
    }
  };

  // Function to handle deleting an comment
  const handleDeleteComment = (id: string) => {
    setComments((prevComments) =>
      prevComments.filter(
        (comment) => comment.props['data-key'] !== id // Remove annotator with matching data-key
      )
    );
  };

  // Handle level input change
  const HandleTextInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target_ = event.target as HTMLInputElement;
    const prop_ = target_.getAttribute('data-prop');

    switch (prop_) {
      case 'level-upper':
        var newValue = target_.value;
        if (!Number.isInteger(Number(newValue))){
          emit<NotifyHandler>('NOTIFY', true, "Please input a valid integer for level upper bound.")
        }
        break;

      case 'level-lower':
        var newValue = target_.value;
        if (!Number.isInteger(Number(newValue))){
          emit<NotifyHandler>('NOTIFY', true, "Please input a valid integer for level lower bound.")
        }
        break;
    }
  };

  // Handle input change for descriptor and selector
  const handleSelectInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target_ = event.target as HTMLInputElement;
    console.log(target_)
    const prop_ = target_.getAttribute('data-prop');

    switch (prop_) {
      case 'descriptor':
        var newValue = target_.value;
        setDInputValue(newValue); // Update input value
        break;

      case 'attachment':
        var newValue = target_.value;
        setAInputValue(newValue); // Update input value
        break;
    }
  };

  const handleInputConfirm = (newName: string, graphScale: number, graphProject:string, 
                              graphBR: number, graphUnitType:string ,graphDescriptor:string, 
                              graphAttachment:string, graphLevels:number[], graphComments:string[],
                              graphAnnotators:string[]) => {
    if (currentGraph){
      // Update the graph properties with the new name and switch back to 'default' mode
      updateGraphProps(currentGraph, { name: newName, scale:graphScale, project: graphProject, 
                                       br:graphBR, unit_type: graphUnitType, descriptor:graphDescriptor, 
                                       attachment:graphAttachment, levels:graphLevels, comments:graphComments, annotators:graphAnnotators} as ResidentialGraphProperties); // Assuming the graph properties include 'name'
      setMode('default');
    }
  };

  const confirmInput = () => {
    const nameInput = document.getElementById('graphNameInput') as HTMLInputElement;
    const scaleInput = document.getElementById('graphScaleInput') as HTMLInputElement;
    const projectInput = document.getElementById('graphProjectInput') as HTMLInputElement;
    const BRInput = document.getElementById('graphBRInput') as HTMLInputElement;
    const unitTypeInput = document.getElementById('graphUTInput') as HTMLInputElement;
    const DescriptorInput = document.getElementById('graphDescriptorInput') as HTMLInputElement;
    const AttachmentInput = document.getElementById('graphAttachmentInput') as HTMLInputElement;
    const levelLowerInput = document.getElementById('graphLevelLowerInput') as HTMLInputElement;
    const levelUpperInput = document.getElementById('graphLevelUpperInput') as HTMLInputElement;

    if (nameInput && currentGraph && scaleInput && projectInput && BRInput && DescriptorInput && AttachmentInput) {
      try {
        const graphName = nameInput.value;
        const graphProject = projectInput.value;
        const graphScale = Number(scaleInput.value);
        const graphBR = Number(BRInput.value);
        const graphUnitType = unitTypeInput.value;
        const graphDescriptor = DescriptorInput.value;
        const graphAttachment = AttachmentInput.value;
        const graphLevelLower = Number(levelLowerInput.value);
        const graphLevelUpper = Number(levelUpperInput.value);

        if (graphName == "" || graphName == undefined || graphName == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid text for graph name."); return;} // Name check
        else if (typeof graphScale !== "number" || graphScale==0){emit<NotifyHandler>('NOTIFY', true, "Please input a valid number for scale."); return;} // Scale check
        else if (graphProject == "" || graphProject == undefined || graphProject == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid text project name."); return;} // Project name check
        else if (typeof graphBR !== "number" || graphBR==0 || !Number.isInteger(graphBR)){emit<NotifyHandler>('NOTIFY', true, "Please input a valid integer for bedrooms."); return;} // Bedrooms check
        else if (graphUnitType == "" || graphUnitType == undefined || graphUnitType == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid text as unit type."); return;} // Descriptor check
        else if (graphDescriptor == "" || graphDescriptor == undefined || graphDescriptor == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid descriptor."); return;} // Descriptor check
        else if (graphAttachment == "" || graphAttachment == undefined || graphAttachment == null) {emit<NotifyHandler>('NOTIFY', true, "Please input valid attachment."); return;} // Attachment check
        else if (graphLevelLower == 0 || graphLevelUpper == 0 || graphLevelLower == undefined || graphLevelUpper == undefined || !Number.isInteger(graphLevelLower) || !Number.isInteger(graphLevelUpper)) {emit<NotifyHandler>('NOTIFY', true, "Please ensure upper and lower bound for levels are valid integers."); return;}
        else if (graphLevelLower > graphLevelUpper){emit<NotifyHandler>('NOTIFY', true, "Please ensure level lower bound is smaller than upper bound."); return;} // Levels check - Lower > Upper
        
        const graphComments = [] as string[];
        for (let c=0; c<comments.length; c++){
          const commentElem_ = comments[c];
          const comment_ = commentElem_.key;
          if (typeof comment_ !== "string") {emit<NotifyHandler>('NOTIFY', true, "A comment is not a valid string. Please ensure all of them are proper texts"); return;}
          graphComments.push(comment_);
        }

        const graphAnnotators = [] as string[];
        for (let a=0; a<annotators.length; a++){
          const aElem_ = annotators[a];
          const name_ = aElem_.key;
          if (typeof name_ !== "string") {emit<NotifyHandler>('NOTIFY', true, "A name is not a valid string. Please ensure all of them are proper texts"); return;}
          graphAnnotators.push(name_);
        }

        handleInputConfirm(graphName, graphScale, graphProject, graphBR, graphUnitType, graphDescriptor, graphAttachment, [graphLevelLower, graphLevelUpper], graphComments, graphAnnotators);
      }

      catch {
        emit<NotifyHandler>('NOTIFY', true, "Please input a valid number.");
      }
    }

    else {
      emit<NotifyHandler>('NOTIFY', true, "Please input valid values for all fields.");
    }
  };


  useEffect(() => {
    if (currentGraph){
      console.log('Editing graph details...')
      const nameInput = document.getElementById('graphNameInput') as HTMLInputElement;
      const scaleInput = document.getElementById('graphScaleInput') as HTMLInputElement;
      const projectInput = document.getElementById('graphProjectInput') as HTMLInputElement;
      const BRInput = document.getElementById('graphBRInput') as HTMLInputElement;
      const DescriptorInput = document.getElementById('graphDescriptorInput') as HTMLInputElement;
      const AttachmentInput = document.getElementById('graphAttachmentInput') as HTMLInputElement;
      const levelLowerInput = document.getElementById('graphLevelLowerInput') as HTMLInputElement;
      const levelUpperInput = document.getElementById('graphLevelUpperInput') as HTMLInputElement;
      const unitTypeInput = document.getElementById('graphUTInput') as HTMLInputElement;
      
      const graph_ = graphs.find((g) => g.id===currentGraph);
      if (graph_) {
        const graphProps_ = graph_.graphProperties as ResidentialGraphProperties;
        if (graphProps_){
          if (graphProps_.name){nameInput.value = graphProps_.name ? graphProps_.name as string : "";}
          if (graphProps_.scale){scaleInput.value = graphProps_.scale ? (graphProps_.scale).toString() as string : "";}
          if (graphProps_.project){projectInput.value = graphProps_.project ? graphProps_.project as string : "";}
          if (graphProps_.unit_type){unitTypeInput.value = graphProps_.unit_type ? graphProps_.unit_type as string : "";}
          if (graphProps_.br){BRInput.value = graphProps_.br ? (graphProps_.br).toString() as string : "";}
          if (graphProps_.descriptor){setDInputValue(graphProps_.descriptor ? (graphProps_.descriptor) as string : "");}
          if (graphProps_.attachment){setAInputValue(graphProps_.attachment ? graphProps_.attachment as string : "");}
          if (graphProps_.levels){levelLowerInput.value = graphProps_.levels ? graphProps_.levels[0].toString() as string : "";}
          if (graphProps_.levels){levelUpperInput.value = graphProps_.levels ? graphProps_.levels[1].toString() as string : "";}
    
          // if (graphProps_.annotators){
          //   const graphAnnotators = graphProps_.annotators as string[];
          //   if (graphAnnotators.length > 0){
          //     for (let ga=0; ga < graphAnnotators.length; ga++){
          //       setAnnotatorInputValue(graphAnnotators[ga])
          //       handleAddAnnotator()
          //     }
          //   }
          // }
    
          if (graphProps_.comments){
            const graphComments = graphProps_.comments;
            if (graphComments.length > 0){
              for (let gc=0; gc< graphComments.length; gc++){
                setCommentsInputValue(graphComments[gc])
                handleAddComment()
              }
            }
          }
        }
      }
    }

    if (debug) {
      const nameInput = document.getElementById('graphNameInput') as HTMLInputElement;
      const scaleInput = document.getElementById('graphScaleInput') as HTMLInputElement;
      const projectInput = document.getElementById('graphProjectInput') as HTMLInputElement;
      const BRInput = document.getElementById('graphBRInput') as HTMLInputElement;
      const DescriptorInput = document.getElementById('graphDescriptorInput') as HTMLInputElement;
      const AttachmentInput = document.getElementById('graphAttachmentInput') as HTMLInputElement;
      const levelLowerInput = document.getElementById('graphLevelLowerInput') as HTMLInputElement;
      const levelUpperInput = document.getElementById('graphLevelUpperInput') as HTMLInputElement;
      nameInput.value = "Lorem Ipsum";
      scaleInput.value = (pixelToM/drawingScale).toString();
      projectInput.value = "Avenue South Residence";
      BRInput.value = "1";
      // setRemainingAnnotators(["jo"]);
    }
  }, [currentGraph, mode]); // Run this effect only once when the component mounts

  useEffect(() => {
    const graph_ = graphs.find((g) => g.id===currentGraph);
    if (graph_) {
      const graphProps_ = graph_.graphProperties as ResidentialGraphProperties;
      if (graphProps_ && graphProps_.annotators){
        const graphAnnotators = graphProps_.annotators as string[];
        if (graphAnnotators.length > 0) {
          setRemainingAnnotators(graphAnnotators); // Set remaining annotators to process
        }
      }
    }
  }, [graphs]);

  useEffect(() => {
    if (annotatorInputValue && remainingAnnotators.length > 0) {
      handleAddAnnotator(); // Call function to add annotator
    }
  }, [annotatorInputValue]); // Dependency array on input value

  useEffect(() => {
    if (remainingAnnotators.length > 0) {
      const nextAnnotator = remainingAnnotators[0];
      setAnnotatorInputValue(nextAnnotator); // Set input value to trigger add
      setRemainingAnnotators((prev) => prev.slice(1)); // Remove the processed annotator
    }
  }, [remainingAnnotators]);

  return (
    <div className="" style={{ padding: '16px', textAlign: 'left', maxWidth:'100%', maxHeight:'100%', height:'100%', width:'100%'}}>
      <p style={{ height:'5%' ,fontSize:'16px' }}>Please enter a name for the graph:</p>
      <input 
      type="text" 
      id="graphNameInput" 
      style={{ height: '5%', width: '100%', padding: '8px', border: '1px solid black' }}
      ref={inputRef}
      data-prop="name"
      placeholder="Graph Name" />

      <div style={{ marginTop:'10px', maxWidth:'100%', maxHeight:'75%', height:'75%', width:'100%'}}>
        <p style={{ height:'5%',fontSize:'16px' }}>Graph Properties</p>
        <div id='graphProps' className="space-y-2" style={{textAlign: 'left', marginTop:'20px', maxWidth:'100%', maxHeight:'90%', height:'90%', width:'100%', overflow:'scroll'}}>
          {/* SCALE PROPERTY */}
          <div id='graphScaleContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Scale (to mm)</p>
            <input 
              type="text" 
              id="graphScaleInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              data-prop="scale"
              placeholder="Enter scale here..." />
          </div>

          {/* PROJECT NAME PROPERTY */}
          <div id='graphProjectContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Project</p>
            <input 
              type="text" 
              id="graphProjectInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              data-prop="project"
              placeholder="Enter project name here..." />
          </div>

          {/* BEDROOMS PROPERTY */}
          <div id='graphBRContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Bedrooms</p>
            <input 
              type="text" 
              id="graphBRInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              data-prop="br"
              placeholder="Number of bedrooms..." />
          </div>

          {/* UNIT TYPE PROPERTY */}
          <div id='graphUTContainer' style={{alignItems: 'center'}} className="flex">
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Unit Type</p>
            <input 
              type="text" 
              id="graphUTInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black' }}
              data-prop="br"
              placeholder="Unit type..." />
          </div>

          {/* LEVELS PROPERTY */}
          <div id="graphLevelsContainer" style={{ alignItems: 'center' }} className="flex">
            <p style={{ width: '20%', textAlign: 'left', fontSize: '12px' }}>Levels</p>

            {/* Input for Lower Bound */}
            <input 
              type="number" 
              id="graphLevelLowerInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black', marginRight: '5px' }} 
              placeholder="Lower bound..." 
              onChange={HandleTextInputChange}
              data-prop="level-lower"
            />

            <span style={{ margin: '0 5px' }}>to</span> {/* Separator between lower and upper bounds */}

            {/* Input for Upper Bound */}
            <input 
              type="number" 
              id="graphLevelUpperInput" 
              style={{ width: '20%', padding: '8px', border: '1px solid black', marginLeft: '5px' }} 
              placeholder="Upper bound..." 
              onChange={HandleTextInputChange}
              data-prop="level-upper"
            />
          </div>

          {/* DESCRIPTOR PROPERTY */}
          <div id='graphDescriptorContainer' style={{alignItems: 'center', position:'relative', display:'flex', flexDirection:'row'}}>
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Descriptor</p>
            <div style={{display:'flex', flexDirection:'column', position:'relative', width: '20%'}}>
              <input
                type="text"
                value={dInputValue} // Shows only the user's input
                onChange={handleSelectInputChange}
                onClick={() => toggleDropdown(dDropdownRef.current)}
                style={{ padding: '8px', border: '1px solid black' }}
                data-prop="descriptor"
                id="graphDescriptorInput"
                placeholder="Select descriptor here..."
              />

              {/* Dropdown for Filtered Options */}
              <div
                data-type="dropdown"
                data-prop="descriptor"
                data-state="hidden"
                ref={dDropdownRef}
                className={`absolute left-0 mt-1 w-full bg-white border shadow-md z-10 hidden`}
                style={{ maxHeight: '200px', overflowY: 'auto', position:'absolute', top:'40px', zIndex:'1000'}}
              >
                {filteredDescriptorOptions.map(([descriptorName, descriptorValue]) => (
                  <div
                    key={descriptorValue}
                    onClick={() => {
                      setDInputValue(descriptorName);
                      toggleDropdown(dDropdownRef.current, 'hidden');
                    }}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    data-prop="descriptor"
                    data-key={descriptorName}
                  >
                    {descriptorName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ATTACHMENT PROPERTY */}
          <div id='graphAttachmentContainer' style={{alignItems: 'center', position:'relative', display:'flex', flexDirection:'row'}}>
            <p style={{width: '20%', textAlign: 'left', fontSize:'12px'}}>Attachment</p>
            <div style={{display:'flex', flexDirection:'column', position:'relative', width: '20%'}}>
              <input
                type="text"
                value={aInputValue} // Shows only the user's input
                onChange={handleSelectInputChange}
                onClick={() => toggleDropdown(aDropdownRef.current)}
                style={{ padding: '8px', border: '1px solid black' }}
                data-prop="attachment"
                id="graphAttachmentInput"
                placeholder="Select attachment here..."
              />

              {/* Dropdown for Filtered Options */}
              <div
                data-type="dropdown"
                data-prop="attachment"
                data-state="hidden"
                ref={aDropdownRef}
                className={`absolute left-0 mt-1 w-full bg-white border shadow-md z-10 hidden`}
                style={{ maxHeight: '200px', overflowY: 'auto', position:'absolute', top:'40px', zIndex:'1000'}}
              >
                {filteredAttachmentOptions.map(([attachmentName, attachmentValue]) => (
                  <div
                    key={attachmentValue}
                    onClick={() => {
                      setAInputValue(attachmentName);
                      toggleDropdown(aDropdownRef.current, 'hidden');
                    }}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    data-prop="attachment"
                    data-key={attachmentName}
                  >
                    {attachmentName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ANNOTATORS PROPERTY */}
          <div id="graphAnnotatorsContainer" style={{ alignItems: 'left', display:'flex', flexDirection:'column', rowGap:'5px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '20%', textAlign: 'left', fontSize: '12px' }}>Annotators</p>
              <input
                type="text"
                id="graphAnnotatorsInput"
                value={annotatorInputValue}
                onChange={(e) => setAnnotatorInputValue((e.target as HTMLInputElement).value)} // Update input value
                style={{ width: '20%', padding: '8px', border: '1px solid black'}}
                data-prop="annotator"
                placeholder="Type a name here..."
              />
              <button
                onClick={handleAddAnnotator}
                style={{
                  padding: '8px',
                  border: '1px solid black',
                  backgroundColor: '#f0f0f0',
                  marginLeft: '5px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>

            {/* Container for displaying added annotators */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              <div style={{width: '20%'}}></div>
              {annotators.map((annotator) => annotator)} {/* Render annotator divs from state */}
            </div>
          </div>

          {/* COMMENTS PROPERTY */}
          <div id="graphCommentsContainer" style={{ alignItems: 'left', display:'flex', flexDirection:'column', rowGap:'5px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '20%', textAlign: 'left', fontSize: '12px' }}>Comments</p>
              <input
                type="text"
                id="graphCommentsInput"
                value={commentsInputValue}
                onChange={(e) => setCommentsInputValue((e.target as HTMLInputElement).value)} // Update input value
                style={{ width: '20%', padding: '8px', border: '1px solid black'}}
                data-prop="comments"
                placeholder="Type a comment here..."
              />
              <button
                onClick={handleAddComment}
                style={{
                  padding: '8px',
                  border: '1px solid black',
                  backgroundColor: '#f0f0f0',
                  marginLeft: '5px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>

            {/* Container for displaying added annotators */}
            <div style={{ display: 'flex', flexDirection:'row'}}>
            <div style={{width: '20%'}}></div>
            <div style={{display:'flex', flexDirection:'column'}}>
              {comments.map((comment) => comment)} {/* Render comments divs from state */}
            </div>
            </div>
          </div>

        </div>
      </div>

      <div  style={{height:'15%'}} className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between">
        <button 
          onClick={confirmInput} 
          id="confirmButton"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          style={{ marginTop: '8px', padding: '8px 16px', fontSize:'12px', bottom:'0' }}>
            Confirm
        </button>
      </div>
    </div>
  );
};

const EventDispatcher: React.FC = () => {

  const { graphs, updateGraphData, setHighlightedNodes, mode, setMode, currentGraph } = useGraphContext();

  const handleOneClickEdges = (event: Event) => {
    const { graphId } = (event as CustomEvent).detail;
    if (mode==='one-click') {
      setMode('autoParents');
      const graph_ = graphs.find((g) => g.id === graphId);
      if (graph_){
        const nodes = graph_.nodes;
        for (let n=0; n<nodes.length; n++){
            const node_ = nodes[n];
            const gNodeIds = nodes
            .filter((node) => node.id !== node_.id)
            .map((node) => node.id);
            emit<AutoEdgeHandler>('AUTO_EDGE', graphId, node_.id, gNodeIds);
        }
      }
    }
  }

  // Handle messages from the Figma plugin
  window.onmessage = (event) => {
    console.log('Received message:', event);

    // Ensure the message format is correct
    var { type, rNodes, graphId } = event.data.pluginMessage;

    if (type === 'add-nodes') {
      // Dispatch 'receive-nodes-data' event
      const receivedNodesDataEvent = new CustomEvent('receive-nodes-data', {
        detail: {
          graphId,
          rNodes,
        },
      });
      window.dispatchEvent(receivedNodesDataEvent);
    }

    else if (type === 'add-edges' || type === 'auto-edges') {
      // console.log(`Adding edges to graph ${graphId}`);
      const newEdges = [] as ResidentialGraphEdgeData[];
    
      for (let n = 0; n < rNodes.length; n++) {
        const node = rNodes[n];
        const { tNodeId, tNodeName, graphId, nodeId } = node; // Destructure node data
        
        const graph_ = graphs.find((g) => g.id===graphId);

        // Find source and target nodes using their IDs
        const sourceNode = (graph_ as ResidentialGraphData).nodes.find((n:ResidentialGraphNodeData) => n.id === nodeId);
        const targetNode = (graph_ as ResidentialGraphData).nodes.find((n:ResidentialGraphNodeData) => n.id === tNodeId);
    
        let edgeCat = DefaultResidentialEdgeCategory['Direct Access']; // Default edge category
        if (sourceNode && targetNode) {
          const sourceCat = sourceNode.nodeProperties?.cat;
          const targetCat = targetNode.nodeProperties?.cat;
          if (!sourceCat || !targetCat) {
            continue
          }

          if (sourceCat == targetCat) {
            edgeCat = ResidentialEdgeCategories['Direct Access'];
          }

          // Check if one of the node categories is in ExternalUnitCategories and the other is not
          if (
            (ExternalUnitCategories.includes(sourceCat) && 
              !ExternalUnitCategories.includes(targetCat))||
            (!ExternalUnitCategories.includes(sourceCat) && 
              ExternalUnitCategories.includes(targetCat))||
            (WalledCategories.includes(sourceCat) && 
              !WalledCategories.includes(targetCat))||
            (!WalledCategories.includes(sourceCat) && 
            WalledCategories.includes(targetCat))
          ) {
            // Check if one of the node categories is ExternalUnitCategories and one is entrance -> direct access
            if (
              (sourceCat.toLowerCase() == 'entrance' && ExternalUnitCategories.includes(targetCat)) ||
              (targetCat.toLowerCase() == 'entrance' && ExternalUnitCategories.includes(sourceCat))
            ) {
              edgeCat = ResidentialEdgeCategories['Door'];
            }

            else {
              // If one of the nodes is in ExternalUnitCategories and the other is not, assign 'Adjacent' category
              edgeCat = ResidentialEdgeCategories['Adjacent'];
            }
          }

          // Check if one of node categories is ac ledge and other is anything other than balcony -> adjacent
          else if (
            (sourceCat.toLowerCase() == 'ac ledge' && targetCat.toLowerCase() !== "balcony") ||
            (targetCat.toLowerCase() == 'ac ledge' && sourceCat.toLowerCase() !== 'balcony')
          ) {
            // If one of the nodes is in ExternalUnitCategories and the other is not, assign 'Adjacent' category
            edgeCat = ResidentialEdgeCategories['Adjacent'];
          }

          // Check if one of node categories is balcony and the other is living room -> door
          else if (
            (sourceCat.toLowerCase() == 'living room' && targetCat.toLowerCase() == "balcony") ||
            (targetCat.toLowerCase() == 'living room' && sourceCat.toLowerCase() == 'balcony')
          ) {
            // If one of the nodes is in ExternalUnitCategories and the other is not, assign 'Adjacent' category
            edgeCat = ResidentialEdgeCategories['Door'];
          }
        }
    
        // Construct new edge data
        const newEdge: ResidentialGraphEdgeData = {
          id: generateUUID(),
          graphId: graphId,
          sourceNodeId: nodeId, // Source node is the nodeId
          targetNodeId: tNodeId, // Target node is the tNodeId
          edgeProperties: {
            cat: edgeCat, // Set the determined edge category
          },
        };
    
        newEdges.push(newEdge);
      }
    
      updateGraphData(graphId, [], newEdges);

      // After adding edges, trigger event for graph to automatically add parents
      if (mode == "autoParents"){
        const autoParentsTrigger = new CustomEvent('auto-parents', {
          detail: {
            graphId,
          },
        });
        window.dispatchEvent(autoParentsTrigger);
      }
    }

    else if (type === 'highlight-nodes'){
      console.log(`Highlighting ${rNodes.length} nodes.`)
      setHighlightedNodes((prevNodes) => [...prevNodes, ...rNodes]);
    }

    else if (type === 'export-graph-json'){
      const graph_ : GraphData | undefined = graphs.find((g) => {
        return g.id === graphId;
      }) as ResidentialGraphData

      if (graph_ && graph_.graphProperties) {
        console.log(`Exporting graph ${graph_.graphProperties.name}`)


        const graphScale_ = (graph_ as ResidentialGraphData).graphProperties?.scale ? (graph_ as ResidentialGraphData).graphProperties?.scale as number : 1
        const graphEdges_ = graph_.edges as ResidentialGraphEdgeData[]
        const graphNodes_ = graph_.nodes as ResidentialGraphNodeData[]

        const nodesJsonData = {} as Record<string, ResidentialGraphNodeJSONData>;
        const edgesJsonData = {} as Record<string, ResidentialGraphEdgeJSONData>;
        const nodesIdMap = {} as Record<string, string>;
        
        for (let n = 0; n < graphNodes_.length; n++) {
          const gNode_ = graphNodes_[n];
        
          // Find the corresponding Figma node data
          const fNode_ = rNodes.find((n_: any) => {
            return n_.id === gNode_.id;
          });
        
          if (fNode_) {
            // Extract corner points from Figma node geometry
            const cornerA = [fNode_.x * graphScale_, (fNode_.y - fNode_.height) * graphScale_];
            const cornerB = [(fNode_.x + fNode_.width)* graphScale_, fNode_.y * graphScale_];
        
            // Compute width and depth (assuming width = horizontal distance, depth = vertical distance)
            const width = fNode_.width * graphScale_;
            const depth = fNode_.height * graphScale_;
        
            // Extract the 'cat' property from the graph node properties
            const cat = ResidentialNodeCategories[gNode_.nodeProperties?.cat as keyof typeof ResidentialNodeCategories] || 'unknown';
            const pcat = ResidentialNodeCategories[gNode_.nodeProperties?.pcat as keyof typeof ResidentialNodeCategories] || cat;
        
            // Use the node's unique ID
            const uid = generateUUID();
        
            // Create a new ResidentialGraphNodeJSONData object
            const nodeJsonData: ResidentialGraphNodeJSONData = {
              cornerA: cornerA,
              cornerB: cornerB,
              cat: cat,
              pcat: pcat,
              width: width,
              depth: depth,
              uid: uid,
            };
        
            // Push the extracted node data to nodesJsonData array
            nodesJsonData[uid] = (nodeJsonData);
            nodesIdMap[gNode_.id] = uid;
          }
        }

        for (let e=0; e<graphEdges_.length; e++) {
          const gEdge_ = graphEdges_[e];
          edgesJsonData[gEdge_.id]=({
            source: nodesIdMap[gEdge_.sourceNodeId],
            target: nodesIdMap[gEdge_.targetNodeId],
            cat: ResidentialEdgeCategories[gEdge_.edgeProperties.cat as keyof typeof ResidentialEdgeCategories] ? ResidentialEdgeCategories[gEdge_.edgeProperties.cat as keyof typeof ResidentialEdgeCategories] : 'ACCESS'
          })
        }

        var gidCount = 0;
        // Iterate over each node in nodesJsonData
        for (let nodeId in nodesJsonData) {
          const nodeJson = nodesJsonData[nodeId];

          // Collect all edges associated with this node where edgeProperties.cat is 'ACCESS'
          const associatedEdges = Object.values(edgesJsonData).filter(edge => 
            (edge.source === nodeJson.uid || edge.target === nodeJson.uid) && edge.cat === 'ACCESS'
          );

          // Initialize a group for nodes with the same 'cat' and connected via 'ACCESS' edges
          const groupNodes = [nodeJson]; // Start with the current node
          const groupNodeIds = [nodeId]; // To keep track of node IDs in the group

          // Check other nodes to see if they belong in the same group
          for (let otherNodeId in nodesJsonData) {
            if (otherNodeId === nodeId) {
              continue; // Skip the current node and already assigned nodes
            }

            const otherNodeJson = nodesJsonData[otherNodeId];

            // Check if the other node shares the same 'cat' and is connected by an 'ACCESS' edge
            const isConnected = associatedEdges.some(edge => 
              (edge.source === nodeJson.uid && edge.target === otherNodeJson.uid) ||
              (edge.source === otherNodeJson.uid && edge.target === nodeJson.uid)
            );

            if (isConnected && otherNodeJson.pcat === nodeJson.pcat) {
              groupNodeIds.push(otherNodeJson.uid)
              groupNodes.push(otherNodeJson)
            }
          }

          // Run through all nodes in groupNodes and collect those with property 'gid'.
          const existingGids = groupNodes.map(node => node.gid).filter(gid => gid !== undefined);

          if (existingGids.length > 0) {
            // If there are more than 1 with property 'gid', get the lowest value
            const lowestGid = Math.min(...existingGids);

            // Run through all nodes in nodesJsonData and assign all nodes with found 'gid' values the lowest.
            for (let allNodeId in nodesJsonData) {
              const allNode = nodesJsonData[allNodeId];
              if (allNode.gid && existingGids.includes(allNode.gid)) {
                allNode.gid = lowestGid;
              }
            }

            // Then, assign all nodes in groupNodes the same gid value.
            groupNodes.forEach(node => {
              node.gid = lowestGid;
            });
          } else {
            // If no existing gid, assign all nodes in groupNodes a new gid value
            groupNodes.forEach(node => {
              node.gid = gidCount;
            });
          }

          // Increment gidCount for the next group
          gidCount++;
        }

        // Instantiate graph global info
        const graphTotalArea = (graph_ as ResidentialGraphData).area ? (graph_ as ResidentialGraphData).area : Object.values(nodesJsonData).reduce((totalArea, node) => {
          // Check if the node's category is not in ExternalUnitCategories before including its area
          if (!ExternalUnitCategories.includes(node.pcat ? node.pcat : node.cat) && !nonGFACategories.includes(node.pcat ? node.pcat : node.cat)) {
            return totalArea + (node.width * node.depth);
          }
          return totalArea; // If it is in the ExternalUnitCategories, do not add its area
        }, 0);

        const project_ = (graph_ as ResidentialGraphData)?.graphProperties?.project ? (graph_ as ResidentialGraphData)?.graphProperties?.project : "unknown"
        const br_ = (graph_ as ResidentialGraphData)?.graphProperties?.br ? (graph_ as ResidentialGraphData)?.graphProperties?.br : "unknown"
        const unitType_ = (graph_ as ResidentialGraphData)?.graphProperties?.unit_type ? (graph_ as ResidentialGraphData)?.graphProperties?.unit_type : "unknown"
        const descriptor_ = (graph_ as ResidentialGraphData)?.graphProperties?.descriptor ? ResidentialGraphDescriptor[(graph_ as ResidentialGraphData)?.graphProperties?.descriptor as keyof typeof ResidentialGraphDescriptor] : "unknown"
        const attachment_ = (graph_ as ResidentialGraphData)?.graphProperties?.attachment ? ResidentialGraphAttachment[(graph_ as ResidentialGraphData)?.graphProperties?.attachment as keyof typeof ResidentialGraphAttachment] : "unknown"
        const levels_ = (graph_ as ResidentialGraphData)?.graphProperties?.levels ? (graph_ as ResidentialGraphData)?.graphProperties?.levels : "unknown"
        const comments = (graph_ as ResidentialGraphData)?.graphProperties?.comments ? (graph_ as ResidentialGraphData)?.graphProperties?.comments : "unknown"
        const annotators = (graph_ as ResidentialGraphData)?.graphProperties?.annotators ? (graph_ as ResidentialGraphData)?.graphProperties?.annotators : "unknown"
        const grade_ = `${br_}br${descriptor_ ? "_"+descriptor_ : ""}${attachment_ ? "+"+attachment_:""}`;

        const graphGlobalInfo = {
          grade: grade_,
          area: graphTotalArea,
          project: project_,
          area_unit: defaultAreaUnit,
          levels: levels_,
          comments: comments,
          annotators: annotators,
          unit_type: unitType_,
          scale: drawingScale,
        } as GraphGlobalProperties;

        const graphJSON = {
          nodes: nodesJsonData,
          edges: edgesJsonData,
          globalInfo: graphGlobalInfo
        } as ResidentialGraphJSONData;

        const jsonString = JSON.stringify(graphJSON, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project_}_${unitType_}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Handle keyboard events
  useEffect(() => {
    window.addEventListener('trigger-oneclick-edges', handleOneClickEdges);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('trigger-oneclick-edges', handleOneClickEdges);
    };
  }, [mode,graphs]);

  return (
    null
  )
}

// Component to render the Graphs and provide buttons to add new graphs
const GraphContainer: React.FC = () => {
  const { graphs, updateGraphData, setHighlightedNodes } = useGraphContext();

  return (
    <div id="graph-info-container" className="space-y-4 mb-24">
      {/* Render Graph components here */}
      {graphs.map((graph) => (
        <Graph key={graph.id} {...graph as ResidentialGraphData} />
      ))}
    </div>
  );
};

interface GraphActionButtonsProps {
}

const GraphActionButtons: React.FC<GraphActionButtonsProps> = () => {
  const { graphs, createGraph, highlightedNodes,  setHighlightedNodes, setCurrentGraph, setMode} = useGraphContext(); // Use the context to get the createGraph function

  const handleCreateGraph = () => {
    const newGraphId = createGraph(); // Create the new graph
    setCurrentGraph(newGraphId); // Set the current graph ID to the newly created graph
    setMode('input'); // Change the mode to 'input' to render InputContainer
  };

  const unselectAllNodes = () => {
    emit<DehighlightAllNodesHandler>('DEHIGHLIGHT_ALL_NODES');
    setHighlightedNodes([]);
  };

  const exportAsJSON = () => {
    graphs.forEach(graph => {
      const validation = ValidateResidentialUnitGraph(graph as ResidentialGraphData);
      if (validation) {
        const nodeIds = graph.nodes.map(n => n.id);
        const edgesData = graph.edges.map(e => ({'id': e.id, 'source':e.sourceNodeId, 'target':e.targetNodeId}));
        const figmaNodeInterface = {
          nodes: nodeIds,
          edges: edgesData
        };
        emit<ExportGraphJSON>('EXPORT_GRAPH_JSON', graph.id, figmaNodeInterface);
      }
    })
  }
  return (
    <div style={{height:'15%'}} className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-between ">
      <Button fullWidth onClick={handleCreateGraph} id="create-graph" className="mr-2">
        Create Graph
      </Button>
      <Button fullWidth onClick={unselectAllNodes} id="dehighlight" className="mr-2">
        Clear Highlights
      </Button>
      <Button fullWidth onClick={exportAsJSON} id="export-json" className="ml-2">
        Export All
      </Button>
    </div>
  );
};

export default render(Plugin)