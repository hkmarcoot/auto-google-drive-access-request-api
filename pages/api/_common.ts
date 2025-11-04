import { OAuth2Client } from "google-auth-library";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// Verify the Google JWT and get the user's info
export const getUserInfo = async (authHeader: string) => {
  const [type, accessToken] = authHeader.split(" ");

  if (type !== "Bearer" || !accessToken) {
    throw new Error("Invalid or no access token");
  }

  const client = new OAuth2Client();
  client.setCredentials({
    access_token: accessToken,
  });

  const userInfoRes = await client.request<{
    id: string;
    email: string;
    name: string;
  }>({
    url: "https://www.googleapis.com/oauth2/v1/userinfo",
  });

  return userInfoRes.data;
};

export const getSubsciption = async (email: string) => {
  const customerResp = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customerResp.data.length === 0) {
    throw new Error(`No customer data found for ${email}`);
  }

  const [customer] = customerResp.data;

  // console.log("customer", customer)

  // This is for subscription
  // const subscriptionResp = await stripe.subscriptions.list({
  //   customer: customer.id
  // })

  // if (subscriptionResp.data.length === 0) {
  //   throw new Error(`No subscription found for customer id ${customer.id}`)
  // }

  // return subscriptionResp.data[0]

  // This is for one-time payment
  // Get all payment intents (one-time payments) for this customer
  const paymentIntentsResp = await stripe.paymentIntents.list({
    customer: customer.id,
    limit: 1,
    // status: 'succeeded' // Only look for successful payments
  });

  if (paymentIntentsResp.data.length === 0) {
    throw new Error(
      `No successful payments found for customer id ${customer.id}`
    );
  }

  if (paymentIntentsResp.data[0].status !== "succeeded") {
    throw new Error(
      `No successful payments found for customer id ${customer.id}`
    );
  }

  // Return the most recent successful payment
  return paymentIntentsResp.data[0];
};
