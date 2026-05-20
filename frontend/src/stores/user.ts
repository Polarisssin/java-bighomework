import { defineStore } from "pinia";
import { ref } from "vue";
import request from "@/utils/request";
import router from "@/router";

export interface MenuItem {
  id: number;
  title: string;
  icon: string;
  path?: string;
  parentId?: number;
  menusIndex?: string;
}

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("token") || "");
  const user = ref<Record<string, unknown> | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const menus = ref<MenuItem[]>(
    JSON.parse(localStorage.getItem("menus") || "[]")
  );

  async function login(username: string, password: string) {
    const data = await request.post("/auth/login", { username, password });
    token.value = data.token;
    user.value = data.user;
    menus.value = data.menus;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("menus", JSON.stringify(data.menus));
    await router.push("/");
    return data as { token: string; user: Record<string, unknown>; menus: MenuItem[] };
  }

  function logout() {
    token.value = "";
    user.value = null;
    menus.value = [];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("menus");
  }

  const isAdmin = () => (user.value as { roleId?: number })?.roleId === 1;

  return { token, user, menus, login, logout, isAdmin };
});
