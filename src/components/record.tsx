'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"

export default function CompactAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.current?.stop()
      setIsRecording(false)
    } else {
      audioChunks.current = []
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.current = new MediaRecorder(stream)
        
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data)
        }

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
          // Here you could send the audioBlob to a server or process it further
          console.log('Recording stopped, audio blob created')
        }

        mediaRecorder.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error accessing the microphone', error)
      }
    }
  }

  return (
    <Button 
      onClick={toggleRecording}
      className={`w-10 h-10 rounded-full p-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}