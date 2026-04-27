import axios from "axios";
import React, { useEffect, useState } from "react";

const Home = () => {
  const [brokings, setBrokings] = useState([]);
  const [loading, setLoading] = useState(true);
  const getBrokings = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_backendUrl}/api/broker/fetch/broking`,
      );
      if (res.status === 200 && res.data.brokings) {
        setBrokings(res.data.brokings);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getBrokings();
  }, []);
  return <div className="nt-16">Home</div>;
};

export default Home;
