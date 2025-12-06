"use client"

import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, X, FastForward } from 'lucide-react'

// --- Custom Hook for Speech Logic ---
export function useSpeech(text: string) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!text) return;

    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(text)
    
    u.onstart = () => setIsSpeaking(true)
    u.onend = () => { setIsSpeaking(false); setIsPaused(false); }
    u.onpause = () => setIsPaused(true)
    u.onresume = () => setIsPaused(false)
    u.onerror = (e) => { console.error("Speech error:", e); setIsSpeaking(false); }
    
    setUtterance(u)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [text])

  const play = () => {
    if (isPaused) {
      window.speechSynthesis.resume()
    } else {
      window.speechSynthesis.cancel()
      if (utterance) window.speechSynthesis.speak(utterance)
    }
  }

  const pause = () => window.speechSynthesis.pause()
  const stop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  return { isSpeaking, isPaused, play, pause, stop }
}

// --- The Floating Player UI ---
export function AudioPlayer({ text, onClose }: { text: string; onClose: () => void }) {
  const { isSpeaking, isPaused, play, pause, stop } = useSpeech(text)

  useEffect(() => {
    // Auto-play with a slight delay to ensure UI is ready
    const timer = setTimeout(() => play(), 500)
    return () => {
        clearTimeout(timer)
        stop()
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#EFE9D5] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 w-80 flex flex-col gap-3">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSpeaking && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-bold text-sm">Mind Mentor Reader</span>
          </div>
          <button onClick={onClose} className="hover:bg-black/5 rounded p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visualizer Animation */}
        <div className="h-12 bg-black/5 rounded border border-black/10 flex items-center justify-center gap-1 overflow-hidden px-4">
            {isSpeaking && !isPaused ? (
                Array.from({ length: 20 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="w-1 bg-black/80 rounded-full animate-[bounce_1s_infinite]"
                        style={{ 
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 0.5}s`
                        }}
                    />
                ))
            ) : (
                <span className="text-xs text-gray-500 font-mono">Ready to play...</span>
            )}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center pt-1">
            <div className="flex gap-2">
                {isSpeaking && !isPaused ? (
                    <button onClick={pause} className="w-10 h-10 flex items-center justify-center bg-[#c1ff72] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Pause className="w-5 h-5 fill-current" />
                    </button>
                ) : (
                    <button onClick={play} className="w-10 h-10 flex items-center justify-center bg-[#c1ff72] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Play className="w-5 h-5 fill-current" />
                    </button>
                )}
                <button onClick={stop} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white border border-black rounded text-xs font-mono">
                <FastForward className="w-3 h-3" />
                <span>1.0x</span>
            </div>
        </div>
      </div>
    </div>
  )
}
