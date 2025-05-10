
const ENV = {
  development: {
    BASE_URL: "http://localhost:3000",
    API_URL: "http://171.226.158.102:27406/api/", // local testing
  },
  production: {
    BASE_URL: "https://yourfrontend.com",
    API_URL: "http://171.226.158.102:27406/api/", // server
  },
};

// Detect environment
const NODE_ENV = import.meta.env.MODE || "development";

export default ENV[NODE_ENV as "development" | "production"];
