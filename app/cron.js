#!/usr/bin/env node
"use strict";

const dayjs = require("dayjs");
const sg = require("./sg.js");
const TARGET_SG = process.env.TARGET_SG;

(async () => {
  console.log(`start ${process.argv[1]}`);
  const rules = await sg.describe_rule(TARGET_SG);
  for (const r of rules) {
    const day = r.Description.split(" ")[0];
    const expire_day = dayjs(day).add(30, "day");
    if (!expire_day.isValid()) {
      console.log(`skip: ${r.Description}`);
      continue;
    }
    console.log(`check: ${r.Description}`);
    if (expire_day.unix() < dayjs().unix()) {
      sg.revoke(TARGET_SG, { id: r.SecurityGroupRuleId });
    }
  }
})().catch((e) => {
  console.log(e);
  process.exit(1);
});
