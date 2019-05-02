import React, { useState } from 'react';
import { Icon, Button } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import GenerateProofForm from './Forms/GenerateProof';
import ConfirmDeliveryForm from './Forms/ConfirmDelivery';
import Proofs from '../components/Proofs';
import Timeline from '../components/Timeline/Timeline';

const EVENTS = [
  {
    id: 1,
    date: '10 april 2019',
    actor: 'Buyer',
    action: 'Order Created',
    documents: ''
  },
  {
    id: 2,
    date: '20 april 2019',
    actor: 'Supplier',
    action: 'Order Accepted',
    documents: ''
  },
  {
    id: 3,
    date: '23 april 2019',
    actor: 'Supplier',
    action: 'New Shipment Requested',
    documents: 'Shipment Documents'
  },
  {
    id: 4,
    date: '25 april 2019',
    actor: 'Transporter',
    action: 'Shipment Accepted',
    documents: 'Act of Hangover'
  },
  {
    id: 5,
    date: '28 april 2019',
    actor: 'Supplier',
    action: 'Proof Generated',
    documents: ''
  }
];

const ShipmentDetailPage = (props) => {
  const [data, loading] = useFetch('documents');
  const [proofs, loadingProofs, setData] = useFetch('proofs');
  // const [docViewerDialogIsOpen, setDocViewerDialogOpenState] = useState(false);
  const [gpDialogIsOpen, setGpDialogOpenState] = useState(false);
  const [cdDialogIsOpen, setCdDialogOpenState] = useState(false);

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'generateProof') {
      const newState = proofs.concat(notification);
      setData(newState);
    }

    if (notification.type === 'validateProof') {
      const newState = proofs.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.proofId === notification.proofId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }
  };

  useSocket('notification', onNotification);

  return (
    <div>
      <GenerateProofForm dialogIsOpen={gpDialogIsOpen} setDialogOpenState={setGpDialogOpenState} />
      <ConfirmDeliveryForm
        dialogIsOpen={cdDialogIsOpen}
        setDialogOpenState={setCdDialogOpenState}
        shipment={props}
      />
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Icon icon="arrow-left" />
        <p>Back</p>
      </div>

      <div className="layout-container">
        <div className="layout-main">
          <h3>Shipment Number: FDFJK53</h3>
          {props.role === 'buyer' ? (
            <div>
              <Button
                onClick={() => {
                  setCdDialogOpenState(true);
                }}
              >
                Confirm Delivery
              </Button>
              <Button>Cancel Delivery</Button>
            </div>
          ) : (
            <></>
          )}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ship From</th>
                  <th>Ship To</th>
                  <th>Quantity</th>
                  <th>Due Date</th>
                  <th>Transporter</th>
                  <th>Vehicle/Transport</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{props.shipFrom}</td>
                  <td>{props.shipTo}</td>
                  <td>1000</td>
                  <td>{new Date().toISOString()}</td>
                  <td>Company Name</td>
                  <td>Air</td>
                  <td>{props.state}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Timeline events={EVENTS} />
        </div>

        <div className="layout-aside">
          {props.state === 'Confirmed' && (
            <Button
              onClick={(e) => {
                setGpDialogOpenState(true);
                e.stopPropagation();
              }}
              intent="primary"
              className="btn-generate-proof"
            >
              Generate Proof &nbsp;&nbsp;&nbsp;
              <Icon icon="confirm" />
            </Button>
          )}

          {proofs.length > 0 && (
            <div>{loadingProofs ? <div>Loading...</div> : <Proofs data={proofs} />}</div>
          )}

          <div className="sidebar-panel">
            <div className="sidebar-panel-header">
              <h4>Documents</h4>
            </div>
            <div className="sidebar-panel-body">
              {loading ? (
                <div>Loading...</div>
              ) : (
                data.map(d => (
                  <div key={data} style={{ display: 'flex', flexDirection: 'row' }}>
                    <Icon icon="document" />
                    <div style={{ marginLeft: '10px' }}>{d}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPage;
