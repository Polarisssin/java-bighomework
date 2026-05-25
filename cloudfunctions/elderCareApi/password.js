"use strict";

const bcrypt = require("bcryptjs");

const MIN_LEN = 4;
const MAX_LEN = 100;
const BCRYPT_ROUNDS = 10;

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

function validateRawPassword(password) {
  const pwd = password == null ? "" : String(password);
  if (!pwd) return "密码不能为空";
  if (pwd.length < MIN_LEN) return "密码至少4位";
  if (pwd.length > MAX_LEN) return "密码长度不能超过100位";
  return null;
}

function validateLoginBody(body) {
  const username = body?.username == null ? "" : String(body.username).trim();
  if (!username) return "请输入账号";
  if (username.length > 20) return "账号长度不能超过20位";
  const pwdErr = validateRawPassword(body?.password);
  if (pwdErr) return pwdErr;
  return null;
}

function hashPassword(rawPassword) {
  const err = validateRawPassword(rawPassword);
  if (err) throw { status: 400, message: err };
  return bcrypt.hashSync(String(rawPassword), BCRYPT_ROUNDS);
}

/**
 * @returns {{ ok: boolean, upgradeHash?: string }}
 */
function verifyPassword(storedPassword, rawPassword) {
  const stored = storedPassword == null ? "" : String(storedPassword);
  const raw = rawPassword == null ? "" : String(rawPassword);
  if (!stored || !raw) return { ok: false };
  if (isBcryptHash(stored)) {
    return { ok: bcrypt.compareSync(raw, stored) };
  }
  if (stored === raw) {
    return { ok: true, upgradeHash: hashPassword(raw) };
  }
  return { ok: false };
}

module.exports = {
  isBcryptHash,
  validateRawPassword,
  validateLoginBody,
  hashPassword,
  verifyPassword,
};
