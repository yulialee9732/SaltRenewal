const ServiceRequest = require('../models/ServiceRequest');

// @desc    Create a new service request
// @route   POST /api/service-requests
// @access  Private (Customer)
exports.createServiceRequest = async (req, res) => {
  try {
    const { subject, description, category, priority, productInfo } = req.body;

    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      subject,
      description,
      category,
      priority,
      productInfo
    });

    await serviceRequest.populate('customer', 'name email phone company');

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all service requests (Employee can see all, Customer sees only theirs)
// @route   GET /api/service-requests
// @access  Private
exports.getServiceRequests = async (req, res) => {
  try {
    let query = {};

    // If customer, only show their requests
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Filter options
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const serviceRequests = await ServiceRequest.find(query)
      .populate('customer', 'name email phone company')
      .populate('editHistory.editedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(serviceRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single service request by ID
// @route   GET /api/service-requests/:id
// @access  Private
exports.getServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name email phone company')
      .populate('editHistory.editedBy', 'name email');

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is authorized to view this request
    if (req.user.role === 'customer' && serviceRequest.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(serviceRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update service request (Employee can update all fields, Customer limited)
// @route   PUT /api/service-requests/:id
// @access  Private
exports.updateServiceRequest = async (req, res) => {
  try {
    let serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && serviceRequest.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    const previousStatus = serviceRequest.status;

    // If employee is updating, track the edit
    if (req.user.role === 'employee') {
      const { note, status, priority } = req.body;

      // Add to edit history
      if (note) {
        serviceRequest.editHistory.push({
          editedBy: req.user._id,
          note,
          previousStatus,
          newStatus: status || previousStatus
        });
      }

      // Update fields
      if (status) serviceRequest.status = status;
      if (priority) serviceRequest.priority = priority;
    }

    // Customers can update their request details
    if (req.user.role === 'customer') {
      const { subject, description, productInfo } = req.body;
      if (subject) serviceRequest.subject = subject;
      if (description) serviceRequest.description = description;
      if (productInfo) serviceRequest.productInfo = productInfo;
    }

    await serviceRequest.save();
    await serviceRequest.populate('customer', 'name email phone company');
    await serviceRequest.populate('editHistory.editedBy', 'name email');

    res.json(serviceRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete service request
// @route   DELETE /api/service-requests/:id
// @access  Private (Employee only)
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    await serviceRequest.deleteOne();

    res.json({ message: 'Service request removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
