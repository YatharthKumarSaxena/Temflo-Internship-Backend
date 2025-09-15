const Customer = require('../../models/SalesModels/CustomerModel');
const { indianStates, countries, pinCodeValidation } = require('../../config/indianStates');

class CustomerController {
  // Create new customer
  async createCustomer(req, res) {
    try {
      console.log('📥 Customer creation request received:', {
        body: req.body,
        user: req.user?.id,
        admin: req.admin?.companyId,
      });

      const customerData = {
        ...req.body,
        companyId: req.admin.companyId,
        createdBy: req.user.id,
        enteredBy: req.user.id,
        status: 'active',
      };

      console.log('📋 Processed customer data:', customerData);

      // Validate pin code
      if (customerData.pinCode && !pinCodeValidation.isValidPinCode(customerData.pinCode)) {
        console.log('❌ Invalid pin code:', customerData.pinCode);
        return res.status(400).json({
          success: false,
          message: 'Invalid pin code format',
        });
      }

      // Initialize maker-checker default state
      customerData.makerChecker = {
        maker: req.user.id,
        checker: req.body.makerChecker?.checker || undefined,
      };
      // Enforce maker-checker separation
      if (
        customerData.makerChecker.checker &&
        customerData.makerChecker.checker.toString() === req.user.id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Maker cannot be assigned as checker',
        });
      }
      customerData.approvalStatus = customerData.makerChecker.checker ? 'pending' : 'draft';

      const customer = new Customer(customerData);
      console.log('💾 Saving customer to database...');
      await customer.save();
      console.log('✅ Customer saved successfully:', customer._id);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      console.error('❌ Error creating customer:', error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Customer code or GSTIN already exists',
        });
      }
      if (error.message.includes('Only one customer code')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('GSTIN digits') || error.message.includes('PAN 4th digit')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      });
    }
  }

  /**
   * Assign checker to customer (maker or admin/owner as per config)
   */
  async assignChecker(req, res) {
    try {
      const { id } = req.params;
      const { checkerId } = req.body;

      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Only allow assignment if not already approved/rejected
      if (customer.approvalStatus === 'approved' || customer.approvalStatus === 'rejected') {
        return res.status(400).json({ success: false, message: 'Customer already finalized' });
      }

      // Enforce maker-checker separation
      if (checkerId && customer.makerChecker?.maker?.toString() === checkerId.toString()) {
        return res.status(400).json({ success: false, message: 'Maker cannot be a checker' });
      }
      if (
        checkerId &&
        req.user.id &&
        req.user.id.toString() === customer.makerChecker?.maker?.toString()
      ) {
        // Maker is assigning – still fine as long as checker != maker; already checked above
      }

      customer.makerChecker.checker = checkerId;
      customer.makerChecker.checkerAssignedBy = req.user.id;
      customer.makerChecker.checkerAssignedAt = new Date();
      customer.updatedBy = req.user.id;

      // Move to pending state if currently draft
      if (customer.approvalStatus === 'draft') {
        customer.approvalStatus = 'pending';
      }

      await customer.save();

      res.json({ success: true, data: customer, message: 'Checker assigned successfully' });
    } catch (error) {
      console.error('Error assigning checker:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * Checker approves or rejects a customer
   */
  async checkerAction(req, res) {
    try {
      const { id } = req.params;
      const { action, comments } = req.body; // 'approved' | 'rejected'

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Must have an assigned checker
      if (!customer.makerChecker?.checker) {
        return res.status(400).json({ success: false, message: 'No checker assigned' });
      }

      // Extra safety: ensure maker and checker are not same on record
      if (
        customer.makerChecker?.maker &&
        customer.makerChecker?.checker &&
        customer.makerChecker.maker.toString() === customer.makerChecker.checker.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state: maker and checker cannot be the same user',
        });
      }

      // Only the checker can take action
      if (customer.makerChecker.checker.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      customer.makerChecker.checkerAction = action;
      customer.makerChecker.checkerActionAt = new Date();
      customer.makerChecker.checkerComments = comments;
      customer.updatedBy = req.user.id;

      customer.approvalStatus = action === 'approved' ? 'approved' : 'rejected';
      customer.approvalHistory.push({
        approver: req.user.id,
        action,
        comments,
        approvedAt: new Date(),
      });

      await customer.save();

      res.json({ success: true, data: customer, message: `Customer ${action} successfully` });
    } catch (error) {
      console.error('Error in checker action:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get all customers with pagination and filters
  async getCustomers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        legalStatus,
        gstRegistered,
        state,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query = { companyId: req.admin.companyId };

      // Add search filter
      if (search) {
        query.$or = [
          { partyName: { $regex: search, $options: 'i' } },
          { partyCode: { $regex: search, $options: 'i' } },
          { pan: { $regex: search, $options: 'i' } },
          { gstin: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
        ];
      }

      // Add status filter
      if (status) {
        query.status = status;
      }

      // Add legal status filter
      if (legalStatus) {
        query.legalStatus = legalStatus;
      }

      // Add GST registered filter
      if (gstRegistered) {
        query.gstRegistered = gstRegistered;
      }

      // Add state filter
      if (state) {
        query.state = state;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const customers = await Customer.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('enteredBy', 'name email')
        .populate('lastChangeBy', 'name email')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCustomers = await Customer.countDocuments(query);

      res.json({
        success: true,
        data: customers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCustomers / limit),
          totalItems: totalCustomers,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get customer by ID
  async getCustomerById(req, res) {
    try {
      const customer = await Customer.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('enteredBy', 'name email')
        .populate('lastChangeBy', 'name email');

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update customer
  async updateCustomer(req, res) {
    try {
      const customerData = {
        ...req.body,
        updatedBy: req.user.id,
        lastChangeBy: req.user.id,
        lastChangeDate: new Date(),
      };

      // Remove fields that shouldn't be updated
      delete customerData.partyCode;
      delete customerData.createdBy;
      delete customerData.companyId;
      delete customerData.enteredBy;
      delete customerData.entryDate;

      const customer = await Customer.findByIdAndUpdate(req.params.id, customerData, {
        new: true,
        runValidators: true,
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error) {
      if (error.message.includes('Only one customer code')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('GSTIN digits') || error.message.includes('PAN 4th digit')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(req, res) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        {
          status: 'inactive',
          updatedBy: req.user.id,
          lastChangeBy: req.user.id,
          lastChangeDate: new Date(),
        },
        { new: true }
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get customer statistics
  async getCustomerStats(req, res) {
    try {
      const totalCustomers = await Customer.countDocuments({ companyId: req.admin.companyId });
      const activeCustomers = await Customer.countDocuments({
        companyId: req.admin.companyId,
        status: 'active',
      });
      const gstRegisteredCustomers = await Customer.countDocuments({
        companyId: req.admin.companyId,
        gstRegistered: { $in: ['Yes', 'Composite'] },
      });
      const msmeCustomers = await Customer.countDocuments({
        companyId: req.admin.companyId,
        msme: true,
      });

      res.json({
        success: true,
        data: {
          total: totalCustomers,
          active: activeCustomers,
          gstRegistered: gstRegisteredCustomers,
          msme: msmeCustomers,
        },
      });
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Validate GSTIN uniqueness
  async validateGstin(req, res) {
    try {
      const { gstin } = req.body;

      if (!gstin) {
        return res.status(400).json({
          success: false,
          message: 'GSTIN is required',
        });
      }

      const existingCustomer = await Customer.findOne({
        gstin,
        companyId: req.admin.companyId,
      });

      res.json({
        success: true,
        isUnique: !existingCustomer,
        message: existingCustomer ? 'GSTIN already exists' : 'GSTIN is available',
      });
    } catch (error) {
      console.error('Error validating GSTIN:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get master data for forms
  async getMasterData(req, res) {
    try {
      res.json({
        success: true,
        data: {
          states: indianStates,
          countries: countries,
          legalStatuses: [
            'Individual',
            'Partnership',
            'AOP',
            'BOI',
            'Company',
            'LLP',
            'Proprietorship',
            'Trust',
            'Society',
          ],
          gstRegisteredOptions: ['Yes', 'No', 'Composite'],
        },
      });
    } catch (error) {
      console.error('Error fetching master data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = new CustomerController();
