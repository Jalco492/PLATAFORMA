import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:5000" // Puerto donde corre tu backend Node.js
});