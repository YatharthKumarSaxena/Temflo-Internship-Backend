const mongoose = require('mongoose');

const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const read = require('./read');
const remove = require('./remove');
const update = require('./update');
const create = require('./create');
const feature = require('./feature')

function modelController() {
  const Model = mongoose.model('Permission');
  const UserModel = mongoose.model('User')
  const methods = createCRUDController('Permission');

  methods.update = (req, res) => update(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.create = (req,res) => create(Model,req,res)
  methods.read = (req,res) => read(Model,req,res);
  methods.feature = (req,res) => feature(UserModel,req,res)

  return methods;
}

module.exports = modelController();
