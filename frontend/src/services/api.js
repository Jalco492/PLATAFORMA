import axios from 'axios';

export default axios.create({
 baseURL: 'http://192.168.3.154:5000'     // ✅ Localhost
});