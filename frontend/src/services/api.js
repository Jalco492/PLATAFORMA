import axios from "axios";

export default axios.create({
  baseURL: "https://backend-zuib.onrender.com" // Puerto donde corre tu backend Node.js
});