// import axios from 'axios';
// const axiosInstance = axios.create({
//   baseURL: "https://hanaxuan-backend.hf.space/api/",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// axiosInstance.interceptors.request.use((config) => {
//     const token = localStorage.getItem('access_token');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             try {
//                 const refreshToken = localStorage.getItem('refresh_token');
//                 const { data } = await axios.post('/auth/refresh/', { refresh: refreshToken });

//                 localStorage.setItem('access_token', data.access);
//                 axiosInstance.defaults.headers.Authorization = `Bearer ${data.access}`;

//                 return axiosInstance(originalRequest); 
//             } catch (refreshError) {
//                 console.error('Refresh token error:', refreshError);
//                 localStorage.clear();
//                 window.location.href = '/'; 
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosInstance;
