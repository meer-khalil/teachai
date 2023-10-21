require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const stripe = require("./config/stripe");
const Payment = require("./models/paymentModel");
const Usage = require("./models/usageModel");
const { requestLimit } = require("./middlewares/requestLimit");
const { isAuthenticatedUser } = require("./middlewares/auth");
const User = require("./models/userModel");

const compression = require("compression");
const app = express();

app.use((req, res, next) => {
  req.setTimeout(180000); // 3 min
  next();
});
app.use(cors());

/*
    Email Body for the Plans
*/
const emailBody = {
  Free: `
    <ul>
    <li>Access To All Chatbots</li>
    <li>Free 10 chat requests per day</li>
    <li>1 member</li>
    <li>Write in 30+ languages</li>
    <li>1 free file upload</li>
</ul>
    `,
  Starter: `
    <ul>
    <li>Access to All the Chatbots</li>
    <li>60 chat requests per day</li>
    <li>1 member seat</li>
    <li>Write in 30+ languages</li>
    <li>24/7 live chat support</li>
    <li>All Grade Levels</li>
    <li>10 file uploads per month</li>
</ul>
    `,
  Professional: `
    <ul>
    <li>Access to All the Chatbots</li>
    <li>120 chat requests per day</li>
    <li>1 member seat</li>
    <li>Write in 30+ languages</li>
    <li>24/7 live chat support</li>
    <li>Access to chat history</li>
    <li>Extract responses to Word document/PDF/Google Doc/Excel</li>
    <li>All Grade Levels</li>
    <li>20 file uploads per month</li>
</ul>
    `,
};
// Match the raw body to content type application/json
// If you are using Express v4 - v4.16 you need to use body-parser, not express, to retrieve the request body
app.post(
  "/api/v1/stripe/webhook",
  express.json({ type: "application/json" }),
  (request, response) => {
    // console.log('Here is your WebhooKL: ', request.body);

    console.log("Here is your Webhook Request: ");

    const event = request.body;

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      case "checkout.session.completed":
        const checkoutSessionCompleted = event.data.object;
        console.log("Completed: ", checkoutSessionCompleted);

        stripe.customers
          .retrieve(checkoutSessionCompleted.customer)
          .then(async (customer) => {
            console.log("Customer: ", customer);
            let userId = customer.metadata.userId;
            let plan = customer.metadata.plan;
            plan = JSON.parse(plan);
            let payment = await Payment.create({
              payment: checkoutSessionCompleted,
              user: userId,
            });

            console.log("Entry Added: ", payment);

            let temp = await Usage.find({ user: userId });
            console.log("Usage Entry ID: ", temp[0].id);

            const user = await User.findOne({ _id: userId });

            if (temp[0]) {
              try {
                const updatedUsage = await Usage.findByIdAndUpdate(temp[0].id, {
                  plan: plan["name"],
                  usageLimit: plan["requestlimit"],
                  noOfFilesUploadedLimit: plan["noOfFilesUploadedLimit"],
                  payment: true,
                  paymentDate: Date.now(),
                  startDate: Date.now(),
                  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });

                if (updatedUsage) {
                  console.log("Usage plan updated:", updatedUsage);

                  /*
                                    Send Confirmation Email to Customer for buyin Plan
                                */
                  let mailOptions = {
                    from: "info@teachassistai.com",
                    to: user.email,
                    subject: "Purchased Plan Information",
                    html: `
                                        <h1>Congratulations!</h1>
                                        <h4>You have successfully purchased the ${
                                          plan["name"]
                                        } Plan</h4>
                                        <h6>You now have the following benefits</h6>
                                        ${emailBody[plan["name"]]}
                                        <p>Thank You!</p>
                                        `,
                  };
                  await sendEmail(mailOptions);
                } else {
                  console.log("Usage not found or no updates were made.");
                }
              } catch (err) {
                console.error("Error updating user plan:", err);
              }
            } else {
              let usage = await Usage.create({
                user: userId,
                plan: plan["name"],
                usageLimit: plan["requestlimit"],
                storageLimit: plan["noOfFilesUploadedLimit"],
                payment: true,
              });

              console.log("Usage Crearted: ", usage);
            }
          })
          .catch((err) => {
            console.log("Error: ", err.message);
          });
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

app.use(bodyParser.json({ limit: "30mb" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));
app.use(cookieParser());
app.use(compression());

app.use(express.static(path.join(__dirname, "public")));

const user = require("./routes/userRoute");
const post = require("./routes/postRoute");
const story = require("./routes/storyRoute");
// const order = require('./routes/orderRoute');
const payment = require("./routes/paymentRoute");
const chat = require("./routes/chatRoute");
const chatHistory = require("./routes/chatHistoryRoute");
const contact = require("./routes/contactRoute");
const sendEmail = require("./utils/sendEmail");

app.use("/api/v1", user);
app.use("/api/v1", post);
app.use("/api/v1/story", story);
// app.use('/api/v1', order);
app.use("/api/v1", payment);
app.use("/api/v1/chatbot", isAuthenticatedUser, requestLimit, chat);
app.use("/api/v1", chatHistory);
app.use("/api/v1", contact);

app.get("/updateUsage", async (req, res) => {
  let data = await Usage.find({ _id: "64fa041a77c59af3e0b4413d" });
  console.log("data: ", data);
  res.status(200).json({
    data,
  });
});

let environment = "prod";
if (environment === "dev") {
  app.get("/", (req, res) => {
    res.json({
      message: "Server is Running!",
    });
  });
} else {
  let root = path.join(__dirname, "..", "build/");
  app.use(express.static(root));
  app.use(function (req, res, next) {
    if (
      req.method === "GET" &&
      req.accepts("html") &&
      !req.is("json") &&
      !req.path.includes(".")
    ) {
      res.sendFile("index.html", { root });
    } else next();
  });
}

app.put("/updateUsage", async (req, res) => {
  let id = "64fa041a77c59af3e0b4413d";

  const updatedUsage = await Usage.findByIdAndUpdate(id, {
    plan: "Professional",
    usageLimit: null,
    payment: true,
    paymentDate: Date.now(),
  });

  res.status(200).json({
    usage: updatedUsage,
  });
});

// error middleware
// app.use(errorMiddleware);

module.exports = app;
