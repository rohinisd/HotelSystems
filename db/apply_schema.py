import sys
import psycopg2

conn_str = sys.argv[1] if len(sys.argv) > 1 else "postgresql://sfms_api:QXKKhGExFre5kvp@localhost:15432/sfms"

conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

with open("db/init.sql", "r") as f:
    sql = f.read()

cur.execute(sql)
print("Schema applied successfully!")

cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
for row in cur.fetchall():
    print(f"  Table: {row[0]}")

# Also run seed data if available
try:
    with open("db/seed.sql", "r") as f:
        seed_sql = f.read()
    cur.execute(seed_sql)
    print("Seed data applied successfully!")
except FileNotFoundError:
    print("No seed.sql found, skipping.")

cur.close()
conn.close()
