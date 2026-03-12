const PriceEstimate = require('../models/PriceEstimate');
const { addPriceEstimate, getAllSheetEstimates } = require('../services/googleSheets');
// Email service removed - paths preserved:
// const { sendErrorNotification, sendNewEstimateNotification } = require('../services/emailService');

// Helper function to validate phone number (must be 11 digits)
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
  return digitsOnly.length === 11;
};

// Submit full consultation (상담신청폼) - Step 4
exports.submitPriceEstimate = async (req, res) => {
  try {
    const estimateData = req.body;
    
    // Validate phone number
    const phoneNumber = estimateData.contactInfo?.phoneNumber;
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: '유효한 연락처를 입력해주세요. (11자리 숫자)'
      });
    }
    
    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress;
    
    // Add IP to data and mark as full consultation
    estimateData.ipAddress = ipAddress;
    estimateData.type = 'full';
    estimateData.converted = true; // Full consultation is always a conversion

    // ALWAYS update Google Sheets first (even if DB fails)
    addPriceEstimate(estimateData).catch(err => 
      console.error('Google Sheets error:', err.message)
    );

    // Then try to save to database
    try {
      const priceEstimate = new PriceEstimate(estimateData);
      await priceEstimate.save();

      res.status(201).json({
        success: true,
        message: '견적 신청이 성공적으로 제출되었습니다.',
        estimateId: priceEstimate._id
      });
    } catch (dbError) {
      console.error('Database error (Google Sheets updated):', dbError);
      
      // Still return success since Google Sheets was updated
      res.status(201).json({
        success: true,
        message: '견적 신청이 제출되었습니다.',
        warning: 'Dashboard update failed, but submission recorded'
      });
    }
  } catch (error) {
    console.error('Error submitting price estimate:', error);
    res.status(500).json({
      success: false,
      message: '견적 신청 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// Submit quick estimate (간편견적) - Step 2 restart
exports.submitQuickEstimate = async (req, res) => {
  try {
    const estimateData = req.body;
    
    // Validate phone number
    const phoneNumber = estimateData.contactInfo?.phoneNumber;
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: '유효한 연락처를 입력해주세요. (11자리 숫자)'
      });
    }
    
    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress;
    
    // Add IP to data and mark as quick estimate
    estimateData.ipAddress = ipAddress;
    estimateData.type = 'quick';
    estimateData.converted = true; // 간편신청 is always a conversion

    // ALWAYS update Google Sheets first (even if DB fails)
    addPriceEstimate(estimateData).catch(err => 
      console.error('Google Sheets error:', err.message)
    );

    // Then try to save to database
    try {
      const priceEstimate = new PriceEstimate(estimateData);
      await priceEstimate.save();

      res.status(201).json({
        success: true,
        message: '간편 견적이 저장되었습니다.',
        estimateId: priceEstimate._id
      });
    } catch (dbError) {
      console.error('Database error (Google Sheets updated):', dbError);
      
      // Still return success since Google Sheets was updated
      res.status(201).json({
        success: true,
        message: '간편 견적이 저장되었습니다.',
        warning: 'Dashboard update failed, but submission recorded'
      });
    }
  } catch (error) {
    console.error('Error submitting quick estimate:', error);
    res.status(500).json({
      success: false,
      message: '간편 견적 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.getAllEstimates = async (req, res) => {
  try {
    const estimates = await PriceEstimate.find().sort({ submittedAt: -1 });
    res.json({
      success: true,
      estimates
    });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    res.status(500).json({
      success: false,
      message: '견적 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.getEstimateById = async (req, res) => {
  try {
    const estimate = await PriceEstimate.findById(req.params.id);
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: '견적을 찾을 수 없습니다.'
      });
    }
    res.json({
      success: true,
      estimate
    });
  } catch (error) {
    console.error('Error fetching estimate:', error);
    res.status(500).json({
      success: false,
      message: '견적을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.updateEstimateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const estimate = await PriceEstimate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: '견적을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '상태가 업데이트되었습니다.',
      estimate
    });
  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({
      success: false,
      message: '상태 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// Get all estimates from Google Sheets (for employee dashboard)
exports.getSheetEstimates = async (req, res) => {
  try {
    console.log('📊 Fetching sheet estimates...');
    const data = await getAllSheetEstimates();
    console.log('📊 Sheet estimates fetched:', {
      quick: data.quickEstimates?.length || 0,
      salt: data.saltConsultations?.length || 0,
      kt: data.ktConsultations?.length || 0,
      total: data.total
    });
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('❌ Error fetching sheet estimates:', error);
    res.status(500).json({
      success: false,
      message: 'Google Sheets에서 데이터를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};
