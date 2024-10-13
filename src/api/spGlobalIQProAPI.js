import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://some-domain.com/api/',
});