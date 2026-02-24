# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration to automatically record all form submissions.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Google Sheets API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

### 3. Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - Name: `mern-app-sheets-service`
   - Description: `Service account for MERN app Google Sheets integration`
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### 4. Generate Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - a JSON file will be downloaded
6. **Important**: Keep this file secure and never commit it to git

### 5. Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it: `MERN App Form Submissions`
4. Create three sheets (tabs) with these exact names:
   - `PriceEstimates`
   - `ServiceRequests`
   - `ContactForms`
5. Copy the **Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123XYZ/edit`
   - Then Spreadsheet ID is: `1abc123XYZ`

### 6. Share Spreadsheet with Service Account

1. In your Google Sheet, click **Share**
2. Paste the service account email (found in the JSON file as `client_email`)
   - Format: `something@project-id.iam.gserviceaccount.com`
3. Give it **Editor** access
4. Click **Send**

### 7. Configure Environment Variables

1. Open the JSON key file you downloaded
2. Copy the entire JSON content (all of it, as one line)
3. Add these to your `.env` file in the server directory:

```env
# Google Sheets Integration
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important Notes:**
- Replace `your_spreadsheet_id_here` with your actual Spreadsheet ID
- Replace the GOOGLE_CREDENTIALS value with the entire JSON content from your key file
- Make sure the JSON is on a single line
- Keep the quotes around the JSON

### 8. Initialize Sheet Headers (One-time Setup)

After configuring the environment variables, you can initialize the headers by running this command in the server directory:

```bash
node -e "require('./src/services/googleSheets').setupSheetHeaders()"
```

Or you can add a script to your package.json:

```json
{
  "scripts": {
    "setup-sheets": "node -e \"require('./src/services/googleSheets').setupSheetHeaders()\""
  }
}
```

Then run:
```bash
npm run setup-sheets
```

### 9. Restart Your Server

```bash
npm start
```

or for development:

```bash
npm run dev
```

## Testing

1. Submit a form (Price Estimate, Service Request, or Contact Form)
2. Check your Google Sheet - a new row should appear with the submission data
3. Check the server console for confirmation messages:
   - ✅ Google Sheets API initialized
   - ✅ Price estimate added to Google Sheets
   - ✅ Service request added to Google Sheets
   - ✅ Contact form added to Google Sheets

## Troubleshooting

### Error: "Google Sheets credentials not configured"

- Make sure `GOOGLE_SPREADSHEET_ID` and `GOOGLE_CREDENTIALS` are set in your `.env` file
- Restart the server after adding environment variables

### Error: "The caller does not have permission"

- Make sure you shared the spreadsheet with the service account email
- The service account email should have Editor access

### Error: "Unable to parse range"

- Make sure your sheet names match exactly: `PriceEstimates`, `ServiceRequests`, `ContactForms`
- Sheet names are case-sensitive

### Data not appearing in sheets

- Check the server console for error messages
- Verify the Spreadsheet ID is correct
- Make sure the service account has access to the spreadsheet

## Security Notes

1. **Never commit** the service account JSON file to git
2. Add `credentials.json` to your `.gitignore`
3. Keep your `.env` file secure and never commit it
4. Consider using environment variable management tools like:
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault
   - dotenv-vault

## Sheet Structure

### PriceEstimates Sheet Columns
| 제출 시간 | 전화번호 | 주소 | 장소 유형 | 인터넷 | 카메라 타입 | 실내 카메라 | 실외 카메라 | 총 카메라 | IoT 옵션 | 특수 옵션 | 가격 | 방문 날짜 | 방문 시간 | 상태 |

### ServiceRequests Sheet Columns
| 제출 시간 | 고객명 | 이메일 | 전화번호 | 회사명 | 제목 | 설명 | 카테고리 | 우선순위 | 상태 | 제품 정보 |

### ContactForms Sheet Columns
| 제출 시간 | 이름 | 이메일 | 전화번호 | 회사명 | 제목 | 메시지 | 상태 |

## Optional: Disable Google Sheets Integration

If you want to temporarily disable Google Sheets integration without removing the code:

1. Remove or comment out the environment variables in `.env`:
```env
# GOOGLE_SPREADSHEET_ID=...
# GOOGLE_CREDENTIALS=...
```

2. Restart the server

The app will continue to work normally, saving data to MongoDB only. You'll see a warning in the console:
```
⚠️  Google Sheets credentials not configured. Skipping Google Sheets integration.
```
