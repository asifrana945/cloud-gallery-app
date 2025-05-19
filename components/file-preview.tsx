"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  X,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  Fullscreen,
  FullscreenIcon as FullscreenExit,
} from "lucide-react"
import type { File } from "@/lib/types"
import { formatFileSize, formatDate } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ImageIcon, Film } from "lucide-react"

interface FilePreviewProps {
  file: File
  onClose: () => void
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  useEffect(() => {
    // Reset zoom and rotation when file changes
    setZoom(1)
    setRotation(0)
    setIsPlaying(false)

    // Auto-play videos
    if (file.type.startsWith("video/") && videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [file])

  useEffect(() => {
    // Handle video play/pause
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    // Handle video mute/unmute
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleInfo = () => {
    setShowInfo(!showInfo)
  }

  const renderPreview = () => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full relative group">
          <motion.img
            src={file.url || "/placeholder.svg?height=400&width=600"}
            alt={file.name}
            className="max-h-[70vh] max-w-full object-contain"
            crossOrigin="anonymous"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.3s ease",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          />

          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass-effect rounded-full px-3 py-1.5 flex items-center space-x-2 flex-wrap justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium">{Math.round(zoom * 100)}%</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border/50 hidden sm:block"></div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={rotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleFullscreen}>
                  {isFullscreen ? <FullscreenExit className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    } else if (file.type.startsWith("video/")) {
      return (
        <div className="flex flex-col items-center justify-center h-full relative group">
          <div className="relative">
            <video
              ref={videoRef}
              src={file.url}
              className="max-h-[65vh] max-w-full rounded-lg"
              crossOrigin="anonymous"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={false}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            />

            <AnimatePresence>
              {showControls && (
                <motion.div
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass-effect rounded-full px-3 py-1.5 flex items-center space-x-2 flex-wrap justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleFullscreen}>
                    {isFullscreen ? <FullscreenExit className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-8 rounded-full bg-muted/30 mb-6"
          >
            <FileText className="h-20 w-20 text-muted-foreground" />
          </motion.div>
          <p className="text-xl font-medium mb-2">{file.name}</p>
          <p className="text-muted-foreground mb-6">This file type cannot be previewed</p>
          <Button className="premium-button text-white" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      )
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen ? "max-w-[95vw] w-[95vw] h-[95vh]" : "max-w-4xl w-[90vw] h-[90vh]"
        } p-0 overflow-hidden file-preview`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b glass-effect flex-wrap gap-2">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-muted/50 mr-3">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                ) : file.type.startsWith("video/") ? (
                  <Film className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[500px]">
                  {file.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border/50 hover:bg-muted/50"
                onClick={toggleInfo}
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border/50 hover:bg-muted/50"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-muted/30 group">{renderPreview()}</div>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                className="absolute right-0 top-16 bottom-0 w-72 glass-effect border-l border-border/30 p-4 overflow-y-auto premium-scrollbar"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <h3 className="text-lg font-medium mb-4">File Information</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
                    <p className="text-sm break-all">{file.name}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                    <p className="text-sm">{file.type || "Unknown"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Size</h4>
                    <p className="text-sm">{formatFileSize(file.size)}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Modified</h4>
                    <p className="text-sm">{formatDate(file.lastModified)}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                    <p className="text-sm break-all">{file.key}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
