export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Pharmico Standalone Admin Control Center API",
    version: "1.0.0",
    description: "Enterprise Control Center for Medical E-Commerce Storefront",
  },
  servers: [{ url: "http://localhost:5001/api/v1", description: "Local Development Server" }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Admin Login with optional 2FA step",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" }, password: { type: "string" } },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/dashboard/stats": {
      get: {
        summary: "Get aggregated dashboard KPIs (Redis cached)",
        responses: { 200: { description: "Success" } },
      },
    },
    "/products": {
      get: { summary: "List products with server-side filters", responses: { 200: { description: "Success" } } },
      post: { summary: "Create product using 5-step wizard", responses: { 201: { description: "Created" } } },
    },
    "/orders": {
      get: { summary: "List orders with state machine transitions", responses: { 200: { description: "Success" } } },
    },
  },
};
