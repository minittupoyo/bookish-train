---
title: ブログにListenBrainzの再生履歴を表示した
description: ListenBrainzを使って、ブログに最近聴いた曲とNow Playingを表示してみた。
date: 2026-08-29
tags:
    - Astro
    - ListenBrainz
    - Cloudflare
    - AI
draft: false
---

ブログに音楽の再生履歴を表示したい。

ということで、ListenBrainzの再生履歴をブログのトップページに表示するようにした。

ついでに現在再生している曲、いわゆるNow Playingも表示する。

なお、今回の実装はほぼChatGPTにやってもらった。

GitHubをChatGPTに接続して、リポジトリを読ませて、そのまま実装・修正までしてもらっている。

私は横から「ジャケットも欲しい」「なうぷれも欲しい」「なんかジャケット出ない」と言っていただけです。便利な時代ですね。

## ListenBrainzから履歴を取る

ListenBrainzにはユーザーの再生履歴を取得するAPIがある。

```text
GET /1/user/{username}/listens
```

ここから最近聴いた曲を取得して、Astroのコンポーネントから表示する。

このブログ自体はAstroで作ってCloudflare Workersに置いているけれど、再生履歴まで静的に生成してしまうと、ブログをビルドした時点の履歴で止まってしまう。

それではあまり意味がないので、再生履歴はブラウザから取得することにした。

これだけなら割と簡単だった。

## ジャケットも欲しい

曲名とアーティストだけでもいいけれど、せっかくならジャケットも表示したい。

ListenBrainzの再生履歴には、MusicBrainzとの紐付けができている曲なら`mbid_mapping`が含まれている。

そこにはCover Art Archiveで使えるIDも入っているので、それを使ってジャケットを取得するようにした。

これも無事表示された。

よし。

## Now Playingも欲しい

ここまで来たら、今聴いている曲も表示したくなった。

ListenBrainzにはちゃんとそのためのAPIもある。

```text
GET /1/user/{username}/playing-now
```

これを一定間隔で取得すればNow Playingが作れる。

ということでChatGPTに「なうぷれの実装もして」と投げた。

できた。

曲名も出る。アーティストも出る。アルバム名も出る。

ただし、ジャケットが出ない。

なんで。

## 再生が終わるとジャケットが出る

妙だったのが、Now Playingではジャケットがプレースホルダーになっているのに、曲が終わって再生履歴へ移動するとちゃんとジャケットが表示されることだった。

同じ曲なのに。

実際の`playing-now`のレスポンスを見てみることにした。

ちょうどYOASOBIの「たぶん」を再生していた時のレスポンスがこれ。

```json
{
  "playing_now": true,
  "track_metadata": {
    "additional_info": {
      "duration_ms": 257000,
      "recording_msid": "0a035a06-5f9e-41c7-b80e-0e01f99a316d",
      "submission_client": "Morphe"
    },
    "artist_name": "YOASOBI",
    "release_name": "THE BOOK",
    "track_name": "たぶん"
  }
}
```

`mbid_mapping`がない。

`release_mbid`も`release_group_mbid`もない。

あるのは`recording_msid`だけ。

どうやら再生中のデータは、まだListenBrainz側でMusicBrainzとのマッピングが済んでいないらしい。

再生が終わって正式に履歴へ入ったあとならマッピング情報が付く。

だから、

```text
再生中
↓
MusicBrainzのIDがない
↓
ジャケットを取得できない

再生終了
↓
マッピングされる
↓
ジャケットを取得できる
```

となっていた。

なるほどね。

## Workerを挟む

じゃあ、曲名・アーティスト名・アルバム名からMusicBrainzの情報を検索すればいい。

ListenBrainzにはそのためのmetadata lookup APIがある。

ただし認証が必要。

ListenBrainzのUser TokenをブラウザのJavaScriptに書くわけにはいかないので、Cloudflare Workerを間に挟むことにした。

```text
ブラウザ
   ↓
Cloudflare Worker
   ↓
ListenBrainz metadata lookup
   ↓
release MBID
   ↓
Cover Art Archive
   ↓
ジャケット
```

トークンはCloudflare WorkersのSecretに入れておく。

```bash
bunx wrangler secret put LISTENBRAINZ_TOKEN
```

このブログはもともとCloudflare WorkersのStatic Assetsで配信していたので、通常のページはそのまま静的配信して、`/api/listenbrainz/*`だけWorkerで処理する形になった。

AstroをSSR化する必要もなかったので、思っていたより綺麗に収まった。

この辺もChatGPTに実装してもらった。

## CIが赤くなる

実装してもらったらGitHub Actionsが赤くなった。

あっ。

ログを見ると、

```text
Cannot find name 'Fetcher'.
```

Cloudflare Workers側で使っていた`Fetcher`型をAstroの型チェックが認識できていなかった。

ChatGPTに「赤くなった」とだけ伝えたら、自分でGitHub Actionsのログを読みに行って原因を見つけ、そのまま修正していた。

最終的にはCloudflare専用の型定義を依存関係に追加するのではなく、必要な`fetch()`だけを持つローカル型に変更。

CIも通った。

GitHubを直接触らせられると、こういう「実装→CI落ちる→ログ読む→直す」まで会話だけで回るのはなかなか面白い。

## APIを叩きまくるのも嫌

Now Playingなので、ある程度リアルタイムに更新したい。

最初は30秒間隔でListenBrainzを確認する実装だった。

別にこれでも困らないけれど、もう少しリアルタイムにしたい。

一方で、5秒とか10秒ごとに閲覧者全員がListenBrainzを直接叩くのも嫌だ。

そこで、最終的には15秒間隔で確認しつつ、Cloudflare Worker側で短時間キャッシュすることにした。

Now Playingのキャッシュは10秒程度。

```text
閲覧者A ─┐
閲覧者B ─┼→ Cloudflare Worker → ListenBrainz
閲覧者C ─┘
              ↑
            Cache
```

これなら閲覧者が増えても、その人数分ListenBrainzへリクエストが飛ぶわけではない。

更新間隔は30秒から15秒へ短くなったのに、ListenBrainz側への負荷はむしろ抑えられる。

いい感じ。

## 見てないなら止める

さらに、ブログのタブがバックグラウンドにある間はポーリング自体を止めるようにした。

見ていないNow Playingを15秒ごとに更新しても仕方がない。

ただしブログのタブへ戻った時は、その瞬間に一度取得する。

なので、

```text
ブログを見ている
↓
15秒間隔

別タブへ移動
↓
停止

ブログへ戻る
↓
即更新
↓
15秒間隔へ
```

という動作になっている。

同じ曲が再生され続けている場合はDOMも作り直さない。

ジャケットについても、一度取得したものはブラウザ側とWorker側でキャッシュする。

ジャケットなんて15秒で変わるものではないので、こっちはかなり長めにキャッシュしている。

## 再生履歴は毎回取らない

最近聴いた曲については、Now Playingほど頻繁に更新する必要はない。

ページを開いた時に取得して、その後はNow Playingの曲が変わった時や再生が終了した時だけ更新するようにした。

これで再生履歴まで15秒ごとに取りに行く必要がなくなる。

リアルタイム性を保ちつつ、無駄な通信はなるべく減らす。

最終的には結構いいバランスになったと思う。

## ChatGPTにGitHubを触らせるの、結構便利

今回個人的に面白かったのはListenBrainzそのものより、ChatGPTにGitHubを接続して実装させたことかもしれない。

基本的に私は、

「ListenBrainzの履歴を表示したい」

「ジャケットも取得して」

「なうぷれも実装して」

「ジャケット出ない」

「赤くなった」

「負荷下げて」

くらいしか言っていない。

ChatGPTがリポジトリを読んで既存の構成を確認し、コードを書いてコミットする。

問題が起きたら実際のレスポンスやCIログを確認して、また修正する。

以前このブログで、コーディングエージェントについて「なんとなくプロンプトを渡して、なんとなく作ってもらっている」と書いた。

今回も大体そんな感じなのだけれど、GitHubやCIまで直接触れるようになると「なんとなく作ってもらう」で出来る範囲がだいぶ広くなった気がする。

もちろん、出てきた実装が正しいか判断するための知識は人間側にも必要だと思う。

今回だって、最初のNow Playingでジャケットが出ないことに気付かなければ、そのまま完成扱いにしていたかもしれない。

AIに全部任せれば何も考えなくていい、という話ではない。

でも、

**やりたいことを伝える → 実装される → 動かす → 変なところを見つける → 直してもらう**

という作り方は、私みたいな雑な人間には結構合っている。

## おわり

最初は再生履歴を数件表示するだけのつもりだった。

気付いたら、

- Now Playing
- アルバムアート
- Cloudflare Worker
- Secret
- キャッシュ
- Page Visibility API
- CI

まで生えていた。

どうしてこうなった。

まあでも、ブログを開くと自分が今聴いている曲が表示されるのはちょっと楽しい。

実用性があるかと言われると知らない。

こういうのはロマンです。

それでは👋
