---
title: "DockerでJellyfinを構築"
description: "DockerでJellyfinを構築する方法"
date: 2026-05-09T07:30:00.000Z
tags:
    - 自宅サーバー
    - Docker
    - Jellyfin
draft: false
---

## Jellyfin

[https://jellyfin.org/](https://jellyfin.org/)

自分の持っているメディア(テレビ番組、映画、音楽等)を管理、ストリーミングが可能です。\
すっごいわかりやすく言うと、**自分専用のストリーミングサービスを建てれる**感じです。

> [!warning] 著作権について\
> 著作権によって保護されているコンテンツを誰でも見れる状態にすると普通に法に引っかかるので\
> 外から見れるようにする際は細心の注意を払ってくださいね。

## Dockerで構築しよう

今回はこれをDockerで構築してみようっていう記事。私の家でもDockerで動いています。

Dockerのインストールなどはすでに済んでいる前提で話を進めていきます。

## ディレクトリの作成

```shell
mkdir jellyfin
cd jellyfin
```

Jellyfin用のディレクトリを作成します。

## `compose.yml`の作成

`compose.yml`を作成します。内容は以下を参考にして下さい。

```yaml
services:
    jellyfin:
        image: jellyfin/jellyfin:latest
        container_name: jellyfin
        volumes:
            - ./config:/config
            - ./cache:/cache
            - ./media:/media
        restart: unless-stopped
        environment:
            - TZ=Asia/Tokyo
        ports:
            - "8096:8096"
```

## ディレクトリの作成

cache, config, mediaディレクトリを作成します。

```shell
mkdir -p cache config media
```

これをしないと起動時にコケます。(1敗済)

## 起動

いよいよ起動です。

```shell
docker compose up -d
```

起動したら`http://localhost:8096`にアクセスします。

アクセスするとこんな画面です。

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-54-47-967Z-64rog-image.png)

## ウィザードに沿って設定をする

### サーバー名と言語

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-55-30-205Z-hcdd0-image.png)

### 管理者ユーザー

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-56-00-738Z-g8n5y-image.png)

### メディアライブラリ(スキップ)

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-56-28-029Z-vo84q-image.png)

ここでは飛ばします。

### メタデータ言語

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-57-05-895Z-6tbgc-image.png)

### リモートアクセスの設定

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-57-28-504Z-0rcht-image.png)

### 設定完了

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-57-50-084Z-d3jxk-image.png)

### ログイン

先ほど作成したアカウントでログインします。

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T22-58-32-873Z-rdz3e-image.png)

ログインするとメイン画面が出てきます。

## メディアの追加

とりあえず手持ちのメディアを移します。先ほど作成したmediaディレクトリの中に。

media内にメディアの種類でディレクトリを作るといい感じに管理できます。(例:anime,movie,music)

今回はスローループを置きました。

続いてJellyfin側でメディアライブラリの設定です。

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T23-02-11-847Z-j1qbt-image.png)

メイン画面にある「今すぐ作成しますか？」をクリック。

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T23-02-51-102Z-rmv5m-image.png)

メディアライブラリーを作成 をクリック

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T23-03-34-872Z-qzqxb-image.png)

赤枠で囲ったところだけとりあえず設定します。設定したらOKをクリック。

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T23-04-39-471Z-36ok4-image.png)

終わったらトップに戻ります。(赤枠部分をクリック)

![](../../assets/images/blog/build-docker-jellyfin/2026-05-08T23-05-19-946Z-hsl8t-image.png)

さっき追加したメディアが表示されていればOK！

## 以上!

以上になります。今回はここまで。
