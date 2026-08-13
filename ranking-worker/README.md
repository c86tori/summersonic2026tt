# SUMMER SONIC 2026 ranking API

Cloudflare Worker と D1 を使い、端末内の出演者選択を匿名集計します。

## API

- `POST /api/sync`：1台の端末の最新選択状態へ置き換える
- `GET /api/ranking`：ポイント順の集計を取得する
- `GET /api/health`：接続確認

点数は内部では誤差の出ない整数（通常10、ゴールド11、レインボー12）で保存し、表示時に10で割ります。
