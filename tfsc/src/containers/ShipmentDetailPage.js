import React, { useState } from 'react';
import { Icon, Button } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import GenerateProofForm from './Forms/GenerateProof';
import ConfirmDeliveryForm from './Forms/ConfirmDelivery';
import Proofs from '../components/Proofs';

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

  const styles = {
    infoGroups: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: '10px'
    },
    infoItem: {
      // marginLeft: '10px',
      // marginRight: '10px'
    }
  };
  return (
    <>
      <GenerateProofForm dialogIsOpen={gpDialogIsOpen} setDialogOpenState={setGpDialogOpenState} />
      <ConfirmDeliveryForm
        dialogIsOpen={cdDialogIsOpen}
        setDialogOpenState={setCdDialogOpenState}
        shipment={props}
      />
      <div
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        <Icon icon="arrow-left" />
        <p>Back</p>
      </div>
      <Button
        onClick={() => {
          setCdDialogOpenState(true);
        }}
      >
        Confirm Delivery
      </Button>
      <Button>Add Document</Button>
      {props.state === 'Confirmed' ? (
        <Button
          onClick={(e) => {
            setGpDialogOpenState(true);
            e.stopPropagation();
          }}
          style={{ marginRight: '5px' }}
          intent="primary"
        >
          Generate Proof
        </Button>
      ) : (
        <></>
      )}
      <div
        style={{
          marginLeft: '5%',
          marginRight: '5%',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <>Shipment Number: FDFJK53</>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '40vw'
            }}
          >
            <div style={styles.infoGroups}>
              <div style={styles.infoItem}>
                <p>Ship From</p>
                <p>{props.shipFrom}</p>
              </div>
              <div style={styles.infoItem}>
                <p>Ship To</p>
                <p>{props.shipTo}</p>
              </div>
              <div style={styles.infoItem}>
                <p>Vehicle/Transport</p>
                <p>Air</p>
              </div>
              <div style={styles.infoItem}>
                <p>Quantity</p>
                <p>1000</p>
              </div>
            </div>

            <div style={styles.infoGroups}>
              <div style={styles.infoItem}>
                <p>Due Date</p>
                <p>{new Date().toISOString()}</p>
              </div>
              <div style={styles.infoItem}>
                <p>Transporter</p>
                <p>Company Name</p>
              </div>
              <div style={styles.infoItem}>
                <p>Date</p>
                <p>{new Date().toISOString()}</p>
              </div>
              <div style={styles.infoItem}>
                <p>Status</p>
                <p>{props.state}</p>
              </div>
            </div>
          </div>
        </div>

        {proofs.length > 0 ? (
          <div style={{ width: '20vw' }}>
            <div>{loadingProofs ? <div>Loading...</div> : <Proofs data={proofs} />}</div>
          </div>
        ) : (
          <></>
        )}

        <div style={{ width: '20vw' }}>
          <>Documents</>
          <div>
            {loading ? (
              <div>Loading...</div>
            ) : (
              data.map(d => (
                <div
                  key={data}
                  style={{ display: 'flex', flexDirection: 'row' }}
                >
                  <Icon icon="document" />
                  <p>{d}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShipmentDetailPage;
