
const ENV = {
  development: {
    BASE_URL: "http://localhost:3000",
    API_URL: "https://hanaxuan-backend.hf.space/api/", // local testing
  },
  production: {
    BASE_URL: "https://yourfrontend.com",
    API_URL: "https://hanaxuan-backend.hf.space/api/", // server
  },
};

// Detect environment
const NODE_ENV = import.meta.env.MODE || "development";

export default ENV[NODE_ENV as "development" | "production"];
