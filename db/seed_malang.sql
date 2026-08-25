-- Reset dummy data: hapus rooms, kosts, owner lama; buat 10 kost Malang Raya
BEGIN;

-- simpan hash valid SEBELUM hapus (password: Owner123!)
CREATE TEMP TABLE _hash AS SELECT password_hash FROM users WHERE email = 'budi.santoso@example.com';

DELETE FROM rooms;
DELETE FROM kosts;
DELETE FROM users WHERE role = 'owner' AND email LIKE '%@example.com';

-- 5 owner baru
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Ahmad Fauzi',   'ahmad.fauzi@kostify.test',   '081233440001', (SELECT password_hash FROM _hash), 'owner'),
('Siti Nurhaliza','siti.nurhaliza@kostify.test','081233440002', (SELECT password_hash FROM _hash), 'owner'),
('Bambang Wijaya','bambang.wijaya@kostify.test','081233440003', (SELECT password_hash FROM _hash), 'owner'),
('Ratna Kusuma',  'ratna.kusuma@kostify.test',  '081233440004', (SELECT password_hash FROM _hash), 'owner'),
('Dedi Mulyadi',  'dedi.mulyadi@kostify.test',  '081233440005', (SELECT password_hash FROM _hash), 'owner');

-- 10 kost di Malang Raya (Kota Malang, Batu, Kab. Malang)
INSERT INTO kosts (owner_id, name, description, address, city, province, regency, district, village, postal_code, gender, status, photos, facilities, verified_at) VALUES
((SELECT id FROM users WHERE email='ahmad.fauzi@kostify.test'),   'Kost Gembirowati Asri',   'Kost putra dekat Unibraw, lingkungan tenang dan asri.',            'Jl. Gembirowati No. 12',        'Malang', 'Jawa Timur', 'Kota Malang',    'Kedungkandang', 'Cemoro Kandang', '65135', 'putra',  'verified', ARRAY['https://picsum.photos/seed/mlg1/800/500.jpg']::text[],  ARRAY['wifi','parkir','kamar mandi dalam']::text[], now()),
((SELECT id FROM users WHERE email='ahmad.fauzi@kostify.test'),   'Kost Soekarno Hatta',     'Kost campur strategis di jalan raya Soekarno Hatta.',              'Jl. Soekarno Hatta No. 45',     'Malang', 'Jawa Timur', 'Kota Malang',    'Kedungkandang', 'Sukoharjo',      '65154', 'campur', 'verified', ARRAY['https://picsum.photos/seed/mlg2/800/500.jpg']::text[],  ARRAY['wifi','ac','tv']::text[], now()),
((SELECT id FROM users WHERE email='siti.nurhaliza@kostify.test'),'Kost Putri Melati',       'Kost putri aman dekat UIN Maulana Malik Ibrahim.',                 'Jl. Kawi Atas No. 8',           'Malang', 'Jawa Timur', 'Kota Malang',    'Klojen',        'Kauman',         '65116', 'putri',  'verified', ARRAY['https://picsum.photos/seed/mlg3/800/500.jpg']::text[],  ARRAY['wifi','kamar mandi dalam','dapur']::text[], now()),
((SELECT id FROM users WHERE email='siti.nurhaliza@kostify.test'),'Kost Ijen Boulevard',     'Kost eksklusif di kawasan Ijen Boulevard yang ikonik.',            'Jl. Ijen No. 21',               'Malang', 'Jawa Timur', 'Kota Malang',    'Klojen',        'Klojen',         '65119', 'campur', 'verified', ARRAY['https://picsum.photos/seed/mlg4/800/500.jpg']::text[],  ARRAY['ac','wifi','tv','parkir']::text[], now()),
((SELECT id FROM users WHERE email='bambang.wijaya@kostify.test'),'Kost Dinoyo Permai',      'Kost mahasiswa dekat kampus & terminal Arjosari.',                 'Jl. Dinoyo No. 30',             'Malang', 'Jawa Timur', 'Kota Malang',    'Lowokwaru',     'Dinoyo',         '65141', 'putra',  'verified', ARRAY['https://picsum.photos/seed/mlg5/800/500.jpg']::text[],  ARRAY['wifi','parkir']::text[], now()),
((SELECT id FROM users WHERE email='bambang.wijaya@kostify.test'),'Kost Batu Indah',         'Kost sejuk di kota Wisata Batu, dekat Alun-Alun Batu.',            'Jl. Raya Pandanwangi No. 5',    'Batu',   'Jawa Timur', 'Kota Batu',      'Batu',          'Pandanwangi',    '65314', 'campur', 'verified', ARRAY['https://picsum.photos/seed/mlg6/800/500.jpg']::text[],  ARRAY['wifi','dapur','parkir','taman']::text[], now()),
((SELECT id FROM users WHERE email='bambang.wijaya@kostify.test'),'Kost Selecta Malang',     'Kost asri dekat Selecta & pasar kota Batu.',                       'Jl. Selecta No. 17',            'Batu',   'Jawa Timur', 'Kota Batu',      'Batu',          'Punjungsekar',   '65312', 'putri',  'verified', ARRAY['https://picsum.photos/seed/mlg7/800/500.jpg']::text[],  ARRAY['wifi','kamar mandi dalam']::text[], now()),
((SELECT id FROM users WHERE email='ratna.kusuma@kostify.test'),  'Kost Lawang Jaya',        'Kost di Lawang, cocok untuk pekerja & mahasiswa.',                 'Jl. Raya Lawang No. 88',        'Malang', 'Jawa Timur', 'Kabupaten Malang','Lawang',       'Purwodadi',      '65216', 'campur', 'verified', ARRAY['https://picsum.photos/seed/mlg8/800/500.jpg']::text[],  ARRAY['wifi','parkir']::text[], now()),
((SELECT id FROM users WHERE email='ratna.kusuma@kostify.test'),  'Kost Singosari Ceria',    'Kost dekat kawasan industri Singosari & Polinema Jl. Soekarno.',   'Jl. Raya Singosari No. 3',      'Malang', 'Jawa Timur', 'Kabupaten Malang','Singosari',    'Candirenggo',    '65153', 'putra',  'verified', ARRAY['https://picsum.photos/seed/mlg9/800/500.jpg']::text[],  ARRAY['wifi','ac','parkir']::text[], now()),
((SELECT id FROM users WHERE email='dedi.mulyadi@kostify.test'),  'Kost Kepanjen Sentral',   'Kost strategis di pusat Kepanjen, dekat alun-alun.',               'Jl. Raya Kepanjen No. 10',      'Malang', 'Jawa Timur', 'Kabupaten Malang','Kepanjen',     'Kepanjen',       '65163', 'campur', 'pending',  ARRAY['https://picsum.photos/seed/mlg10/800/500.jpg']::text[], ARRAY['wifi','dapur']::text[], NULL);

-- Kamar: 2-5 per kost, harga wajar Malang (450rb - 1.5jt)
WITH counts(kname, nroom) AS (
  VALUES
    ('Kost Gembirowati Asri', 5),
    ('Kost Soekarno Hatta', 4),
    ('Kost Putri Melati', 3),
    ('Kost Ijen Boulevard', 5),
    ('Kost Dinoyo Permai', 2),
    ('Kost Batu Indah', 4),
    ('Kost Selecta Malang', 3),
    ('Kost Lawang Jaya', 2),
    ('Kost Singosari Ceria', 5)
),
nums(num, ord) AS (
  VALUES ('A1',1),('A2',2),('B1',3),('B2',4),('C1',5)
)
INSERT INTO rooms (kost_id, room_number, price_monthly, luas, status, photos, facilities)
SELECT
  k.id,
  n.num,
  (ARRAY[450000, 600000, 750000, 1000000, 1500000])[n.ord],
  (ARRAY[9, 12, 14, 16, 18])[n.ord],
  (ARRAY['available','available','available','occupied','reserved']::room_status[])[n.ord],
  ARRAY['https://picsum.photos/seed/mlg' || k.city || n.num || '/800/500.jpg']::text[],
  CASE n.ord % 4
    WHEN 0 THEN ARRAY['wifi','kasur']::text[]
    WHEN 1 THEN ARRAY['wifi','kamar mandi dalam']::text[]
    WHEN 2 THEN ARRAY['ac','wifi','lemari']::text[]
    ELSE ARRAY['wifi','meja belajar']::text[]
  END
FROM kosts k
JOIN counts c ON c.kname = k.name
JOIN nums n ON n.ord <= c.nroom;

COMMIT;
