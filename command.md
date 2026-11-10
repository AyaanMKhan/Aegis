# Useful commands

Run all of these from the repo root (where `docker-compose.yml` lives).

## Starting and stopping

```bash
docker compose up --build        # build images and start everything (logs in foreground, Ctrl+C stops)
docker compose up --build -d     # same, but in the background
docker compose down              # stop and remove containers (database data is KEPT)
docker compose down -v           # stop AND delete the pgdata volume (wipes the database)
docker compose ps                # what's running, and on which ports
docker compose restart backend   # restart just one service
```

> **Code changes need a rebuild.** The Dockerfile copies `backend/` into the image,
> so edits to your Python files don't show up in the running container until you
> run `docker compose up --build` again.

## Logs

```bash
docker compose logs -f backend   # follow backend logs live (Ctrl+C to stop following)
docker compose logs --tail 50 db # last 50 lines from Postgres
```

## Postgres (psql)

```bash
docker compose exec -it db psql -U aegis -d aegis   # interactive psql shell
docker compose exec db psql -U aegis -c '\dt'       # run one command and exit
```

Inside psql:

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `\dt`            | list tables                                   |
| `\d users`       | show a table's columns, types, keys, indexes  |
| `\l`             | list databases                                |
| `\x`             | toggle expanded output (easier to read rows)  |
| `\q`             | quit                                          |
| `SELECT * FROM users LIMIT 10;` | look at data (don't forget the `;`) |

You can also connect from a GUI client (TablePlus, DBeaver, pgAdmin) on your Mac,
because port 5432 is published:
`postgresql://aegis:aegis@localhost:5432/aegis`

## Resetting the schema

`Base.metadata.create_all()` only creates tables that **don't exist yet**. It never
adds, removes or changes columns on an existing table. After changing a model,
either wipe the database and let it recreate everything:

```bash
docker compose down -v && docker compose up --build
```

or drop just the one table in psql (`DROP TABLE users;`) and restart the backend.
Once you have data you care about, switch to Alembic migrations instead.

## Getting a shell inside a container

```bash
docker compose exec backend sh   # poke around the backend container (/app is your code)
docker compose exec db sh        # same for Postgres
```

## API

- Swagger UI (try endpoints in the browser): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Cleanup

```bash
docker system df                 # how much disk Docker is using
docker image prune               # remove dangling images left over from rebuilds
docker builder prune             # clear the build cache
```
