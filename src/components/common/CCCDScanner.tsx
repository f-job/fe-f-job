import { useState, useRef, useEffect } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { parseCCCDQR, CCCDData } from '@utils/cccdParser';

interface CCCDScannerProps {
  onScanSuccess: (data: CCCDData) => void;
  onCancel?: () => void;
}

export function CCCDScanner({ onScanSuccess, onCancel }: CCCDScannerProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [processingFile, setProcessingFile] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  // Start camera scanning
  const startCameraScanning = async () => {
    setError('');
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        (decodedText) => {
          // Success - parse QR data
          handleQRSuccess(decodedText);
          scanner.stop();
          setScanning(false);
        },
        () => {
          // This is called on every frame, ignore scanning errors
        }
      );
    } catch (err: any) {
      setError(err.message || 'Không thể khởi động camera');
      setScanning(false);
    }
  };

  // Stop camera scanning
  const stopCameraScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScanning(false);
        scannerRef.current = null;
      }).catch(() => {
        setScanning(false);
      });
    }
  };

  // Handle file upload with improved QR detection
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setProcessingFile(true);
    setImagePreview(''); // Clear previous preview

    try {
      // Read image file
      const imageDataUrl = await readFileAsDataURL(file);
      setImagePreview(imageDataUrl); // Show preview
      
      // Create image element
      const img = new Image();
      img.src = imageDataUrl;

      img.onload = () => {
        try {
          // Try multiple approaches to find QR code
          const result = tryMultipleQRScans(img);
          
          if (result) {
            handleQRSuccess(result);
            setProcessingFile(false);
          } else {
            setError('Không tìm thấy mã QR trong ảnh. Vui lòng đảm bảo: (1) Ảnh rõ nét, (2) Mã QR ở mặt sau CCCD, (3) Đủ ánh sáng khi chụp.');
            setProcessingFile(false);
          }
        } catch (err: any) {
          setError(err.message || 'Lỗi khi xử lý ảnh');
          setProcessingFile(false);
        }
      };

      img.onerror = () => {
        setError('Không thể đọc file ảnh. Vui lòng chọn file JPG hoặc PNG hợp lệ.');
        setProcessingFile(false);
        setImagePreview('');
      };
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xử lý ảnh');
      setProcessingFile(false);
      setImagePreview('');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Try multiple scanning approaches to improve detection rate
  const tryMultipleQRScans = (img: HTMLImageElement): string | null => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // List of scales to try (original, smaller, larger)
    const scales = [1, 0.5, 1.5, 2];
    
    for (const scale of scales) {
      // Set canvas size with current scale
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw with scale
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Try normal scan
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        console.log(`QR found at scale ${scale}`);
        return code.data;
      }

      // Try with contrast enhancement
      enhanceContrast(imageData);
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code) {
        console.log(`QR found at scale ${scale} with contrast enhancement`);
        return code.data;
      }

      // Try with grayscale
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'grayscale(100%) contrast(150%)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code) {
        console.log(`QR found at scale ${scale} with grayscale`);
        return code.data;
      }
    }

    return null;
  };

  // Enhance image contrast to improve QR detection
  const enhanceContrast = (imageData: ImageData) => {
    const data = imageData.data;
    const factor = 1.5; // Contrast factor
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast to R, G, B channels
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
      // Alpha channel (i + 3) remains unchanged
    }
  };

  // Parse and validate QR data
  const handleQRSuccess = (qrText: string) => {
    try {
      console.log('QR Code detected:', qrText);
      console.log('QR length:', qrText.length);
      console.log('QR parts:', qrText.split('|').length);
      
      const cccdData = parseCCCDQR(qrText);
      console.log('Parsed CCCD data:', cccdData);
      onScanSuccess(cccdData);
    } catch (err: any) {
      console.error('QR parsing error:', err);
      const errorMsg = err.message || 'Dữ liệu QR không hợp lệ';
      
      // Provide more helpful error messages
      if (errorMsg.includes('Invalid CCCD QR code format')) {
        setError('Mã QR không đúng định dạng CCCD. Vui lòng đảm bảo quét đúng mã QR trên mặt sau thẻ CCCD.');
      } else if (errorMsg.includes('Invalid date format')) {
        setError('Ngày tháng trong mã QR không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
      } else {
        setError(`Lỗi xử lý dữ liệu: ${errorMsg}`);
      }
    }
  };

  // Helper: Read file as data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h5 className="fw-bold mb-3">
          <i className="bi bi-credit-card-2-front me-2 text-primary" />
          Quét mã QR trên CCCD
        </h5>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle me-2" />
            {error}
          </Alert>
        )}

        {/* Mode Selection */}
        <div className="d-flex gap-2 mb-3">
          <Button
            variant={scanMode === 'upload' ? 'primary' : 'outline-primary'}
            onClick={() => {
              setScanMode('upload');
              stopCameraScanning();
            }}
            className="flex-fill"
          >
            <i className="bi bi-image me-2" />
            Tải ảnh lên
          </Button>
          <Button
            variant={scanMode === 'camera' ? 'primary' : 'outline-primary'}
            onClick={() => setScanMode('camera')}
            className="flex-fill"
          >
            <i className="bi bi-camera me-2" />
            Quét trực tiếp
          </Button>
        </div>

        {/* Upload Mode */}
        {scanMode === 'upload' && (
          <div className="text-center py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {processingFile ? (
              <div>
                {imagePreview && (
                  <div className="mb-3">
                    <img 
                      src={imagePreview} 
                      alt="CCCD preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px',
                        border: '2px solid #dee2e6',
                        borderRadius: '8px'
                      }} 
                    />
                  </div>
                )}
                <Spinner animation="border" className="mb-3" />
                <p className="text-muted">Đang quét mã QR...</p>
                <small className="text-muted">Đang thử nhiều phương pháp phát hiện...</small>
              </div>
            ) : imagePreview ? (
              <div>
                <div className="mb-3">
                  <img 
                    src={imagePreview} 
                    alt="CCCD preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      border: '2px solid #dee2e6',
                      borderRadius: '8px'
                    }} 
                  />
                </div>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setImagePreview('');
                    setError('');
                  }}
                  className="me-2"
                >
                  <i className="bi bi-x-circle me-2" />
                  Chọn ảnh khác
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary-gradient"
                >
                  <i className="bi bi-arrow-clockwise me-2" />
                  Thử lại
                </Button>
              </div>
            ) : (
              <>
                <div 
                  className="border-2 border-dashed rounded p-5 mb-3"
                  style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-cloud-upload fs-1 text-primary d-block mb-3" />
                  <p className="mb-1 fw-semibold">Chọn ảnh CCCD</p>
                  <small className="text-muted">
                    Hỗ trợ: JPG, PNG (Tối đa 5MB)
                  </small>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary-gradient"
                >
                  <i className="bi bi-folder2-open me-2" />
                  Chọn ảnh từ thiết bị
                </Button>
              </>
            )}
          </div>
        )}

        {/* Camera Mode */}
        {scanMode === 'camera' && (
          <div>
            {!scanning ? (
              <div className="text-center py-4">
                <i className="bi bi-camera-video fs-1 text-primary d-block mb-3" />
                <p className="text-muted mb-3">
                  Đưa mã QR trên CCCD vào khung hình để quét
                </p>
                <Button 
                  variant="primary" 
                  onClick={startCameraScanning}
                  className="btn-primary-gradient"
                >
                  <i className="bi bi-camera me-2" />
                  Bật camera
                </Button>
              </div>
            ) : (
              <>
                <div id="qr-reader" className="mb-3" />
                <Button 
                  variant="outline-danger" 
                  onClick={stopCameraScanning}
                  className="w-100"
                >
                  <i className="bi bi-x-circle me-2" />
                  Dừng quét
                </Button>
              </>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-light rounded">
          <div className="mb-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1" />
              <strong>Mã QR CCCD nằm ở đâu?</strong>
            </small>
            <ul className="small text-muted mb-2 mt-1 ps-3">
              <li>Mã QR nằm ở <strong>mặt sau</strong> của thẻ CCCD (không phải mặt trước có ảnh)</li>
              <li>Mã QR có kích thước khoảng 2x2cm, màu đen trên nền trắng</li>
            </ul>
          </div>
          
          <div>
            <small className="text-muted">
              <strong>Mẹo chụp ảnh rõ nét:</strong>
            </small>
            <ul className="small text-muted mb-0 mt-1 ps-3">
              <li>Đặt CCCD trên nền phẳng, đủ ánh sáng</li>
              <li>Camera song song với thẻ (không chụp góc nghiêng)</li>
              <li>Đảm bảo mã QR chiếm ít nhất 1/4 khung hình</li>
              <li>Không bị mờ, không bị lóa, không bị bóng đổ</li>
              <li>Nếu không quét được, hãy thử chụp lại ở góc độ khác</li>
            </ul>
          </div>
        </div>

        {onCancel && (
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="outline-secondary" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
