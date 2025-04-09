// import { create } from "zustand";
// import { devtools, persist } from "zustand/middleware";
// import api from "../api";

// const storeApi = (set) => ({
//   status: "unauthorized", // 'authorized' | 'unauthorized' | 'pending'
//   accessToken: undefined,
//   refreshToken: undefined,
//   user: undefined,
//   loginUser: (payload) => {
//     return new Promise((resolve, reject) => {
//       api.authenticate(payload, (error, data, response) => {
//         if (error) {
//           console.error("API call failed:", error);
//           reject(error); // Đưa lỗi vào reject của Promise
//         } else {
//           console.log("API call succeeded, data:", data);
//           set({
//             status: "authorized",
//             accessToken: data.access_token,
//             refreshToken: data.refresh_token,
//             user: {
//               id: data.user_id,
//               role: data.role,
//             },
//           });
//           resolve(data); // Trả về dữ liệu thành công qua resolve của Promise
//         }
//       });
//     });
//   },
//   logoutUser: () => {
//     set({
//       status: "unauthorized",
//       accessToken: undefined,
//       refreshToken: undefined,
//       user: undefined,
//     });
//   },
//   registerUser: async (payload) => {
//     await api.register(payload);
//   },
// });

// export const useAuthStore = create()(
//   devtools(persist(storeApi, { name: "auth-storage" }))
// );