ARGENTS.md — milady-rugpull-simulator

A Deterministic Announcement-Driven Trading Simulator (Base Mini App)

1. プロジェクト概要（改・確定）

milady-rugpull-simulator は、
連続して流れる 「アナウンス（情報）」 を解釈し、
HODL（ホードル）するか、TAKE PROFIT（利確）するか を選ぶ
疑似トレード型・決定論シミュレーターである。

二択クイズではない

正解は「行動」ではなく 「降りるタイミング」

間違えると チャートが即ゼロ（RUGGED）

利確すれば 次のトークンへ進行

各トークンは 独立した新ゲーム

2. コアコンセプト（1行）

情報を信じすぎた者から死ぬ。
利確した者だけが次のトークンへ進める。

3. 基本ゲームループ
トークン開始
  ↓
アナウンスが順次流れる
  ↓
各アナウンスごとに行動選択
  - HODL
  - SELL
  ↓
結果反映（チャート変動 or ゼロ）
  ↓
利確 → 次トークンへ
RUGGED → ゲームオーバー

4. UI構成（添付画像準拠）
上部：アナウンスバー

時系列で流れるテキスト

信頼度・成功率・難易度は表示されない

トーンのみで判断させる
（安心感／誘惑／曖昧さ）

中央：チャート

ロング方向のみ

HODL 成功 → 上昇

HODL 失敗 → 即ゼロ

TAKE PROFIT → 上昇を確定して遷移

下部：アクション

HODL

TAKE PROFIT（利確）

5. アナウンス仕様（非表示・重要）
アナウンスタイプ（プレイヤー非表示）
type	意味
SAFE	HODLしても問題ない（微伸び・確定）
BAIT	HODLすると即死
HIGH_RISK_REWARD	成功率30％・成功時爆伸び
MIDDLE_RISK_REWARD	成功率50％・成功時伸び
LOW_RISK_REWARD	成功率20％・成功時少伸び

※ プレイヤーには type / 成功率は一切表示されない
※ SAFE 以外は すべて死亡リスクを含む

6. 行動と結果の対応
HODL（ホードル）
アナウンス	結果
SAFE	チャート微伸び（確定）
LOW_RISK_REWARD	成功時：少伸び / 失敗：RUGGED
MIDDLE_RISK_REWARD	成功時：伸び / 失敗：RUGGED
HIGH_RISK_REWARD	成功時：爆伸び / 失敗：RUGGED
BAIT	即 RUGGED（ゼロ）
TAKE PROFIT（利確）
アナウンス	結果
SAFE	小さく利確 → 次トークン
LOW / MIDDLE / HIGH_RISK_REWARD	機会損失だが生存 → 次トークン
BAIT	正解（回避） → 次トークン
7. トークン進行設計

1トークン = 1ゲーム

トークンが進むたびに：

アナウンスが巧妙化

SAFE が減少

RISK_REWARD 系が増加

難易度は トークン単位でリセット

8. 難易度曲線（アナウンス分布）
フェーズ	SAFE	BAIT	LOW	MIDDLE	HIGH
Token 1	多	無	少　少　無
Token 2	多	無	少	少　無
Token 3	多	少	中	少	少
Token 4+	多	少	中	中	少

→ 進むほど「夢が見えるが死にやすい」

9. データ構造例（data/announcements.json）
{
  "id": "liquidity_unlock_soon",
  "text": "大口の流動性がまもなく解放されるとの噂が出ている。",
  "type": "HIGH_RISK_REWARD"
}


※ 成功率・倍率は type とトークン難易度から決定
※ アナウンス自体は 決定論的に分類

10. チャート挙動

仮想ポイント制

HODL 成功で倍率加算

HIGH_RISK_REWARD 成功時は 指数的上昇

ゼロ = 完全終了

11. Learn パネル（RUGGED 時のみ）

なぜこのアナウンスは危険だったか

現実では何が起きがちか

**「利確という行動が唯一の防御になる」**ことを明示

※ 生存時は表示しない
※ SAFE は退屈でよい

12. 倫理・注意書き

教育・娯楽目的

実資金・換金性なし

投資助言ではない

13. 提出用ワンフレーズ

「情報ではなく、利確のタイミングを選べ。」

設計上のキモ（最重要）

正解は SAFEを当てることではない

正解は 「いつ降りるか」

プレイヤーは

欲に勝てば進める

欲を信じれば死ぬ