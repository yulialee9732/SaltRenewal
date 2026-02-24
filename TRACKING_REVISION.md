# Form Tracking Revision - 간편견적 vs 상담신청

## Overview
Revised the price estimate form tracking to distinguish between:
1. **간편견적 (Quick Estimate)**: Users who view the price but don't complete the consultation form
2. **상담신청 (Full Consultation)**: Users who complete all steps and submit the consultation request

## Changes Made

### 1. Database Model Updates
**File**: `server/src/models/PriceEstimate.js`

Added new fields:
- `type`: 'quick' or 'full' to distinguish submission types
- `converted`: Boolean field to track conversion (true = O, false = X)

### 2. Google Sheets Integration
**File**: `server/src/services/googleSheets.js`

Created two separate sheet tabs with different column orders:

#### 간편견적 (Quick Estimate) Sheet
Columns: IP / 시간 / 실내 / 실외 / IoT / 특수공사 / 전환(O/X) / 연락처 / 주소 / 타입 / 인터넷 / 희망날짜

- Tracks users who only view the price estimate
- `전환(O/X)` shows conversion status (X for non-converted quick estimates)

#### 상담신청 (Full Consultation) Sheet
Columns: IP / 시간 / 연락처 / 주소 / 타입 / 실내 / 실외 / IoT / 특수공사 / 인터넷 / 희망날짜

- Tracks users who complete the full consultation form
- These are always conversions (전환: O)

### 3. Controller Updates
**File**: `server/src/controllers/priceEstimateController.js`

Created two separate submission handlers:
- `submitPriceEstimate()`: Handles full consultation submissions (type: 'full', converted: true)
- `submitQuickEstimate()`: Handles quick estimate submissions (type: 'quick', converted: false)

### 4. Route Updates
**File**: `server/src/routes/priceEstimates.js`

Added new route:
- `POST /api/price-estimate` - Full consultation (existing)
- `POST /api/price-estimate/quick` - Quick estimate (new)

### 5. Frontend Changes
**File**: `client/src/components/Landing/PriceEstimate.js`

Added new functionality:
- `handleRestart()`: Function to submit quick estimate and reset form
- `resetForm()`: Centralized function to reset all form state
- **다시 견적 내기** button: Allows users to restart the form (submits as quick estimate)

**File**: `client/src/components/Landing/PriceEstimate.css`

Added styling for the restart button:
- `.restart-button`: Secondary button style below the consultation button

## User Flow

### Scenario 1: User Converts (상담신청)
1. User fills out step 1 (camera selection)
2. User views price in step 2
3. User clicks "상담 신청하기"
4. User completes contact form (step 3)
5. User selects appointment date/time (step 4)
6. **Submission**: Saved as `type: 'full'`, `converted: true` → Goes to **상담신청** sheet

### Scenario 2: User Doesn't Convert (간편견적)
1. User fills out step 1 (camera selection)
2. User views price in step 2
3. User clicks **"다시 견적 내기"**
4. **Submission**: Saved as `type: 'quick'`, `converted: false` → Goes to **간편견적** sheet with 전환: X
5. Form resets to step 1

## Google Sheets Setup

Created two new sheet tabs in the spreadsheet:
- Sheet ID for **간편견적**: 596906616
- Sheet ID for **상담신청**: 1891863110

## Tracking Benefits

1. **Conversion Tracking**: See how many users view prices vs. actually request consultation
2. **User Behavior Analysis**: Understand drop-off points in the form funnel
3. **Lead Quality**: Distinguish between casual browsers and serious prospects
4. **Data Organization**: Separate sheets make it easier to prioritize follow-ups

## Testing

To test the functionality:

1. **Test Quick Estimate (간편견적)**:
   - Fill out camera selection
   - View price estimate
   - Click "다시 견적 내기"
   - Check Google Sheets **간편견적** tab for new entry with 전환: X

2. **Test Full Consultation (상담신청)**:
   - Fill out complete form through all 4 steps
   - Submit consultation request
   - Check Google Sheets **상담신청** tab for new entry

## Running the Application

```bash
# Server (Terminal 1)
cd mern-app/server
npm run dev

# Client (Terminal 2)
cd mern-app/client
npm start
```

Server: http://localhost:5001
Client: http://localhost:3000
