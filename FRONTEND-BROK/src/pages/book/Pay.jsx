import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";

const Pay = () => {
  const param = useParams();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!param?.id || !param?.price) {
      setPayment({ error: "Missing booking or amount." });
      return;
    }
    api
      .post("/api/payment/create-payment", {
        amount: param.price,
        id: param.id,
      })
      .then((res) => setPayment(res.data))
      .catch((err) =>
        setPayment({
          message: err.response?.data?.message || "Payment setup failed.",
        }),
      );
  }, [param?.id, param?.price]);

  if (!payment) return <div>Loading...</div>;

  if (payment.message && !payment.signature) {
    return (
      <div className="flex justify-center items-center h-screen px-4 text-center text-red-600">
        {payment.message}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      {console.log(payment)}
      <form
        action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        method="POST"
        className="p-6 border rounded-lg shadow-lg"
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
          value="https://propatyc.vercel.app/payment-success"
        />

        <input
          type="hidden"
          name="failure_url"
          value="https://propatyc.vercel.app/payment-failure"
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
