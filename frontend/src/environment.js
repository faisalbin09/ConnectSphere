let server;

if (import.meta.env.PROD) {
  server = import.meta.env.VITE_SERVER_URL;
} else {
  server = "http://localhost:8000";
}

export default server;
