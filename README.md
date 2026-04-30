# lunchflow-bridge

`lunchflow-bridge` is a small proxy service meant to sit between Sure and Lunchflow as part of a Sure Docker Compose stack.

The reason this project exists is practical: transaction deduplication is not reliable enough in my setup, especially with Pekao bank in Poland. Deduplicated transaction identifiers keep changing, which makes downstream processing unstable and causes the same transaction history to behave differently over time.

This service is intended to solve that problem outside of the bank integration itself. Instead of waiting for Pekao to make transaction identifiers stable, the bridge provides a place to normalize and stabilize transaction handling before data reaches Lunchflow.

In short, the project exists to make deduplication reliable when the upstream bank feed is not, which makes lunchflow deduplicated responses unpredictable.

## Why this exists

- Sure and Lunchflow need a dependable handoff point.
- Pekao transaction identifiers can shift, which breaks reliable deduplication.
- A dedicated proxy makes it possible to introduce stable logic in one place.
- It is easier to fix this in a small bridge service now than to wait indefinitely for the upstream issue to be resolved.

## Intended role

`lunchflow-bridge` is not meant to be the main business system. Its role is narrow and deliberate:

- receive data from Lunchflow
- apply logic that makes transaction matching and deduplication consistent
- forward stable deduplicated data to Sure

## Example Docker Compose integration

As part of a Sure stack, the bridge can be added as another service in your `docker-compose.yml`:

```yaml
bridge:
  build:
    context: ./lunchflow-deduplication
    dockerfile: Dockerfile
  depends_on:
    db:
      condition: service_healthy
  environment:
    DB_URL: postgres://${POSTGRES_USER:-sure_user}:${POSTGRES_PASSWORD:-sure_password}@db:5432/bridge
  networks:
    - sure_net
```

Then all you'll have to do is to rewire your Lunchflow integration settings in Sure to `http://bridge:3000/api/v1` and the bridge 
will take care of the rest.
