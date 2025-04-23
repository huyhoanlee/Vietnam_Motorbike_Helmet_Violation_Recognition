
const ENV = {
  development: {
    BASE_URL: "http://localhost:3000",
    API_URL: "http://58.8.184.170:54688/api/", // local testing
  },
  production: {
    BASE_URL: "https://yourfrontend.com",
    API_URL: "https://hanaxuan-backend.hf.space", // server
  },
};

// Detect environment
const NODE_ENV = import.meta.env.MODE || "development";

export default ENV[NODE_ENV as "development" | "production"];
