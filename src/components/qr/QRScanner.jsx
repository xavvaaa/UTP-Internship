/**
 * QR Scanner Component
 * Handles camera-based QR code scanning with proper permissions and mobile support
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, CameraOff, AlertCircle, CheckCircle, X } from 'lucide-react'
import QrScanner from 'qr-scanner'
import styles from './QRScanner.module.css'

export default function QRScanner({ onScanSuccess, onScanError, onClose }) {
  const videoRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const qrScannerRef = useRef(null)

  const startCamera = useCallback(async () => {
    try {
      setScanError('')
      
      // Check camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      stream.getTracks().forEach(track => track.stop()) // Stop test stream
      
      setHasPermission(true)
      
      if (videoRef.current && !qrScannerRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            // Handle successful scan
            const scannedData = result.data
            setLastScanResult(scannedData)
            setIsScanning(false)
            
            // Validate QR data format (expecting JSON with access_code)
            try {
              const qrData = JSON.parse(scannedData)
              if (qrData.access_code) {
                onScanSuccess?.(qrData)
              } else {
                setScanError('Invalid QR code format. Missing access code.')
                onScanError?.('Invalid QR format')
              }
            } catch (parseError) {
              // Try to use raw text as access code
              if (scannedData.length >= 4 && scannedData.length <= 10) {
                onScanSuccess?.({ access_code: scannedData.trim().toUpperCase() })
              } else {
                setScanError('Invalid QR code format.')
                onScanError?.('Invalid QR format')
              }
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          }
        )
        
        await qrScannerRef.current.start()
        setIsScanning(true)
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      
      if (error.name === 'NotAllowedError') {
        setScanError('Camera access denied. Please allow camera permissions to scan QR codes.')
      } else if (error.name === 'NotFoundError') {
        setScanError('No camera found. Please ensure your device has a camera.')
      } else if (error.name === 'NotSupportedError') {
        setScanError('Camera not supported on this device/browser.')
      } else {
        setScanError('Failed to access camera. Please try again.')
      }
      onScanError?.(error.message)
    }
  }, [onScanSuccess, onScanError])

  const stopCamera = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const requestPermission = useCallback(async () => {
    await startCamera()
  }, [startCamera])

  useEffect(() => {
    // Auto-start camera when component mounts
    startCamera()
    
    return () => {
      stopCamera()
    }
  }, []) // Only run on mount/unmount

  const handleRetry = () => {
    setScanError('')
    setLastScanResult(null)
    startCamera()
  }

  return (
    <div className={styles.scannerOverlay}>
      <div className={styles.scannerContainer}>
        <div className={styles.scannerHeader}>
          <h3>Scan QR Code</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
        </div>

        {hasPermission === false && (
          <div className={styles.permissionError}>
            <CameraOff size={48} className={styles.errorIcon} />
            <h4>Camera Access Required</h4>
            <p>{scanError}</p>
            <button 
              className={styles.retryButton}
              onClick={requestPermission}
            >
              Request Camera Access
            </button>
          </div>
        )}

        {hasPermission === true && (
          <div className={styles.scannerContent}>
            <div className={styles.videoContainer}>
              <video 
                ref={videoRef}
                className={styles.videoElement}
                playsInline
                muted
              />
              {!isScanning && (
                <div className={styles.videoOverlay}>
                  <CameraOff size={48} />
                  <p>Camera inactive</p>
                </div>
              )}
            </div>

            {scanError && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{scanError}</span>
                <button onClick={handleRetry} className={styles.retryText}>
                  Retry
                </button>
              </div>
            )}

            {lastScanResult && (
              <div className={styles.successBanner}>
                <CheckCircle size={16} />
                <span>QR Code scanned successfully!</span>
              </div>
            )}

            <div className={styles.scannerInstructions}>
              <p>Position the QR code within the frame to scan</p>
              <div className={styles.scannerControls}>
                {!isScanning ? (
                  <button 
                    className={styles.scanButton}
                    onClick={startCamera}
                  >
                    <Camera size={16} />
                    Start Scanning
                  </button>
                ) : (
                  <button 
                    className={styles.stopButton}
                    onClick={stopCamera}
                  >
                    <CameraOff size={16} />
                    Stop Scanning
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {hasPermission === null && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Requesting camera access...</p>
          </div>
        )}
      </div>
    </div>
  )
}
