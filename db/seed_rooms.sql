-- Seed dummy rooms: 5 rooms per verified kost
INSERT INTO rooms (kost_id, room_number, price_monthly, luas, status, photos, facilities)
SELECT
  k.id,
  n.num,
  800000 + ((row_number() OVER ())::int % 12) * 100000,
  (ARRAY[12, 16, 18, 20])[1 + (row_number() OVER ())::int % 4],
  (ARRAY['available','available','available','occupied','reserved']::room_status[])[1 + (row_number() OVER ())::int % 5],
  ARRAY['https://picsum.photos/seed/room' || (row_number() OVER ()) || '/800/500.jpg']::text[],
  CASE (row_number() OVER ())::int % 4
    WHEN 0 THEN ARRAY['ac','wifi','kasur']::text[]
    WHEN 1 THEN ARRAY['wifi','kamar mandi dalam']::text[]
    WHEN 2 THEN ARRAY['ac','tv','lemari']::text[]
    ELSE ARRAY['wifi','parkir','dapur']::text[]
  END
FROM kosts k
CROSS JOIN (VALUES ('A1'),('A2'),('B1'),('B2'),('C1')) AS n(num)
WHERE k.status = 'verified';
