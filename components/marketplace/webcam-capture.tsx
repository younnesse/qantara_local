"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface WebcamCaptureProps {
  onCapture: (base64Image: string | null) => void
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Start the camera stream
  const startCamera = async () => {
    setError(null)
    setLoading(true)
    try {
      // Ensure existing stream is stopped
      stopCamera()
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCameraActive(true)
    } catch (err) {
      console.error("Camera access error:", err)
      setError(t("webcam.error"))
      onCapture(null)
    } finally {
      setLoading(false)
    }
  }

  // Stop the camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  // Capture the photo from the video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context) {
      // Set canvas size to match video resolution
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      // Draw the video frame on the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 jpeg
      const base64Data = canvas.toDataURL("image/jpeg", 0.9)
      setCapturedImage(base64Data)
      onCapture(base64Data)
      
      // Turn off camera after successful capture
      stopCamera()
    }
  }

  // Reset/Retake photo
  const retakePhoto = () => {
    setCapturedImage(null)
    onCapture(null)
    startCamera()
  }

  // Cleanup camera stream on unmount
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      {/* Hidden canvas used for capturing the frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera / Preview Box */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-border flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center text-destructive space-y-2">
            <AlertCircle className="w-10 h-10 mx-auto" />
            <p className="font-semibold text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={startCamera}>
              {t("webcam.tryAgain")}
            </Button>
          </div>
        ) : capturedImage ? (
          // Captured Image Preview
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured selfie"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1 shadow-md">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        ) : (
          // Active Camera Stream
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100" // Mirror self-view
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm">
                {t("webcam.initializing")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center">
        {capturedImage ? (
          <Button
            type="button"
            variant="outline"
            onClick={retakePhoto}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            {t("webcam.retake")}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!isCameraActive || loading}
            onClick={capturePhoto}
            className="flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            {t("webcam.capture")}
          </Button>
        )}
      </div>
    </div>
  )
}
