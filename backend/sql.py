import csv
from pathlib import Path
import mysql.connector
from mysql.connector import Error

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = "C:/Users/harsh/Downloads/trains data/vande bharat.csv"

def to_int_or_none(s: str):
    s = (s or "").strip()
    try:
        return int(s)
    except ValueError:
        return None

def flag(v: str) -> int:
    return 1 if (v or "").strip() else 0

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Root@123",  # update
    database="railconnect",
)
cur = conn.cursor()

create_table_sql = """
CREATE TABLE IF NOT EXISTS trains (
    train_no INT PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(255),
    zone VARCHAR(255),
    source VARCHAR(255),
    dep_time VARCHAR(255),
    destination VARCHAR(255),
    arr_time VARCHAR(255),
    duration VARCHAR(255),
    halts INT,
    distance VARCHAR(255),
    speed VARCHAR(255),
    return_train INT,
    classes VARCHAR(255),
    mon TINYINT(1),
    tue TINYINT(1),
    wed TINYINT(1),
    thu TINYINT(1),
    fri TINYINT(1),
    sat TINYINT(1),
    sun TINYINT(1)
)
"""
cur.execute(create_table_sql)

insert_sql = """
INSERT INTO trains (
  train_no, name, type, zone, source, dep_time, destination, arr_time, duration,
  halts, distance, speed, return_train, classes,
  mon, tue, wed, thu, fri, sat, sun
) VALUES (
  %s,%s,%s,%s,%s,%s,%s,%s,%s,
  %s,%s,%s,%s,%s,
  %s,%s,%s,%s,%s,%s,%s
)
ON DUPLICATE KEY UPDATE
  name=VALUES(name),
  type=VALUES(type),
  zone=VALUES(zone),
  source=VALUES(source),
  dep_time=VALUES(dep_time),
  destination=VALUES(destination),
  arr_time=VALUES(arr_time),
  duration=VALUES(duration),
  halts=VALUES(halts),
  distance=VALUES(distance),
  speed=VALUES(speed),
  return_train=VALUES(return_train),
  classes=VALUES(classes),
  mon=VALUES(mon),
  tue=VALUES(tue),
  wed=VALUES(wed),
  thu=VALUES(thu),
  fri=VALUES(fri),
  sat=VALUES(sat),
  sun=VALUES(sun)
"""

inserted = 0
skipped = 0

with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    _ = next(reader, None)   # summary "127 Trains"
    header = next(reader, None)

    if not header or header[16].strip() != "Running Days":
        print("Warning: unexpected header; proceeding")  # minimal notice

    row_idx = 1
    for row in reader:
        row_idx += 1
        if not row or all((c or "").strip() == "" for c in row):
            continue

        if len(row) < 24:
            row += [""] * (24 - len(row))
        row = [(c or "").strip() for c in row]

        train_no = to_int_or_none(row[0])
        if train_no is None:
            skipped += 1
            continue

        name = row[1]
        typ = row[2]
        zone = row[3]
        source = row[4]             # From
        dep_time = row[5]           # Dep
        destination = row[6]        # To
        arr_time = row[7]           # Arr
        duration = row[8]
        halts = to_int_or_none(row[9])
        distance = row[10]          # e.g., "1082 km"
        speed = row[11]             # e.g., "56 km/hr"
        return_train = to_int_or_none(row[12])
        classes = row[13]

        # Running Days indices: 17..23 are S, M, T, W, T, F, S
        sun = flag(row[17])  # first 'S'
        mon = flag(row[18])
        tue = flag(row[19])
        wed = flag(row[20])
        thu = flag(row[21])
        fri = flag(row[22])
        sat = flag(row[23])  # last 'S'

        params = (
            train_no, name, typ, zone, source, dep_time, destination, arr_time, duration,
            halts, distance, speed, return_train, classes,
            mon, tue, wed, thu, fri, sat, sun
        )

        try:
            cur.execute(insert_sql, params)
            inserted += 1
        except Error as e:
            print(f"Skip row {row_idx} train_no={train_no}: {e}")
            skipped += 1
            continue

conn.commit()
cur.close()
conn.close()
print(f"Done. Inserted: {inserted}, Skipped: {skipped}")
