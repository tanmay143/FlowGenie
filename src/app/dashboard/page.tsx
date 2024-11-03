"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRef, useState } from "react";
import { ChevronRight, Home, Layers, MessageSquare, Mic2, PenTool, Send, Settings, Users } from "lucide-react"
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import {chatgpt_api} from '@/components/server/get_points';
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);


const get_output_from_input= async (input,message_old,excalidrawAPI)=>{
  

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
        type:item.type,

      }
    });
    //seperate input to chat gpt
    let {code:new_mermaid,message}=await chatgpt_api(input,message_old,data);
    
    if(!new_mermaid){
      return message;
    }
    const new_mermaid_code=await parseMermaidToExcalidraw(new_mermaid, {
      fontSize: 16,
    });
    // console.log('initial_mermaid',new_mermaid_code);
    let new_shapes:any={}
  
    const get_vertices = (parent, child, b) => {
      // console.log('got to vertices');
      // Assuming parent and child are IDs referring to elements in id_elements
      const PADDING = 100; // Default padding between parent and child
      const SHIFT = 150;   // The shift to check for available space in DFS
  
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
    
    
  
      const findFreeSpace = (x: number, y: number,width,height, increment: number) => {
          let currentx = x;
          while (!isSpaceFree(currentx, y,width,height)) {
              currentx += increment;
          }
          return currentx;
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
          const widthC = coordinates[parent].width;
          const heightC = coordinates[parent].height;
          // Set child's new x, y below the parent
          let childX = parentX;
          let childY = parentY + PADDING;
  
          // Check for available space using DFS-like approach
          childX = findFreeSpace(childX, childY,widthC,heightC,SHIFT);

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
      if(!(item.start.id in coordinates) && !(item.end.id in coordinates)){
        // console.log('new_shapes before updating coordiantes',item);
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
        // console.log(coordinates[item.end.id.new])
        if(coordinates[item.end.id].new){
          return
        }
        // console.log('enter the function for parent');
        get_vertices(item.start.id,item.end.id,'parent');

      }
      else if(!(item.end.id in coordinates)){
        
        if(coordinates[item.start.id].new){
          return
        }
        // console.log('enter the function for child');
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
    
    
    
    
    // console.log('debug1 new_mermaid_code_elements',new_mermaid_code.elements);
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
    
    // console.log(JSON.stringify(new_arrows));

    // console.log(new_shapes);
    for (let index = new_arrows.length - 1; index >= 0; index--) {
      // console.log('debug',new_shapes);
      
      let item = new_arrows[index];
      
      get_edges(item, index);
      
      
    }
    // console.log('new_arrows',new_arrows);
    // console.log('new Shapes',Object.values(new_shapes));
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
      

      return message;


  }

  export default function Component() {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [messages, setMessages] = useState([
      {
        role: "bot",
        content: "Hello! How can I assist you with your drawing today?",
      },
    ]);
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
  
    const sendAudioBlobToWhisperAPI = async (audioBlob: Blob) => {
      const formData = new FormData();
  
      // Convert the blob to a File if needed
      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });
      formData.append("file", audioFile);
      formData.append("model", "whisper-1"); // or specify your chosen model
  
      try {
        const response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: formData,
          }
        );
  
        const result = await response.json();
        console.log("Transcription result:", result);
        return result;
      } catch (error) {
        console.error("Error sending audio to Whisper API:", error);
      }
    };
  
    const toggleRecording = async () => {
      if (isRecording) {
        mediaRecorder.current?.stop();
        setIsRecording(false);
      } else {
        audioChunks.current = [];
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          mediaRecorder.current = new MediaRecorder(stream);
  
          mediaRecorder.current.ondataavailable = (event) => {
            audioChunks.current.push(event.data);
          };
  
          mediaRecorder.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks.current, {
              type: "audio/wav",
            });
            setAudioBlob(audioBlob);
            // Make an API call to send the audioBlob to Whisper
            const transcription = await sendAudioBlobToWhisperAPI(audioBlob);
            setInput(transcription.text);
          };
  
          mediaRecorder.current.start();
          setIsRecording(true);
        } catch (error) {
          console.error("Error accessing the microphone", error);
        }
      }
    };
  
  
    const handleSendMessage = async () => {
      // GETTING BOT'S RESPONSE BASED ON INPUT
      const output = await get_output_from_input(input, messages, excalidrawAPI);
      // Assuming this returns a string or message
  
      if (input.trim()) {
        // Add the user's message to the messages state
        setMessages((prevMessages) => [
          ...prevMessages, // Keep previous messages
          { role: "user", content: input }, // Add user's message
        ]);
  
        // Clear the input field after sending the message
        setInput("");
  
        // Simulate bot response after a short delay
        setTimeout(() => {
          setMessages((prevMessages) => [
            ...prevMessages, // Keep all previous messages
            { role: "bot", content: output }, // Add bot's response
          ]);
        }, 1000); // Simulate delay of 1 second
      }
    };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Navbar */}

      {/* Main Content - Draw.io Space */}
      <div className="flex-1 bg-white p-4">
        <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
        </div>
      </div>

      {/* Right Sidebar - Chatbot */}
      <div className="w-80 bg-muted p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Chatbot Assistant</h2>
        <ScrollArea className="flex-1 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-4"
                  : "bg-muted-foreground/10 mr-4"
              }`}
            >
              {message.content}
            </div>
          ))}
        </ScrollArea>
        <div className="flex items-center">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 mr-2"
          />
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleRecording}
              className={`w-10 h-10 rounded-full p-0 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic2 className="h-5 w-5" />
            </Button>
          </div>
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}