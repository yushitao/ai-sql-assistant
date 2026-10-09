import sqlite3

conn = sqlite3.connect(
    "data/ai_sql_assistant.db"
)

conn.execute(
    "UPDATE users SET role = 'ADMIN' WHERE id=2"
)

conn.commit()

print(
    conn.execute(
        "SELECT id, username, role FROM users"
    ).fetchall()
)

conn.close()
