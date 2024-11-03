"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import Excalidraw (SSR disabled)
const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw), {
  ssr: false,
});

export default function Component() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Define the scene data
  const updateScene = async () => {
    const sceneData =   {
      elements: [
        {
          type: "rectangle",
          version: 141,
          versionNonce: 361174001,
          isDeleted: false,
          id: "oDVXy8D6rom3H1-LLH2-f",
          fillStyle: "hachure",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          angle: 0,
          x: 100.50390625,
          y: 93.67578125,
          strokeColor: "#c92a2a",
          backgroundColor: "transparent",
          width: 186.47265625,
          height: 141.9765625,
          seed: 1968410350,
          groupIds: [],
          boundElements: null,
          locked: false,
          link: null,
          updated: 1,
          roundness: {
            type: 3,
            value: 32,
          },
        },
      ],
      appState: {
        viewBackgroundColor: "#edf2ff",
      },
    };
    excalidrawAPI.updateScene(sceneData);
  };
  
  return (
    <div className="flex h-screen bg-background">
        
      {/* Main Content - Excalidraw Canvas */}
      <div className="flex-1 bg-white p-4">
        <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
        </div>
      </div>


    </div>
  );
}
