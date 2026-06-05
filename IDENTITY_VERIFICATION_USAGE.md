# Identity Verification - Frontend Usage Guide

## ✅ Đã hoàn thành

### Installed Packages:
- ✅ `html5-qrcode` - QR code scanner for camera
- ✅ `jsqr` - QR code decoder for uploaded images

### Created Components:
- ✅ `CCCDScanner.tsx` - QR scanner component (camera + file upload)
- ✅ `VerificationModal.tsx` - Complete verification flow modal
- ✅ `VerificationBadge.tsx` - Verification status badge

### Created Services:
- ✅ `verificationService.ts` - API integration
- ✅ `cccdParser.ts` - QR code data parser

### Integrated Pages:
- ✅ `ProfilePage.tsx` - Added verification button and status

---

## 🎯 How to Use

### For End Users:

1. **Go to Profile Page** (`/profile`)
2. **Click "Xác thực danh tính"** button
3. **Read and accept consent** form
4. **Choose verification method**:
   - Upload CCCD image (recommended)
   - Scan with camera (direct)
5. **Confirm extracted information**
6. **Done!** Account is verified with badge

---

## 🔧 Technical Details

### CCCD QR Code Format

QR codes on Vietnamese CCCD contain pipe-separated data:
```
001234567890|123456789012|Nguyễn Văn A|15011990|Nam|Đà Nẵng|01012020
│            │            │             │        │   │        └─ Issue date
│            │            │             │        │   └─ Address
│            │            │             │        └─ Gender
│            │            │             └─ Date of birth (DDMMYYYY)
│            │            └─ Full name
│            └─ Old CMND number
└─ CCCD number (9-12 digits)
```

### Data Flow

```
User uploads image
    ↓
jsQR extracts QR code
    ↓
cccdParser parses data
    ↓
Show confirmation UI
    ↓
User confirms
    ↓
POST /verification/verify
    ↓
Backend validates & encrypts
    ↓
Success! Badge shown
```

---

## 🎨 Components API

### CCCDScanner

```typescript
<CCCDScanner
  onScanSuccess={(data: CCCDData) => {
    console.log('Scanned:', data);
  }}
  onCancel={() => {
    console.log('Cancelled');
  }}
/>
```

### VerificationModal

```typescript
<VerificationModal
  show={true}
  onHide={() => setShow(false)}
  onSuccess={() => {
    console.log('Verification successful!');
    // Reload user data
  }}
/>
```

### VerificationBadge

```typescript
<VerificationBadge
  isVerified={true}
  size="md"  // 'sm' | 'md' | 'lg'
  showText={true}
/>
```

---

## 🧪 Testing

### Test with Sample QR Code

Create a test QR code with this data:
```
001234567890|123456789012|Nguyễn Văn Test|15011990|Nam|Đà Nẵng|01012020
```

Use online QR generator: https://www.qr-code-generator.com/

### Test Flow:

1. Generate QR code with sample data
2. Save as image
3. Go to Profile → Click "Xác thực danh tính"
4. Upload the QR image
5. Verify it extracts correctly
6. Submit and check success

---

## 🔒 Security Features

### Client-Side:
- ✅ No raw image stored
- ✅ QR data parsed locally
- ✅ Only extracted info sent to server

### Server-Side:
- ✅ ID number encrypted (AES-256-CBC)
- ✅ No images stored
- ✅ Masked display (001******890)

---

## 🎨 UI/UX Features

### Multi-Step Flow:
1. **Consent** - Clear privacy policy
2. **Scan** - Upload or camera options
3. **Confirm** - Review extracted data
4. **Success** - Show badge

### User Feedback:
- ✅ Loading states
- ✅ Error messages
- ✅ Success animations
- ✅ Help text & instructions

---

## 📱 Mobile Support

### Camera Mode:
- Uses device camera
- Auto-focus on QR code
- Real-time scanning

### Upload Mode:
- Select from gallery
- Works offline
- Fast processing

---

## 🐛 Troubleshooting

### "Không tìm thấy mã QR"
- Ensure image is clear
- QR code must be visible
- Try better lighting

### "Dữ liệu QR không hợp lệ"
- QR code must be from Vietnamese CCCD
- Format must match expected structure
- Check console logs for details

### Camera not working:
- Check browser permissions
- HTTPS required for camera
- Try upload mode instead

---

## 🚀 Production Checklist

### Before Deploy:
- [ ] Test with real CCCD images
- [ ] Verify encryption key is set
- [ ] Test on mobile devices
- [ ] Check camera permissions
- [ ] Test upload file size limits
- [ ] Verify backend API works
- [ ] Add Privacy Policy page
- [ ] Test error handling

### After Deploy:
- [ ] Monitor verification success rate
- [ ] Check for failed scans
- [ ] Collect user feedback
- [ ] Optimize QR detection

---

## 📊 Analytics (Optional)

Track these events:
```typescript
// Verification flow started
analytics.track('verification_started');

// Scan method chosen
analytics.track('scan_method', { method: 'upload' | 'camera' });

// Scan successful
analytics.track('scan_success', { method });

// Verification completed
analytics.track('verification_completed');

// Verification failed
analytics.track('verification_failed', { error });
```

---

## 🔧 Customization

### Change QR Box Size:
```typescript
// In CCCDScanner.tsx
qrbox: { width: 300, height: 300 } // Adjust size
```

### Add More Validation:
```typescript
// In cccdParser.ts
export function parseCCCDQR(qrText: string): CCCDData {
  // Add custom validation here
}
```

### Customize UI:
- Modify modal styles in `VerificationModal.tsx`
- Change badge colors in `VerificationBadge.tsx`
- Update scanner UI in `CCCDScanner.tsx`

---

## 📚 Resources

### QR Scanner:
- html5-qrcode docs: https://github.com/mebjas/html5-qrcode
- jsQR docs: https://github.com/cozmo/jsQR

### CCCD Format:
- Vietnamese ID card specification
- QR code structure documentation

### Privacy:
- Nghị định 13/2023/NĐ-CP
- GDPR best practices

---

## 🎯 Next Steps

### Enhancement Ideas:
- [ ] Add OCR for text extraction (Tesseract.js)
- [ ] Support NFC chip reading (advanced)
- [ ] Add liveness detection (prevent fake IDs)
[ ] Add photo comparison (face matching)
- [ ] Support business license verification
- [ ] Export verification certificate

---

## ✅ Success Criteria

Verification is successful when:
- ✅ QR code is detected and parsed
- ✅ Data passes validation
- ✅ Backend accepts and stores
- ✅ User sees verification badge
- ✅ Badge appears on profile

---

**Ready to test!** 🚀

Try verifying on: `http://localhost:3000/profile`
