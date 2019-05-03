const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const multer = require('multer');
const proxy = require('http-proxy-middleware');
const axios = require('axios');
const uuid = require('uuid/v4');

const upload = multer();

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 4002;

const ORDERS = {
  result: []
};
const testInvoicId = uuid();
const INVOICES = {
  result: [
    {
      key: {
        id: testInvoicId
      },
      value: {
        debtor: 'a',
        beneficiary: 'b',
        totalDue: '123',
        dueDate: '12.12.19',
        owner: 'b',
        state: 1
      }
    }
  ]
};
const BIDS = {
  result: []
};
const CONTRACTS = {
  result: [
    {
      key: {
        id: 'contract-id'
      },
      value: {
        consignorName: 'Buyer',
        consigneeName: 'Supplier',
        totalDue: 'totalDue',
        quantity: 'quantity',
        dueDate: new Date().getTime(),
        state: 'New',
        destination: 'destination',
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        documents: 'documents hashes'
      }
    }
  ]
};
const SHIPMENTS = [
  {
    shipmentId: 'test-shipment-id',
    contractId: 'contract-id',
    state: 'Requested',
    documents: [
      'Packing list',
      'Phytosanitory certificate',
      'Commercial Invoices',
      'Certificate of origin',
      'Bill of Landing',
      'Export License'
    ]
  }
];
const PROOFS = [
  {
    reportId: 'FDDSA',
    shipmentId: 'GSNJF',
    ProofId: 'MCDSEDF',
    state: 'Generated',
    contractId: 'contract-id',
    consignore: 'Buyer',
    consignee: 'Supplier',
    documents: ['Phytosanitory certificate', 'Export License', 'Packing List']
  },
  {
    reportId: 'ASDADSA',
    shipmentId: 'LLDSF',
    ProofId: 'KDSAD',
    state: 'Validated',
    contractId: 'contract-id',
    consignore: 'Buyer',
    consignee: 'Supplier',
    documents: ['Phytosanitory certificate', 'Export License', 'Packing List']
  }
];
const DOCS = [];
const REPORTS = {
  result: [
    {
      reportId: 'FDDSA',
      shipmentId: 'GSNJF',
      ProofId: 'MCDSEDF',
      state: 'Generated'
    },
    {
      reportId: 'ASDADSA',
      shipmentId: 'LLDSF',
      ProofId: 'KDSAD',
      state: 'Validated'
    }
  ]
};

const clients = [];
const app = express();
const router = express.Router();

router.use(cors());

router.use((_, __, next) => {
  setTimeout(() => {
    next();
  }, 850);
});

router.use(
  '/api',
  proxy({
    target: `http://localhost:${API_PORT}`,
    changeOrigin: true,
    logLevel: 'debug'
  })
);

router.use(bodyParser.json());

router.get('/listProofs', (_, res) => {
  res.json(PROOFS);
});

router.get('/shipments', (_, res) => {
  res.json(SHIPMENTS);
});

router.get('/listContracts', (_, res) => {
  res.json(CONTRACTS);
});

router.get('/listOrders', (_, res) => {
  res.json(ORDERS);
});

router.get('/listInvoices', (_, res) => {
  res.json(INVOICES);
});

router.get('/listBids', (_, res) => {
  res.json(BIDS);
});

router.get('/listReports', (_, res) => {
  res.json(REPORTS);
});

router.post('/uploadDocuments', upload.array('file'), (req, res) => {
  const { files } = req;

  files.forEach(f => DOCS.push(f.originalname));
  res.send('ok');
});

router.get('/documents', (req, res) => {
  res.json(DOCS);
});

router.post('/generateProof', (req, res) => {
  const id = nanoid();
  const proof = Object.assign(req.body, {
    state: 'Generated',
    proofId: id,
    dateCreated: new Date().toISOString()
  });
  PROOFS.push(proof);
  res.send('ok');
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'generateProof' }))));
});

router.post('/placeOrder', (req, res) => {
  const id = uuid();
  const order = {
    key: {
      id
    },
    value: {
      state: 1,
      dateCreated: new Date().toISOString(),
      productName: req.body.args[0],
      quantity: req.body.args[1],
      price: req.body.args[2],
      destination: req.body.args[3],
      dueDate: req.body.args[4],
      paymentDate: req.body.args[5],
      buyerId: req.body.args[6]
    },
    type: 'place'
  };
  ORDERS.result.push(order);
  res.send('ok');
  clients.forEach(c => c.emit('notification', JSON.stringify(order)));
});

router.post('/requestShipment', (req, res) => {
  const id = nanoid();
  res.send('ok');

  const shipment = Object.assign(req.body, {
    shipmentId: id,
    contractId: req.body.contractId,
    state: 'Requested',
    documents: [
      'Packing list',
      'Phytosanitory certificate',
      'Commercial Invoices',
      'Certificate of origin',
      'Bill of Landing',
      'Export License'
    ]
  });
  SHIPMENTS.push(shipment);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentRequested' }))));
});

router.post('/confirmDelivery', (req, res) => {
  const id = nanoid();
  const newInvoice = Object.assign(req.body, { state: 2 });

  INVOICES.result.push({
    key: {
      id
    },
    value: newInvoice
  });

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(newInvoice, { type: 'placeInvoice' }))));

  const shipment = SHIPMENTS.find(i => i.shipmentId === req.body.shipmentId);
  shipment.state = 'Delivered';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentDelivered' }))));

  res.send('ok');
});

router.post('/confirmShipment', (req, res) => {
  res.send('ok');
  const shipment = SHIPMENTS.find(i => i.shipmentId === req.body.shipmentId);

  shipment.state = 'Confirmed';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentConfirmed' }))));
});

router.post('/validateProof', (req, res) => {
  res.send('ok');
  const proof = PROOFS.find(i => i.proofId === req.body.proofId);

  proof.state = 'Validated';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'validateProof' }))));
});

router.post('/acceptOrder', async (req, res) => {
  const order = ORDERS.result.find(i => i.id === req.body.args[0]);

  order.state = 'Accepted';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(order, { type: 'updateOrder' }))));
  const contract = {
    contractId: order.orderId,
    consignorName: 'Buyer',
    consigneeName: 'Supplier',
    totalDue: '123',
    quantity: order.quantity,
    dueDate: new Date().getTime(),
    state: 'New',
    destination: order.destination,
    dateCreated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    documents: 'documents hashes'
  };

  try {
    const result = await axios.post(
      'http://localhost:4002/api/channels/common/chaincodes/trade-finance-chaincode',
      {
        fcn: 'registerInvoice',
        args: [
          order.orderId, // contractId
          'a',
          'b',
          contract.totalDue,
          contract.dueDate.toString(),
          '0',
          'b'
        ]
      }
    );
    console.log(result.data);
  } catch (e) {
    console.error(e);
  }

  CONTRACTS.push(contract);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'contractCreated' }))));
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'invoiceRegistered' }))));
  res.send('ok');
});

router.post('/placeInvoiceForTrade', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.result.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 3;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'placeInvoiceForTrade' }))));
});

router.post('/placeBid', (req, res) => {
  res.send('ok');
  const id = nanoid();

  const bid = {
    id,
    factor: req.body.args[2],
    rate: req.body.args[1],
    invoiceID: req.body.args[3]
  };

  BIDS.result.push(bid);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'placeBid' }))));
});

router.post('/acceptBid', (req, res) => {
  res.send('ok');
  const bid = BIDS.result.find(i => i.id === req.body.id);

  bid.state = 'Closed';

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'acceptBid' }))));
});

router.post('/acceptInvoice', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.result.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 2;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'acceptInvoice' }))));
});

app.use(express.static('./dist/client'));
app.use(router);

const server = app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});

const io = require('socket.io')(server);

io.on('connection', (client) => {
  clients.push(client);
});
