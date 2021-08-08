"use strict";

const {
  AuthorizeSecurityGroupIngressCommand,
  DescribeSecurityGroupRulesCommand,
  EC2Client,
  RevokeSecurityGroupIngressCommand,
} = require("@aws-sdk/client-ec2");
const ec2client = new EC2Client({ region: "ap-northeast-1" });
const { getMatch } = require("ip-matching");

exports.parse_ip = (str) => {
  let result = {};
  // kind
  if (str.match(/^[\d\.\/]+$/)) {
    result.kind = "ipv4";
  } else if (str.match(/^[a-f\d:\/]+$/)) {
    result.kind = "ipv6";
  } else {
    throw new Error("can not detect ip type");
  }
  // network_prefix
  {
    const match = str.match(/\/\d+$/);
    if (match) {
      result.network_prefix = match[0];
    } else if (result.kind === "ipv4") {
      result.network_prefix = "/32";
    } else if (result.kind === "ipv6") {
      result.network_prefix = "/128";
    } else {
      throw new Error(`invalid ip format`);
    }
  }
  // network_address
  {
    let address = str.replace(/\/\d+$/, "");
    address += result.network_prefix;
    try {
      result.network_address = getMatch(address).toString();
    } catch (e) {
      throw new Error(`getMatch error: ${str}`);
    }
  }
  return result;
};
exports.describe_rule = async (sgid) => {
  let result = [];
  let next_token;
  while (true) {
    let params = {
      MaxResults: 100,
      Filters: [
        {
          Name: "group-id",
          Values: [sgid],
        },
      ],
      NextToken: next_token,
    };
    const command = new DescribeSecurityGroupRulesCommand(params);
    const response = await ec2client.send(command);
    for (const s of response.SecurityGroupRules) {
      if (s.IsEgress) {
        continue;
      }
      if (!s.CidrIpv4 && !s.CidrIpv6) {
        continue;
      }
      result.push(s);
    }
    if (!response.NextToken) {
      break;
    }
    next_token = response.NextToken;
  }
  return result;
};
exports.authorize = async (sgid, ip_input, description) => {
  const ip = exports.parse_ip(ip_input);
  let params = {
    GroupId: sgid,
    IpPermissions: [
      {
        FromPort: -1,
        ToPort: -1,
        IpProtocol: "-1",
      },
    ],
  };
  if (ip.kind === "ipv6") {
    params.IpPermissions[0].Ipv6Ranges = [
      {
        CidrIpv6: ip.network_address,
        Description: description,
      },
    ];
  } else if (ip.kind === "ipv4") {
    params.IpPermissions[0].IpRanges = [
      {
        CidrIp: ip.network_address,
        Description: description,
      },
    ];
  } else {
    throw new Error(`invalid ip type`);
  }
  const command = new AuthorizeSecurityGroupIngressCommand(params);
  const response = await ec2client.send(command);
  return response;
};
exports.revoke = async (sgid, options) => {
  let ruleid;
  if (options.ip) {
    const ip = exports.parse_ip(options.ip);
    const rules = await exports.describe_rule(sgid);
    for (const r of rules) {
      if (
        r.CidrIpv4 === ip.network_address ||
        r.CidrIpv6 === ip.network_address
      ) {
        ruleid = r.SecurityGroupRuleId;
        break;
      }
    }
  } else if (options.id) {
    ruleid = options.id;
  } else {
    throw new Error("invalid options");
  }
  const params = {
    GroupId: sgid,
    SecurityGroupRuleIds: [ruleid],
  };
  const command = new RevokeSecurityGroupIngressCommand(params);
  const response = await ec2client.send(command);
  return response;
};
