const crypto = require("crypto");
const axios = require("axios");
const BookingModel = require("../Models/BookingModel");
const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
const PaymentModel = require("../Models/PaymentModel");
const { isValidObjectId, sendServerError } = require("../utils/authHelpers");
const {
  pushUserNotification,
  NOTIFICATION_KINDS,
} = require("../utils/notificationsHelper");

/**
 * Resolve eSewa v2 configuration (supports both UAT/Sandbox and Production).
 * Set `ESEWA_ENV=production`, `ESEWA_PRODUCT_CODE`, and `ESEWA_HMAC_SECRET` in `.env` for live merchant traffic.
 */
function getEsewaConfig() {
  const isLive = process.env.ESEWA_ENV === "production";
  const secret =
    process.env.ESEWA_HMAC_SECRET ||
    process.env.PAYMENT_HMAC_SECRET ||
    (!isLive ? "8gBm/:&EnhH.1/q" : "");
  const productCode =
    process.env.ESEWA_PRODUCT_CODE || (!isLive ? "EPAYTEST" : "");

  return {
    enabled: Boolean(secret && productCode),
    mode: isLive ? "production" : "sandbox",
    secret,
    productCode,
    formUrl: isLive
      ? "https://epay.esewa.com.np/api/epay/main/v2/form"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusUrl: isLive
      ? "https://epay.esewa.com.np/api/epay/transaction/status/"
      : "https://rc.esewa.com.np/api/epay/transaction/status/",
  };
}

/**
 * Resolve Khalti ePayment v2 (KPG-2 — Wallet, Mobile Banking, SCT & ConnectIPS).
 * Set `KHALTI_SECRET_KEY` (and `KHALTI_ENV=production` for live keys) in `.env`.
 */
function getKhaltiConfig() {
  const isLive = process.env.KHALTI_ENV === "production";
  const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
  return {
    enabled: Boolean(secretKey),
    mode: isLive ? "production" : "sandbox",
    secretKey,
    baseUrl: isLive ? "https://khalti.com/api/v2" : "https://dev.khalti.com/api/v2",
  };
}

function resolveReturnOrigin(bodyOrigin) {
  if (typeof bodyOrigin === "string" && /^https?:\/\//i.test(bodyOrigin)) {
    const clean = bodyOrigin.replace(/\/+$/, "");
    // Never send payment gateway redirects to capacitor's internal https://localhost
    if (!/^https?:\/\/localhost(?::\d+)?$/i.test(clean) || process.env.NODE_ENV !== "production") {
      if (clean !== "https://localhost") return clean;
    }
  }
  return (
    process.env.PUBLIC_WEB_ORIGIN ||
    process.env.FRONTEND2 ||
    process.env.FRONTEND1 ||
    "https://propatyc.vercel.app"
  ).replace(/\/+$/, "");
}

function signEsewaMessage(message, secret) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

function safeEqualString(a, b) {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function markPaymentComplete(payment, { gatewayRef, rawPayload }) {
  if (payment.status === "completed") {
    return payment;
  }

  const now = new Date();
  const updated = await PaymentModel.findOneAndUpdate(
    { _id: payment._id, status: { $ne: "completed" } },
    {
      $set: {
        status: "completed",
        gatewayRef: gatewayRef || payment.gatewayRef,
        verifiedAt: now,
        rawPayload: rawPayload ?? payment.rawPayload,
      },
    },
    { new: true },
  );

  const finalDoc = updated || (await PaymentModel.findById(payment._id));

  await BookingModel.updateOne(
    { _id: payment.bookingId },
    {
      $set: {
        paymentStatus: "paid",
        paymentGateway: payment.gateway,
        paymentRef: gatewayRef || payment.transactionUuid,
        paidAt: now,
        status: true,
      },
    },
  );

  // Notify buyer and property owner (best-effort)
  if (updated) {
    const prop = await PropertyModel.findById(payment.propId)
      .select("_id title owner")
      .lean();
    const label = payment.gateway === "khalti" ? "Khalti" : "eSewa";
    const fmtAmount = new Intl.NumberFormat("en-IN").format(payment.amount);
    const title = prop?.title || "property reservation";

    await Promise.allSettled([
      pushUserNotification(payment.userId, {
        title: "Payment verified",
        body: `रू. ${fmtAmount} paid via ${label} for "${title}".`,
        kind: NOTIFICATION_KINDS.PAYMENT_RECEIVED,
        propId: payment.propId,
        bookingId: payment.bookingId,
      }),
      prop?.owner
        ? pushUserNotification(prop.owner, {
            title: "Reservation paid",
            body: `Buyer completed रू. ${fmtAmount} payment via ${label} for "${title}".`,
            kind: NOTIFICATION_KINDS.PAYMENT_RECEIVED,
            propId: payment.propId,
            bookingId: payment.bookingId,
          })
        : null,
    ]);
  }

  return finalDoc;
}

// GET /api/payment/config
exports.getPaymentConfig = async (_req, res) => {
  const esewa = getEsewaConfig();
  const khalti = getKhaltiConfig();
  return res.status(200).json({
    success: true,
    gateways: {
      esewa: { enabled: esewa.enabled, mode: esewa.mode },
      khalti: { enabled: khalti.enabled, mode: khalti.mode },
      cash: { enabled: true },
    },
  });
};

// POST /api/payment/initiate  (also aliased to /create-payment for backwards compatibility)
exports.initiatePayment = async (req, res) => {
  try {
    const bookingId = req.body?.bookingId || req.body?.id;
    const gateway = String(req.body?.gateway || "esewa").toLowerCase();
    const userId = req.userId;

    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Valid booking id is required." });
    }
    if (!["esewa", "khalti", "cash"].includes(gateway)) {
      return res.status(400).json({ message: "Unsupported payment gateway." });
    }

    const booking = await BookingModel.findById(bookingId).lean();
    if (!booking || !booking.active) {
      return res.status(404).json({ message: "Active booking not found." });
    }
    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized to pay for this booking." });
    }
    if (booking.bType === "visit") {
      return res.status(400).json({ message: "Site visits are free and do not require payment." });
    }
    if (!booking.status) {
      return res.status(400).json({ message: "Wait for the property owner to confirm this booking first." });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(409).json({ message: "This booking has already been paid." });
    }

    const totalAmount = Math.round(Number(String(booking.price).replace(/,/g, "")));
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid booking amount." });
    }

    const [prop, buyer] = await Promise.all([
      PropertyModel.findById(booking.propId).select("_id title owner").lean(),
      UserModel.findById(userId).select("username email phone").lean(),
    ]);

    const transactionUuid = `PMS-${bookingId}-${Date.now()}`;
    const origin = resolveReturnOrigin(req.body?.returnOrigin);

    // 1. Pay at Property / Cash / Bank Handover
    if (gateway === "cash") {
      const payment = await PaymentModel.create({
        bookingId: booking._id,
        propId: booking.propId,
        userId,
        ownerId: prop?.owner || null,
        gateway: "cash",
        amount: totalAmount,
        transactionUuid,
        status: "pay_at_property",
      });

      await BookingModel.updateOne(
        { _id: booking._id },
        {
          $set: {
            paymentStatus: "pay_at_property",
            paymentGateway: "cash",
            paymentRef: transactionUuid,
          },
        },
      );

      if (prop?.owner) {
        await pushUserNotification(prop.owner, {
          title: "Pay-at-property selected",
          body: `${buyer?.username || "Buyer"} chose to settle रू. ${new Intl.NumberFormat("en-IN").format(totalAmount)} in person for "${prop.title}".`,
          kind: NOTIFICATION_KINDS.BOOKING_CONFIRMED,
          propId: prop._id,
          bookingId: booking._id,
        });
      }

      return res.status(200).json({
        success: true,
        gateway: "cash",
        completed: true,
        bookingId: booking._id,
        propId: booking.propId,
        transaction_uuid: payment.transactionUuid,
        total_amount: totalAmount,
      });
    }

    // 2. Khalti ePayment v2 (Khalti Wallet, Mobile Banking, SCT, ConnectIPS)
    if (gateway === "khalti") {
      const khalti = getKhaltiConfig();
      if (!khalti.enabled) {
        return res.status(503).json({
          message: "Khalti is not configured yet (set KHALTI_SECRET_KEY on server).",
        });
      }

      const khaltiPayload = {
        return_url: `${origin}/payment-success`,
        website_url: origin,
        amount: totalAmount * 100, // NPR -> paisa
        purchase_order_id: transactionUuid,
        purchase_order_name: (prop?.title || "Propatyc Reservation").slice(0, 80),
        customer_info: {
          name: buyer?.username || "Propatyc Customer",
          email: buyer?.email || "customer@propatyc.app",
          ...(buyer?.phone ? { phone: buyer.phone } : {}),
        },
      };

      const khaltiRes = await axios.post(
        `${khalti.baseUrl}/epayment/initiate/`,
        khaltiPayload,
        {
          headers: {
            Authorization: `Key ${khalti.secretKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const { pidx, payment_url } = khaltiRes.data || {};
      if (!pidx || !payment_url) {
        return res.status(502).json({ message: "Unexpected response from Khalti." });
      }

      await PaymentModel.create({
        bookingId: booking._id,
        propId: booking.propId,
        userId,
        ownerId: prop?.owner || null,
        gateway: "khalti",
        amount: totalAmount,
        transactionUuid,
        pidx,
        status: "initiated",
      });

      return res.status(200).json({
        success: true,
        gateway: "khalti",
        mode: khalti.mode,
        pidx,
        payment_url,
        transaction_uuid: transactionUuid,
        total_amount: totalAmount,
      });
    }

    // 3. eSewa ePay v2
    const esewa = getEsewaConfig();
    if (!esewa.enabled) {
      return res.status(503).json({
        message: "eSewa merchant credentials are not configured on the server.",
      });
    }

    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${esewa.productCode}`;
    const signature = signEsewaMessage(message, esewa.secret);

    await PaymentModel.create({
      bookingId: booking._id,
      propId: booking.propId,
      userId,
      ownerId: prop?.owner || null,
      gateway: "esewa",
      amount: totalAmount,
      transactionUuid,
      status: "initiated",
    });

    const fields = {
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: esewa.productCode,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${origin}/payment-success`,
      failure_url: `${origin}/payment-failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return res.status(200).json({
      success: true,
      gateway: "esewa",
      mode: esewa.mode,
      formUrl: esewa.formUrl,
      fields,
      // Legacy top-level keys kept for backwards compatibility
      ...fields,
    });
  } catch (err) {
    if (err.response?.data) {
      console.error("Payment gateway error:", err.response.data);
      const detail =
        err.response.data?.detail ||
        err.response.data?.error_key ||
        "Gateway rejected payment initiation.";
      return res.status(502).json({ message: String(detail) });
    }
    return sendServerError(res, err, "initiatePayment");
  }
};

exports.CreatePayment = exports.initiatePayment;

// POST /api/payment/verify/esewa  { data?: "<base64>", transactionUuid?: string, bookingId?: string }
exports.verifyEsewa = async (req, res) => {
  try {
    const rawData = typeof req.body?.data === "string" ? req.body.data.trim() : "";
    const fallbackUuid =
      typeof req.body?.transactionUuid === "string" ? req.body.transactionUuid.trim() : "";
    const fallbackBookingId =
      typeof req.body?.bookingId === "string" ? req.body.bookingId.trim() : "";

    const esewa = getEsewaConfig();
    if (!esewa.enabled) {
      return res.status(503).json({ message: "eSewa verification is not configured." });
    }

    // Fallback server-to-server lookup when redirect query param was stripped/missing
    if (!rawData && (fallbackUuid || (fallbackBookingId && isValidObjectId(fallbackBookingId)))) {
      const payment = fallbackUuid
        ? await PaymentModel.findOne({ transactionUuid: fallbackUuid, gateway: "esewa" })
        : await PaymentModel.findOne({ bookingId: fallbackBookingId, gateway: "esewa" }).sort({
            createdAt: -1,
          });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found." });
      }

      if (payment.status === "completed") {
        return res.status(200).json({
          success: true,
          verified: true,
          payment: {
            bookingId: payment.bookingId,
            propId: payment.propId,
            gateway: "esewa",
            amount: payment.amount,
            reference: payment.gatewayRef || payment.transactionUuid,
            verifiedAt: payment.verifiedAt,
          },
        });
      }

      const statusResp = await axios.get(esewa.statusUrl, {
        params: {
          product_code: esewa.productCode,
          total_amount: payment.amount,
          transaction_uuid: payment.transactionUuid,
        },
        timeout: 15000,
      });

      if (statusResp.data?.status !== "COMPLETE") {
        return res.status(400).json({
          message: `eSewa payment status: ${statusResp.data?.status || "PENDING"}.`,
        });
      }

      const completed = await markPaymentComplete(payment, {
        gatewayRef: statusResp.data?.ref_id || payment.transactionUuid,
        rawPayload: statusResp.data,
      });

      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          bookingId: completed.bookingId,
          propId: completed.propId,
          gateway: "esewa",
          amount: completed.amount,
          reference: completed.gatewayRef,
          verifiedAt: completed.verifiedAt,
        },
      });
    }

    if (!rawData) {
      return res.status(400).json({ message: "Missing eSewa payment payload." });
    }

    // Restore '+' if URL query decoding turned '+' into spaces
    const normalizedBase64 = rawData.replace(/\s/g, "+");
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(normalizedBase64, "base64").toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid base64 eSewa payload." });
    }

    const {
      transaction_uuid,
      total_amount,
      transaction_code,
      status,
      signed_field_names,
      signature,
    } = decoded || {};

    if (!transaction_uuid || !signature || !signed_field_names) {
      return res.status(400).json({ message: "Incomplete eSewa response fields." });
    }

    const payment = await PaymentModel.findOne({ transactionUuid: transaction_uuid });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    if (payment.status === "completed") {
      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          bookingId: payment.bookingId,
          propId: payment.propId,
          gateway: "esewa",
          amount: payment.amount,
          reference: payment.gatewayRef || transaction_code || payment.transactionUuid,
          verifiedAt: payment.verifiedAt,
        },
      });
    }

    // 1. Verify HMAC-SHA256 signature over signed_field_names
    const signedMsg = String(signed_field_names)
      .split(",")
      .map((field) => `${field.trim()}=${decoded[field.trim()] ?? ""}`)
      .join(",");
    const expectedSig = signEsewaMessage(signedMsg, esewa.secret);
    if (!safeEqualString(signature, expectedSig)) {
      await PaymentModel.updateOne(
        { _id: payment._id },
        { $set: { status: "failed", rawPayload: decoded } },
      );
      return res.status(400).json({ message: "eSewa signature verification failed." });
    }

    const parsedTotal = Number(String(total_amount).replace(/,/g, ""));
    if (status !== "COMPLETE" || Math.round(parsedTotal) !== Math.round(payment.amount)) {
      return res.status(400).json({ message: "Payment is not complete or amount mismatched." });
    }

    // 2. Server-to-server eSewa Status Check API
    const statusResp = await axios.get(esewa.statusUrl, {
      params: {
        product_code: esewa.productCode,
        total_amount: payment.amount,
        transaction_uuid: payment.transactionUuid,
      },
      timeout: 15000,
    });

    if (statusResp.data?.status !== "COMPLETE") {
      return res.status(400).json({
        message: `eSewa reported status: ${statusResp.data?.status || "UNKNOWN"}.`,
      });
    }

    const completed = await markPaymentComplete(payment, {
      gatewayRef: statusResp.data?.ref_id || transaction_code,
      rawPayload: statusResp.data,
    });

    return res.status(200).json({
      success: true,
      verified: true,
      payment: {
        bookingId: completed.bookingId,
        propId: completed.propId,
        gateway: "esewa",
        amount: completed.amount,
        reference: completed.gatewayRef,
        verifiedAt: completed.verifiedAt,
      },
    });
  } catch (err) {
    return sendServerError(res, err, "verifyEsewa");
  }
};

// POST /api/payment/verify/khalti  { pidx }
exports.verifyKhalti = async (req, res) => {
  try {
    const pidx = req.body?.pidx;
    if (!pidx || typeof pidx !== "string") {
      return res.status(400).json({ message: "Missing Khalti pidx." });
    }

    const payment = await PaymentModel.findOne({ pidx: pidx.trim() });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    if (payment.status === "completed") {
      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          bookingId: payment.bookingId,
          propId: payment.propId,
          gateway: "khalti",
          amount: payment.amount,
          reference: payment.gatewayRef || payment.pidx,
          verifiedAt: payment.verifiedAt,
        },
      });
    }

    const khalti = getKhaltiConfig();
    if (!khalti.enabled) {
      return res.status(503).json({ message: "Khalti verification is not configured." });
    }

    const lookupRes = await axios.post(
      `${khalti.baseUrl}/epayment/lookup/`,
      { pidx: payment.pidx },
      {
        headers: {
          Authorization: `Key ${khalti.secretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const lookup = lookupRes.data || {};
    if (lookup.status !== "Completed") {
      if (["Expired", "User canceled"].includes(lookup.status)) {
        await PaymentModel.updateOne(
          { _id: payment._id },
          { $set: { status: "failed", rawPayload: lookup } },
        );
      }
      return res.status(400).json({
        message: `Khalti payment status: ${lookup.status || "Pending"}.`,
      });
    }

    if (Math.round(Number(lookup.total_amount)) !== Math.round(payment.amount * 100)) {
      return res.status(400).json({ message: "Khalti payment amount mismatch." });
    }

    const completed = await markPaymentComplete(payment, {
      gatewayRef: lookup.transaction_id || payment.pidx,
      rawPayload: lookup,
    });

    return res.status(200).json({
      success: true,
      verified: true,
      payment: {
        bookingId: completed.bookingId,
        propId: completed.propId,
        gateway: "khalti",
        amount: completed.amount,
        reference: completed.gatewayRef,
        verifiedAt: completed.verifiedAt,
      },
    });
  } catch (err) {
    return sendServerError(res, err, "verifyKhalti");
  }
};

// GET /api/payment/booking/:bookingId
exports.getBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const booking = await BookingModel.findById(bookingId)
      .select("_id propId userId price paymentStatus paymentGateway paymentRef paidAt")
      .lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const isBuyer = String(booking.userId) === String(req.userId);
    if (!isBuyer) {
      const prop = await PropertyModel.findById(booking.propId).select("owner").lean();
      if (!prop || String(prop.owner) !== String(req.userId)) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }

    let latestPayment = await PaymentModel.findOne({ bookingId }).sort({ createdAt: -1 });

    // Auto-reconcile pending gateway payment if buyer completed it on eSewa/Khalti
    if (latestPayment && latestPayment.status === "initiated" && booking.paymentStatus !== "paid") {
      try {
        if (latestPayment.gateway === "esewa") {
          const esewa = getEsewaConfig();
          if (esewa.enabled) {
            const statusResp = await axios.get(esewa.statusUrl, {
              params: {
                product_code: esewa.productCode,
                total_amount: latestPayment.amount,
                transaction_uuid: latestPayment.transactionUuid,
              },
              timeout: 10000,
            });
            if (statusResp.data?.status === "COMPLETE") {
              latestPayment = await markPaymentComplete(latestPayment, {
                gatewayRef: statusResp.data?.ref_id || latestPayment.transactionUuid,
                rawPayload: statusResp.data,
              });
              booking.paymentStatus = "paid";
              booking.paymentGateway = "esewa";
              booking.paymentRef = latestPayment.gatewayRef;
              booking.paidAt = latestPayment.verifiedAt;
            }
          }
        } else if (latestPayment.gateway === "khalti" && latestPayment.pidx) {
          const khalti = getKhaltiConfig();
          if (khalti.enabled) {
            const lookupRes = await axios.post(
              `${khalti.baseUrl}/epayment/lookup/`,
              { pidx: latestPayment.pidx },
              {
                headers: {
                  Authorization: `Key ${khalti.secretKey}`,
                  "Content-Type": "application/json",
                },
                timeout: 10000,
              },
            );
            if (
              lookupRes.data?.status === "Completed" &&
              Math.round(Number(lookupRes.data?.total_amount)) ===
                Math.round(latestPayment.amount * 100)
            ) {
              latestPayment = await markPaymentComplete(latestPayment, {
                gatewayRef: lookupRes.data?.transaction_id || latestPayment.pidx,
                rawPayload: lookupRes.data,
              });
              booking.paymentStatus = "paid";
              booking.paymentGateway = "khalti";
              booking.paymentRef = latestPayment.gatewayRef;
              booking.paidAt = latestPayment.verifiedAt;
            }
          }
        }
      } catch {
        /* best-effort reconciliation */
      }
    }

    return res.status(200).json({
      success: true,
      booking,
      latestPayment: latestPayment
        ? {
            gateway: latestPayment.gateway,
            amount: latestPayment.amount,
            transactionUuid: latestPayment.transactionUuid,
            gatewayRef: latestPayment.gatewayRef,
            status: latestPayment.status,
            verifiedAt: latestPayment.verifiedAt,
            createdAt: latestPayment.createdAt,
          }
        : null,
    });
  } catch (err) {
    return sendServerError(res, err, "getBookingPayment");
  }
};
