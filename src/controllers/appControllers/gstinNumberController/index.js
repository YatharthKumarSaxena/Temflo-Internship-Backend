const mongoose = require('mongoose');

const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const read = require('./read');
const remove = require('./remove');
const update = require('./update');
const create = require('./create')
const paginatedList = require('./paginatedList');

function modelController() {
  const Model = mongoose.model('GstinNumber');
  const methods = createCRUDController('GstinNumber');

  methods.read = (req, res) => read(Model, req, res);
  methods.update = (req, res) => update(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.create = (req,res) => create(Model, req,res)
  methods.list = (req, res) => paginatedList(Model, req, res);

  return methods;
}

module.exports = modelController();
