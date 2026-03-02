"""Re-seed user passwords in production with bcrypt4-compatible hashes."""
import sys
from passlib.context import CryptContext
import psycopg2

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_hash = pwd.hash("password123")
print(f"New hash: {new_hash}")
print(f"Verify:   {pwd.verify('password123', new_hash)}")

conn_str = sys.argv[1] if len(sys.argv) > 1 else "postgresql://sfms_api:QXKKhGExFre5kvp@localhost:15432/sfms"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

cur.execute("UPDATE users SET hashed_password = %s", (new_hash,))
print(f"Updated {cur.rowcount} user(s)")

cur.execute("SELECT id, email, role FROM users ORDER BY id")
for row in cur.fetchall():
    print(f"  id={row[0]} email={row[1]} role={row[2]}")

cur.close()
conn.close()
print("Done!")
