const PriceEstimate = require('../models/PriceEstimate');
const { addPriceEstimate, getAllSheetEstimates } = require('../services/googleSheets');
const { sendErrorNotification, sendNewEstimateNotification } = require('../services/emailService');

// Submit full consultation (상담신청폼) - Step 4
exports.submitPriceEstimate = async (req, res) => {
  try {
    const estimateData = req.body;
    
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

      // Send new estimate notification email
      sendNewEstimateNotification(estimateData).catch(() => {});

      res.status(201).json({
        success: true,
        message: '견적 신청이 성공적으로 제출되었습니다.',
        estimateId: priceEstimate._id
      });
    } catch (dbError) {
      console.error('Database error (Google Sheets updated):', dbError);
      
      // Send email notification about database error
      await sendErrorNotification(
        'Database - Full Consultation Error',
        `Database failed but Google Sheets updated: ${dbError.message}`,
        {
          formType: '상담신청',
          ipAddress: estimateData.ipAddress,
          contactInfo: estimateData.contactInfo?.phoneNumber || 'N/A',
          stackTrace: dbError.stack
        }
      );
      
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

      // Send new estimate notification email
      sendNewEstimateNotification(estimateData).catch(() => {});

      res.status(201).json({
        success: true,
        message: '간편 견적이 저장되었습니다.',
        estimateId: priceEstimate._id
      });
    } catch (dbError) {
      console.error('Database error (Google Sheets updated):', dbError);
      
      // Send email notification about database error
      await sendErrorNotification(
        'Database - Quick Estimate Error',
        `Database failed but Google Sheets updated: ${dbError.message}`,
        {
          formType: '간편견적',
          ipAddress: estimateData.ipAddress,
          contactInfo: estimateData.contactInfo?.phoneNumber || 'N/A',
          stackTrace: dbError.stack
        }
      );
      
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
