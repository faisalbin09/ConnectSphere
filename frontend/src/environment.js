const server =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_SERVER_URL
    : "http://localhost:8000";

export default server;
