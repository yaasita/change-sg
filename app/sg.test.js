"use strict";

const sg = require("./sg.js");
const dayjs = require("dayjs");

const TARGET_SG = process.env.TARGET_SG;
const TARGET_SG_RULE = process.env.TARGET_SG_RULE;

test("addSG", async () => {
  for (let i = 1; i <= 5; i++) {
    const ip = `${i}.1.1.1/24`;
    const description =
      dayjs()
        .subtract(i * 10, "day")
        .format() + ` jest`;
    await sg.authorize(TARGET_SG, ip, description);
  }
});

test("authorize", async () => {
  const result_ipv4 = await sg.authorize(TARGET_SG, "1.2.3.4/24", "test1");
  const result_ipv6 = await sg.authorize(
    TARGET_SG,
    "fe80::5055:ff:fe3e:977/64",
    "test2"
  );
  //console.log(result_ipv4);
  //console.log(result_ipv6);
});

test("describe_rule", async () => {
  const result = await sg.describe_rule(TARGET_SG);
  console.log(result);
  expect(Array.isArray(result)).toBeTruthy();
});

test("parse_ip", () => {
  expect(() => {
    sg.parse_ip("1.1.1.1.");
  }).toThrow(/getMatch error/);
  expect(() => {
    sg.parse_ip("1.1.1.1//hoge");
  }).toThrow(/can not detect ip type/);
  expect(() => {
    sg.parse_ip("fe80::5054:ff:fe3e:");
  }).toThrow(/getMatch error/);
  expect(sg.parse_ip("1.1.1.1")).toEqual({
    kind: "ipv4",
    network_address: "1.1.1.1/32",
    network_prefix: "/32",
  });
  expect(sg.parse_ip("1.1.1.1/24")).toEqual({
    kind: "ipv4",
    network_address: "1.1.1.0/24",
    network_prefix: "/24",
  });
  expect(sg.parse_ip("fe80::5054:ff:fe3e:977/64")).toEqual({
    kind: "ipv6",
    network_address: "fe80::/64",
    network_prefix: "/64",
  });
});

test("revoke_ip", async () => {
  const result_ipv4 = await sg.revoke(TARGET_SG, { ip: "192.168.0.2" });
  //const result_ipv6 = await sg.revoke(TARGET_SG, "fe80::5055:ff:fe3e:977/64");
  //console.log(result_ipv4);
  //console.log(result_ipv6);
});
test("revoke_id", async () => {
  const result = await sg.revoke(TARGET_SG, {
    id: TARGET_SG_RULE,
  });
  console.log(result);
});
test("revoke_abort", async () => {
  expect.assertions(1);
  try {
    await sg.revoke(TARGET_SG, {});
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
  }
});
