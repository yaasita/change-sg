"use strict";
const express = require("express");
const app = express();
const sg = require("./sg.js");
const dayjs = require("dayjs");

const TARGET_SG = process.env.TARGET_SG;

app.set("trust proxy", 2);
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`client ip: ${req.ip}`);
  const email = req.headers["oidc_claim_email"] ?? "";
  req.user = email.split("@")[0];
  console.log(`user: ${req.user}`);
  if (!req.user) {
    res.status(400).send("ユーザー情報を取得できません");
    return;
  }
  next();
});

app.get("/", async (req, res) => {
  try {
    await addSG(req.ip, req.user);
  } catch (e) {
    console.log(e);
    res.status(400).send(`IPアドレスの追加に失敗しました: ${req.ip}`);
    return;
  }
  res.render("index", { ip: req.ip, user: req.user });
});
app.post("/", async (req, res) => {
  const ip = req.body.ipaddress;
  console.log(`add ip address: ${ip}`);
  try {
    await addSG(ip, req.user);
  } catch (e) {
    console.log(e);
    res.status(400).send(`IPアドレスの追加に失敗しました: ${ip}`);
    return;
  }
  res.send(`追加しました: ${ip} (${req.user})`);
});
app.listen(3000, "0.0.0.0", () => {
  console.log("start server!");
});

async function addSG(ip, user) {
  const description = dayjs().format() + ` ${user}`;
  try {
    await sg.revoke(TARGET_SG, { ip: ip });
  } catch (e) {
    console.log(`revoke fail ${ip}`);
  }
  await sg.authorize(TARGET_SG, ip, description);
}
