import type { NextApiRequest, NextApiResponse } from "next";

import { getSubsciption, getUserInfo } from "./_common";

import Cors from "cors";

const cors = Cors({
  methods: ["POST"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Run the middleware
    await runMiddleware(req, res, cors);

    if (req.method !== "POST") {
      throw new Error("Invalid request method");
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, error: "Authorization header is required" });
    }

    const userInfo = await getUserInfo(authHeader);

    const subscription = await getSubsciption(userInfo.email);

    // This is for subscription
    // if (subscription.status !== "active") {
    //   throw new Error(`Subscription is not active`)
    // }

    // This is for one-time payment
    if (subscription.status !== "succeeded") {
      throw new Error(`Subscription is not active`);
    }

    return res.status(200).json({ success: true, code: "147" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(401).json({ success: false, error: errorMessage });
  }
}
