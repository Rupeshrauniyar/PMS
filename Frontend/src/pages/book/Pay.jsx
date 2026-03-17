import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Pay = () => {
  const param = useParams();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/payment/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 100, id: param.id }),
    })
      .then((res) => res.json())
      .then((data) => setPayment(data));
  }, []);

  if (!payment) return <div>Loading...</div>;

  return (
    <div className="flex justify-center items-center h-screen">
      {
        console.log(payment)
      }
      <form
        action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        method="POST"
        className="p-6 border rounded-lg shadow-md"
      >
        <input
          type="hidden"
          name="amount"
          value={payment.amount}
        />
        <input
          type="hidden"
          name="tax_amount"
          value={payment.tax_amount}
        />
        <input
          type="hidden"
          name="total_amount"
          value={payment.total_amount}
        />
        <input
          type="hidden"
          name="transaction_uuid"
          value={payment.transaction_uuid}
        />
        <input
          type="hidden"
          name="product_code"
          value={payment.product_code}
        />
        <input
          type="hidden"
          name="product_service_charge"
          value="0"
        />
        <input
          type="hidden"
          name="product_delivery_charge"
          value="0"
        />

        <input
          type="hidden"
          name="success_url"
          value="http://localhost:5173/payment-success"
        />

        <input
          type="hidden"
          name="failure_url"
          value="http://localhost:5173/payment-failure"
        />

        <input
          type="hidden"
          name="signed_field_names"
          value="total_amount,transaction_uuid,product_code"
        />

        <input
          type="hidden"
          name="signature"
          value={payment.signature}
        />

        <button className="bg-green-600 text-white px-6 py-2 rounded">
          Pay with eSewa
        </button>
      </form>
    </div>
  );
};

export default Pay;
