import axios from 'axios';

const API = axios.create({
  baseURL: 'https://cariniservice-production.up.railway.app/', 
});

export const login = async (email: string, password: string) => {
    const response = await API.post('login', { email, password });
    return response.data.data; 
  };
  
  export default API;