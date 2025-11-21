const ContactForm = require('../models/ContactForm');

// @desc    Create a new contact form submission
// @route   POST /api/contact-forms
// @access  Private (Customer)
exports.createContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contactForm = await ContactForm.create({
      customer: req.user._id,
      name,
      email,
      phone,
      subject,
      message
    });

    await contactForm.populate('customer', 'name email phone company');

    res.status(201).json(contactForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all contact forms (Employee sees all, Customer sees only theirs)
// @route   GET /api/contact-forms
// @access  Private
exports.getContactForms = async (req, res) => {
  try {
    let query = {};

    // If customer, only show their submissions
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const contactForms = await ContactForm.find(query)
      .populate('customer', 'name email phone company')
      .populate('editHistory.editedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(contactForms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single contact form by ID
// @route   GET /api/contact-forms/:id
// @access  Private
exports.getContactForm = async (req, res) => {
  try {
    const contactForm = await ContactForm.findById(req.params.id)
      .populate('customer', 'name email phone company')
      .populate('editHistory.editedBy', 'name email');

    if (!contactForm) {
      return res.status(404).json({ message: 'Contact form not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && contactForm.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this form' });
    }

    res.json(contactForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update contact form (Employee only)
// @route   PUT /api/contact-forms/:id
// @access  Private (Employee)
exports.updateContactForm = async (req, res) => {
  try {
    let contactForm = await ContactForm.findById(req.params.id);

    if (!contactForm) {
      return res.status(404).json({ message: 'Contact form not found' });
    }

    const previousStatus = contactForm.status;
    const { note, status } = req.body;

    // Add to edit history
    if (note) {
      contactForm.editHistory.push({
        editedBy: req.user._id,
        note,
        previousStatus,
        newStatus: status || previousStatus
      });
    }

    // Update status
    if (status) {
      contactForm.status = status;
    }

    await contactForm.save();
    await contactForm.populate('customer', 'name email phone company');
    await contactForm.populate('editHistory.editedBy', 'name email');

    res.json(contactForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete contact form
// @route   DELETE /api/contact-forms/:id
// @access  Private (Employee only)
exports.deleteContactForm = async (req, res) => {
  try {
    const contactForm = await ContactForm.findById(req.params.id);

    if (!contactForm) {
      return res.status(404).json({ message: 'Contact form not found' });
    }

    await contactForm.deleteOne();

    res.json({ message: 'Contact form removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
