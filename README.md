# rbeier.dev gallery application

## Regenerate image formats

```sh
./scripts/backup.sh # the script needs a running container
docker compose stop cms
docker compose run --rm cms node scripts/regenerate-formats.js
docker compose start cms
```
