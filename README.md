# セキュリティグループ管理スクリプト

## これは何？

App runnerで動かす想定のセキュリティグループ管理Web UI
Google認証を使用

## 設定

* apache2.conf: Require claimで制限する部分
* auth_openidc.conf: OIDC設定
* Dockerfile: 変更するセキュリティグループのID
