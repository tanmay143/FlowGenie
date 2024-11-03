"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import dynamic from "next/dynamic";


const get_mermaid_code=()=>{
  return `
  graph TD
      C -->|Else| K
      K -->|Alternate search condition?| E
      K -->|End search if out of range| D
      F -->|Alternative case| L
      L -->|Is mid at target boundary?| M
      M -->|Yes| G
      M -->|No| H
      I --> K
      J --> K
`;

};







// Dynamically import Excalidraw (SSR disabled)
const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw), {
  ssr: false,
});

export default function Component() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
 

  const updatedata=async ()=>{

    const data=excalidrawAPI.getSceneElements();
    const id_elements:any={}
    const coordinates:any={}
    const new_arrows:any=[]
    data.forEach((item)=>{
      id_elements[item.id]=item;
      coordinates[item.id]={
        x:item.x,
        y:item.y,
        width:item.width||0,
        height:item.height||0,
        start:item.type=='arrow'?item.startBinding.elementId:undefined,
        end:item.type=='arrow'?item.endBinding.elementId:undefined,
        text:item.text

      }
    });

    const new_mermaid=get_mermaid_code();
    const new_mermaid_code=await parseMermaidToExcalidraw(new_mermaid, {
      fontSize: 16,
    });
    console.log(coordinates);
    // console.log('initial_mermaid',new_mermaid_code);
    let new_shapes:any={}
  
    const get_vertices = (parent, child, b) => {
      // console.log('got to vertices');
      // Assuming parent and child are IDs referring to elements in id_elements
      const PADDING = 150; // Default padding between parent and child
      const SHIFT = 100;   // The shift to check for available space in DFS
  
      const isSpaceFree = (x: number, y: number, width: number, height: number) => {
        // Early return if any coordinate interferes, reducing unnecessary checks
        for (const coord of Object.values(coordinates)) {
            const coordX = coord.x;
            const coordY = coord.y;
            const coordWidth = coord.width || 0;
            const coordHeight = coord.height || 0;
    
            // Check for interference on x and y axes combined (single condition)
            if (
                x < coordX + coordWidth && x + width > coordX &&  // x-axis overlap
                y < coordY + coordHeight && y + height > coordY   // y-axis overlap
            ) {
                return false; // Interference found, return early
            }
        }
        return true; // No interference found
    };
    
    
  
    const findFreeSpace = (x: number, y: number, width: number, height: number, increment: number) => {
      let currentX = x;
      let direction = 1; // Start with right (+ increment) and then alternate
      let step = 0;
    
      while (!isSpaceFree(currentX, y, width, height)) {
        // Alternate between moving left and right
        currentX = x + direction * step * increment;
    
        // Flip direction: 1 for right, -1 for left
        direction *= -1;
    
        // Increment the step after each check (to go further in the next iteration)
        step++;
      }
    
      return currentX;
    };
  
      if (b=='parent') {
          // console.log('parent to child calculations');
          // Update coordinates for parent (above child)
          const childX = coordinates[child].x;
          const childY = coordinates[child].y;

          const widthC = coordinates[child].width;
          const heightC = coordinates[child].height;
          
          // Set parent's new x, y above the child
          let parentX = childX;
          let parentY = childY - PADDING;
  
          // Check for available space using DFS-like approach
          parentX = findFreeSpace(parentX, parentY,widthC,heightC, -SHIFT);
  
          // Update the coordinates for parent
          // console.log('parent coordinates',parent)
          coordinates[parent] = {
              x: parentX,
              y: parentY,
              width: new_shapes[parent].width || 0,
              height: new_shapes[parent].height || 0,
          };
  
          // Update new_shapes object for the parent
          if (new_shapes[parent]) {
              new_shapes[parent].x = parentX;
              new_shapes[parent].y = parentY;
          }
          if (child in id_elements){
          new_shapes[child]=id_elements[child];
          delete id_elements[child];
          }
      } else {
          // Update coordinates for child (below parent)
          // console.log(coordinates)
          // console.log('looking for ',parent)
          const parentX = coordinates[parent].x;
          const parentY = coordinates[parent].y;
  
          // Set child's new x, y below the parent
          let childX = parentX;
          let childY = parentY + PADDING;
  
          // Check for available space using DFS-like approach
          childY = findFreeSpace(childX, childY, SHIFT);

          // Update the coordinates for child
          coordinates[child] = {
              x: childX,
              y: childY,
              width: new_shapes[child].width || 0,
              height: new_shapes[child].height || 0,
          };
  
          // Update new_shapes object for the child
          if (new_shapes[child]) {
              new_shapes[child].x = childX;
              new_shapes[child].y = childY;
          }
  
          // Remove child entry from new_mermaid_code
          if (parent in id_elements){
            new_shapes[parent]=id_elements[parent];
            delete id_elements[parent];
            }
          
      }
      // console.log('updated new_shapes after operation find',new_shapes)
  };

    const get_edges=(item,index)=>{
      console.log(item,index)
      console.log(JSON.stringify(coordinates, null, 2))
      if(!(item.start.id in coordinates) && !(item.end.id in coordinates)){
        // console.log('new_shapes before updating coordiantes',new_shapes);
        let temp=new_shapes[item.start.id]
        coordinates[temp.id] = {
          x: temp.x,
          y: temp.y,
          width: temp.width || 0,
          height: temp.height || 0,
          new:true,
      };
        temp=new_shapes[item.end.id]
        coordinates[temp.id] = {
          x: temp.x,
          y: temp.y,
          width: temp.width || 0,
          height: temp.height || 0,
          new:true,
      };
          return;

      }
      else if(!(item.start.id in coordinates)){
        
        // console.log('enter the function for parent');
        get_vertices(item.start.id,item.end.id,'parent');

      }
      else if(!(item.end.id in coordinates)){
        console.log('child not present',item);
        get_vertices(item.start.id,item.end.id,'child');
      }
      else{
        if(item.start.id in new_shapes && item.start.id in id_elements){
          delete new_shapes[item.start.id]
        }
        if(item.end.id in new_shapes && item.end.id in id_elements){
          delete new_shapes[item.end.id]
        }
      }
      // console.log('show',coordinates[item.start.id],coordinates[item.end.id])
      // console.log('calculating distances between centers');
      let x=coordinates[item.start.id].x
      let y=coordinates[item.start.id].y
      let x1=coordinates[item.end.id].x
      let y1=coordinates[item.end.id].y
      
      const width_start=coordinates[item.start.id].width
      const width_end=coordinates[item.end.id].width
      const height_start=coordinates[item.start.id].height
      // console.log(x);
      // console.log('width_start',width_start)
      x=x+(width_start/2);
      y=y+height_start;
      x1=x1+(width_end/2);
      const diff=[x1-x,y1-y]
      new_arrows[index].x=x
      new_arrows[index].y=y
      new_arrows[index].points=[[0,0],diff];

      

      
    }
    
    
    
    
    // console.log(new_mermaid_code.elements);
    new_shapes={}

    for (let index = 0; index <new_mermaid_code.elements.length ; index++) {
      
      let item = new_mermaid_code.elements[index];
      // console.log(item);
      // console.log('intial task item',item);

      if (item.type!='arrow'){
        // console.log('all elements added to new_shape',item)
        new_shapes[item.id] = item;
        // console.log('check again',new_shapes[item.id],item);
        // console.log(JSON.stringify(new_shapes, null, 2));  // Safely remove without skipping
      }
      else{
        new_arrows.push(item);
      }
    }
    
    console.log(JSON.stringify(new_arrows, null, 2));

    
    for (let index = new_arrows.length - 1; index >= 0; index--) {
      // console.log('debug',new_shapes);
      
      let item = new_arrows[index];
      
      get_edges(item, index);
      
      
    }
    console.log(new_shapes);
    console.log('current elements',Object.values(id_elements))
    const new_excalidrawElements =   convertToExcalidrawElements(new_arrows.concat(Object.values(new_shapes)),{regenerateIds: false});
    // console.log('2',new_excalidrawElements)
      // console.log(new_excalidrawElements);
    
    
      // Update the Excalidraw scene with new elements
      const sceneData = {
        elements: new_excalidrawElements.concat(Object.values(id_elements)),
        appState: {
          viewBackgroundColor: "#edf2ff",
        },
      };

      // Update the scene in Excalidraw
      if (excalidrawAPI) {
        excalidrawAPI.updateScene(sceneData);
        excalidrawAPI.refresh();
      }
      




  }
  
  // Define the scene data
  const diagramDefinition = `
    graph TD
      A --> B
      B --> C
      C -->|No| D
      C -->|Yes| E
      E --> F
      F -->|Yes| G
      F -->|No| H
      H -->|Yes| I
      H -->|No| J
      I --> C
      J --> C

      A["Start"]
      B["Initialize low = 0, high = n-1"]
      C{"Is low <= high?"}
      D["Return -1"]
      E["Calculate mid = low + (high - low) / 2"]
      F{"Is target == arr[mid]?"}
      G["Return mid"]
      H{"Is target < arr[mid]?"}
      I["Set high = mid - 1"]
      J["Set low = mid + 1"]



  `;

  const updateScene = async () => {
    try {
      // Parse Mermaid diagram into Excalidraw elements
      const { elements, files } = await parseMermaidToExcalidraw(diagramDefinition, {
        fontSize: 16,
      });
      // console.log(elements);
      // Convert the parsed elements into Excalidraw's format
      const excalidrawElements =   convertToExcalidrawElements(elements,{regenerateIds: false});
      // console.log(excalidrawElements);

      // Update the Excalidraw scene with new elements
      const sceneData = {
        elements: excalidrawElements,
        appState: {
          viewBackgroundColor: "#edf2ff",
        },
      };

      // Update the scene in Excalidraw
      if (excalidrawAPI) {
        excalidrawAPI.updateScene(sceneData);
      }
      
    } catch (error) {
      console.error("Error parsing Mermaid diagram:", error); 
    }
  };
  
  // const updatedata=;
  return (
    <div className="flex h-screen bg-background">
        <div className="w-64 bg-muted p-4 flex flex-col">
            <p style={{ fontSize: "16px" }}> Click to update the scene</p>
                <button className="custom-button" onClick={updateScene}>
            Update Scene
        </button>
        <button onClick={updatedata}>
          updatedata
        </button>
        </div>
        {/* <button className="custom-button" onClick={updatedata}>
            Send data
        </button> */}
      {/* Main Content - Excalidraw Canvas */}
      <div className="flex-1 bg-white p-4">
        <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api) } />
        </div>
      </div>
    </div>
  );
}
