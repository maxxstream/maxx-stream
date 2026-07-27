const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientController');

router.get('/', ctrl.getClients);
router.get('/stats', ctrl.getStats);
router.get('/export', ctrl.exportClients);
router.get('/crm/conversas', ctrl.getCRMConversas);
router.get('/:id', ctrl.getClientById);
router.post('/', ctrl.addClient);
router.post('/crm/send', ctrl.sendCRM);
router.post('/generate-test', ctrl.generateTest);
router.post('/:id/notify', ctrl.notifyClient);
router.delete('/:id', ctrl.deleteClient);

module.exports = router;