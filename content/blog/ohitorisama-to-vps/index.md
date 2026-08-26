---
title: おひとり様サーバーをVPSに移行した
description: Misskeyのおひとり様サーバーをVPSに移行した
date: 2026-07-29
tags:
    - Misskey
    - セルフホスト
draft: false
---

## おひとり様サーバー

私も流行りに乗ってMisskeyのおひとり様サーバーを持っています。

スタックとしては

- 自宅サーバー
- Misskey(Docker Compose)
- Cloudflare Tunnel

っていう感じです。まぁ正直これで十分だったんですけどね。

## VPSへの移行

特にこれと言って理由はありません。移行したくなったので移行する感じです。

移行先のVPSはXServer VPSの4GBプランです。4vCPUと4GBメモリ150GBのSSDです。

VPSの構築が完了したらシリアルコンソールで接続してシステムのアップデート、ユーザーの作成、tailscaleの導入、Dockerの導入を行いました。

ポートはhttp/httpsのポートだけを開けています。sshはtailscaleが持っています。

## データ移行

### 自宅サーバー側

まずインスタンスを落とします。

```shell
docker compose down
```

次にデータベースだけ立てます。

```shell
docker compose up -d db
```

データベースをダンプします。ユーザー名は要確認です。

```shell
docker compose exec db pg_dump -U example-misskey-user misskey > misskey_dump.sql
```

`files`ディレクトリのパーミッションも場合によっては変えるべきです。

```shell
sudo chown -R $USER:$USER files/
```

あとはファイルを送っておきます。

```shell
rsync -avzP files misskey_dump.sql user@host:/path/to/misskey/
```

### VPS側

とりあえずデータベースを立ち上げます。

```shell
docker compose up -d db
```

すでにデータベースがある場合はdropしてcreateします。(まっさらな場合は飛ばす)

```shell
docker compose exec db psql -U example-misskey-user -d postgres -c "DROP DATABASE misskey;"
docker compose exec db psql -U example-misskey-user -d postgres -c "CREATE DATABASE misskey;"
```

あとはダンプファイルを流し込みます。

```shell
docker compose exec -T db psql -U example-misskey-user misskey < misskey_dump.sql
```

あとはfilesディレクトリのパーミッションを変えます。これをしないと画像が正常にアップロードできないかもしれない。

```shell
sudo chown -R 991:991 files/
```

あとは普通に立ち上げます。

```shell
docker compose up -d
```

## 移行してみて

特に何もないよ。移行作業自体には特に難しいところはありませんでした。

おひとり様サーバーだから許されているゆっる～い管理です。ユーザーを募集してSNSとして運用しているならもっと堅牢にすべきです。もちろん。

## おわり

以上になります。お金が無くなったら自宅サーバーに戻すよ。

それでは👋
