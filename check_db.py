import sys, io, sqlite3
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

conn = sqlite3.connect(r'c:\Users\USER\PFE\certificates.db')
c = conn.cursor()
c.execute("SELECT sql FROM sqlite_master WHERE type='table'")
print('Schema:', c.fetchall())
c.execute('SELECT * FROM valid_certificates')
rows = c.fetchall()
print(f'Total records: {len(rows)}')
for r in rows[:20]:
    print(r)
conn.close()
