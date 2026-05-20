import { ElMessageBox } from "element-plus";

/** 危险操作二次确认 */
export async function confirmDanger(message: string, title = "请确认") {
  await ElMessageBox.confirm(message, title, {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  });
}
