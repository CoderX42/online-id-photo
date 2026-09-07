-- Neon Postgres schema for anonymous, one-time payment orders.
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'closed')),
  provider text NOT NULL DEFAULT 'wechat_native',
  out_trade_no text NOT NULL UNIQUE,
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_expires_idx ON orders(status, expires_at);
