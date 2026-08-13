# ランキング用Supabase設定

1. Supabaseで無料プロジェクトを作成する。
2. DashboardのSQL Editorで `schema.sql` 全体を実行する。
3. Project URLとPublishable keyを `../ranking-config.js` に設定する。

サイトへ置くのはPublishable keyだけです。Secret keyとservice_role keyは使用しません。
投票表は非公開スキーマに置き、ブラウザからは同期用とランキング取得用の関数だけを実行できます。
