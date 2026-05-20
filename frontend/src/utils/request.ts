import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import router from "@/router";

const request = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE ||
    (import.meta.env.DEV
      ? "/api"
      : "https://health-app-env-3g73ck72bcb11c66-1401396930.ap-shanghai.app.tcloudbase.com/elder-care/api"),
  timeout: 20000,
});

request.interceptors.request.use((config) => {
  const store = useUserStore();
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body.code !== 200) {
      ElMessage.error(body.message || "请求失败");
      return Promise.reject(body);
    }
    return body.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      useUserStore().logout();
      router.push("/login");
    }
    ElMessage.error(err.response?.data?.message || err.message || "网络错误");
    return Promise.reject(err);
  }
);

export default request;
