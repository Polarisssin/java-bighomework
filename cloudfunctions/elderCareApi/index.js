"use strict";

const mysqlHandler = require("./handler");
const db = require("./db");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonReplacer(_key, value) {
  if (typeof value === "bigint") return Number(value);
  return value;
}

function json(statusCode, body) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body, jsonReplacer),
  };
}

function ok(data) {
  return json(200, { code: 200, message: "success", data });
}

function fail(statusCode, message) {
  return json(statusCode, { code: statusCode, message, data: null });
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body);
  } catch {
    return {};
  }
}

function normalizePath(event) {
  let p = event.path || event.requestContext?.http?.path || "/";
  p = p.replace(/^\/elder-care/, "") || "/";
  return p.split("?")[0];
}

exports.main = async (event) => {
  const method = (event.httpMethod || event.requestContext?.http?.method || "GET").toUpperCase();
  if (method === "OPTIONS") {
    return { isBase64Encoded: false, statusCode: 204, headers: { ...CORS }, body: "" };
  }

  const path = normalizePath(event);
  const body = parseBody(event);
  const qs = event.queryStringParameters || {};

  try {
    await db.ping();
    const data = await mysqlHandler.handle(method, path, body, qs, event);
    return ok(data);
  } catch (e) {
    if (e.status) return fail(e.status, e.message);
    if (
      e.code === "ECONNREFUSED" ||
      e.code === "ER_ACCESS_DENIED_ERROR" ||
      e.code === "ENOTFOUND" ||
      e.code === "ETIMEDOUT" ||
      e.code === "PROTOCOL_CONNECTION_LOST"
    ) {
      const hint =
        e.code === "ER_ACCESS_DENIED_ERROR"
          ? "用户名或密码错误，请在控制台「数据库→MySQL→账号管理」重置 root 密码，与 DB_PASSWORD 保持一致"
          : "请确认云函数已开启 VPC，且 DB_HOST 为控制台 MySQL 内网地址";
      return fail(503, `数据库连接失败(${e.code}): ${hint}`);
    }
    if (e.code === "ER_WRONG_VALUE" || e.code === "ER_TRUNCATED_WRONG_VALUE" || /incorrect date/i.test(String(e.message))) {
      console.error(e);
      return fail(500, "日期数据异常，请联系管理员检查外出/护理记录中的日期字段");
    }
    console.error(e);
    return fail(500, e.message || "服务器错误");
  }
};
