import { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';

const DEV = process.env.development;
// eslint-disable-next-line import/prefer-default-export
export const useFetch = (method) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchUrl() {
    fetch(
      !DEV
        ? `api/channels/common/chaincodes/trade-finance-chaincode?fcn=${method}`
        : `http://localhost:3000/${method}`
    ).then((res) => {
      res.json().then((d) => {
        setData(d);
        setLoading(false);
      });
    });
  }

  useEffect(() => {
    fetchUrl();
  }, []);

  return [data, loading, setData];
};
