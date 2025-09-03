
salaryTemplateAllowanceRouter.get('/', async (req, res) => res.json(await SalaryTemplateAllowance.find()));
salaryTemplateAllowanceRouter.post('/', async (req, res) => res.status(201).json(await SalaryTemplateAllowance.create(req.body)));
salaryTemplateAllowanceRouter.put('/:id', async (req, res) => res.json(await SalaryTemplateAllowance.findByIdAndUpdate(req.params.id, req.body, { new: true })));
salaryTemplateAllowanceRouter.delete('/:id', async (req, res) => { await SalaryTemplateAllowance.findByIdAndDelete(req.params.id); res.sendStatus(204); });
module.exports = salaryTemplateAllowanceRouter;
