import type { NextApiRequest, NextApiResponse } from "next";

// Use the workspace package reference instead of relative path
// @pharmacy-admin/admin-api resolves via npm workspaces
const getApp = async () => {
  // Dynamic import to avoid bundling issues at build time
  const mod = await import("@pharmacy-admin/admin-api");
  return mod.default;
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const app = await getApp();
  return app(req, res);
}
