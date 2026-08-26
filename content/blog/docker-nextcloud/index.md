---
title: "DockerでNextCloudを動かす"
description: "DockerでNextCloudを動かしたときのログです。"
date: 2026-04-30T10:56:00.000Z
tags:
    - 自宅サーバー
    - Docker
    - Nextcloud
draft: false
---

## NextCloud

[https://nextcloud.com/](https://nextcloud.com/)

オンプレで動かせるGoogleドライブのようなものです。
Webからも、スマホからはアプリで利用でき、写真のバックアップなどもできるので、余っているパソコンがあるなら構築したい…？のかな。

よくわからんけどDockerで構築するわよ。

> [!warning]
> Dockerのインストールなどは済ませている前提です

## 環境

今回の環境です。

- Ubuntu Server 26.04
- Docker 29.4.1

ほぼ最新の環境です。

## composeの用意

```shell
mkdir nextcloud
cd nextcloud
```

そして`touch`でファイルを作成。

```shell
touch compose.yaml
```

んで内容は概ね以下の通りに。

```yaml
services:
    db:
        image: mariadb:lts
        restart: always
        command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
        volumes:
            - ./db:/var/lib/mysql
        environment:
            - MYSQL_ROOT_PASSWORD=password
            - MYSQL_PASSWORD=password
            - MYSQL_DATABASE=nextcloud
            - MYSQL_USER=nextcloud
        networks:
            - internal
    app:
        image: nextcloud:latest
        container_name: nextcloud
        restart: unless-stopped
        volumes:
            - ./nextcloud:/var/www/html
            - ./data:/var/www/html/data
        environment:
            - MYSQL_PASSWORD=password
            - MYSQL_DATABASE=nextcloud
            - MYSQL_USER=nextcloud
            - MYSQL_HOST=db
            - REDIS_HOST=redis
        networks:
            - internal
            - npm-nw
        depends_on:
            - db
    cron:
        image: nextcloud:latest
        restart: unless-stopped
        volumes:
            - ./nextcloud:/var/www/html
            - ./data:/var/www/html/data
        entrypoint: /cron.sh
        environment:
            - MYSQL_PASSWORD=password
            - MYSQL_DATABASE=nextcloud
            - MYSQL_USER=nextcloud
            - MYSQL_HOST=db
        networks:
            - internal
    redis:
        image: redis:alpine
        restart: unless-stopped
        networks:
            - internal

networks:
    internal:
    npm-nw:
        external: true
```

私の環境ではNginx Proxy Managerを経由しているので、こんな感じになります。

使っていない人はappのportsを追加してください。

## コンテナ起動

```shell
docker compose up -d
```

初回起動には少し時間がかかります。

## NPM (Nginx Proxy Manager) の設定

Nginx Proxy Manager 側で以下のように設定します。

- Domain Names: (自分のドメイン)
- Scheme: http
- Forward Hostname/IP: nextcloud
- Forward Port: 80

### SSL設定

- SSLタブで「Request a new SSL Certificate」
- Force SSL をON

## 初期セットアップ

ブラウザでドメインにアクセスするとセットアップ画面が表示されます。

### 管理者アカウント

- ユーザー名
- パスワード

### データベース設定

- Database user: nextcloud
- Database password: password
- Database name: nextcloud
- Database host: db

## 追加でやると良いこと

### cronの有効化

Nextcloudはcronを使うことでバックグラウンド処理が安定します。

管理画面 → 基本設定 → バックグラウンドジョブ を「Cron」に変更してください。

### trusted_domains の設定

config.php に以下を追加すると、アクセス制限の警告が消えます。

```php
'trusted_domains' =>
  array (
    0 => 'localhost',
    1 => 'your.domain.com',
  ),
```

### Redis キャッシュ

パフォーマンス改善のため Redis を設定しています。

config.php に以下を追加:

```php
'memcache.local' => '\\OC\\Memcache\\Redis',
'memcache.locking' => '\\OC\\Memcache\\Redis',
'redis' => [
  'host' => 'redis',
  'port' => 6379,
],
```

## まとめ

これでNextcloud環境が構築できます。

あとはアプリを入れたり、スマホから写真バックアップしたりして遊べます。
