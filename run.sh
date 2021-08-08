#!/bin/bash
set -euxo pipefail

cron -f &
CRON_PID=$!

/usr/sbin/apache2 -DFOREGROUND &
APACHE_PID=$!

cd /app
env | perl -ple 's/^/export /' > env.sh
node index.js &
NODE_PID=$!

while :;do
    kill -0 $APACHE_PID
    kill -0 $NODE_PID
    kill -0 $CRON_PID
    sleep 5m
done
