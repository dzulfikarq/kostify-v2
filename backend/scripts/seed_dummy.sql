-- Kostify dummy data seed (idempotent-ish: fixed UUIDs, safe to re-run)
-- Run: Get-Content seed_dummy.sql -Raw | docker compose exec -T db psql -U kostify -d kostify

BEGIN;

-- ===== USERS =====
INSERT INTO users (id, name, email, phone, password_hash, role, is_active) VALUES
  ('11111111-1111-4111-8111-111111111101', 'Bapak Ahmad Wijaya',   'ahmad@kost.local',  '081200010001', (SELECT password_hash FROM users WHERE email='owner@test.local'), 'owner', true),
  ('11111111-1111-4111-8111-111111111102', 'Ibu Siti Rahayu',      'sitiown@kost.local','081200010002', (SELECT password_hash FROM users WHERE email='owner@test.local'), 'owner', true),
  ('11111111-1111-4111-8111-111111111103', 'Pak Budi Santoso',     'budi@kost.local',   '081200010003', (SELECT password_hash FROM users WHERE email='owner@test.local'), 'owner', true),
  ('11111111-1111-4111-8111-111111111104', 'Bu Ratna Kusuma',      'ratna@kost.local',  '081200010004', (SELECT password_hash FROM users WHERE email='owner@test.local'), 'owner', true),
  ('22222222-2222-4222-8222-222222222201', 'Dewi Lestari',         'dewi@mail.local',   '081300020001', (SELECT password_hash FROM users WHERE email='siti@test.local'), 'tenant', true),
  ('22222222-2222-4222-8222-222222222202', 'Rizky Pratama',        'rizky@mail.local',  '081300020002', (SELECT password_hash FROM users WHERE email='siti@test.local'), 'tenant', true),
  ('22222222-2222-4222-8222-222222222203', 'Anisa Putri',          'anisa@mail.local',  '081300020003', (SELECT password_hash FROM users WHERE email='siti@test.local'), 'tenant', true),
  ('22222222-2222-4222-8222-222222222204', 'Fajar Nugroho',        'fajar@mail.local',  '081300020004', (SELECT password_hash FROM users WHERE email='siti@test.local'), 'tenant', true)
ON CONFLICT (email) DO NOTHING;

-- ===== KOSTS (24) =====
INSERT INTO kosts (id, owner_id, name, description, address, city, province, regency, district, village, postal_code, gender, status, is_active, photos, facilities, verified_at) VALUES
  ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-111111111101','Kost Melati Indah','Kost dekat kampus, lingkungan aman dan tenang. Cocok untuk mahasiswa.','Jl. Melati No. 12','Depok','Jawa Barat','Kota Depok','Beji','Tanah Baru','16421','putri','verified',true,'{}','{wifi,ac,kasur,parkir}',now()),
  ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-111111111101','Kost Anggrek Asri','Kost nyata dekat Stasiun Pondok Cina, akses jalan tol mudah.','Jl. Anggrek No. 8','Depok','Jawa Barat','Kota Depok','Pancoran Mas','Depok','16436','campur','verified',true,'{}','{wifi,ac,parkir,dapur}',now()),
  ('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-111111111101','Griya Mawar Syariah','Kost syariah untuk putri, ada mushola dan dapur bersama.','Jl. Mawar Raya No. 45','Depok','Jawa Barat','Kota Depok','Sukmajaya','Mekarsari','16411','putri','verified',true,'{}','{wifi,kipas,mushola,dapur}',now()),
  ('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-111111111102','Kost Kenanga Permai','Kost strategis dekat UI, lingkungan hijau dan asri.','Jl. Kenanga No. 3','Depok','Jawa Barat','Kota Depok','Cimanggis','Tugu','16452','putra','verified',true,'{}','{wifi,ac,balkon}',now()),
  ('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-111111111102','Kost Dahlia Modern','Konsep koliving modern, cocok untuk anak kos yang ingin nyaman.','Jl. Dahlia No. 21','Jakarta Selatan','DKI Jakarta','Jakarta Selatan','Tebet','Tebet Barat','12810','campur','verified',true,'{}','{wifi,ac,tv,kasur,parkir}',now()),
  ('33333333-3333-4333-8333-000000000006','11111111-1111-4111-8111-111111111102','Kost Flamboyan','Kost ekonomis dekat stasiun Tebet, cocok untuk pekerja.','Jl. Flamboyan No. 17','Jakarta Selatan','DKI Jakarta','Jakarta Selatan','Tebet','Kebon Baru','12830','putra','verified',true,'{}','{wifi,kipas,parkir}',now()),
  ('33333333-3333-4333-8333-000000000007','11111111-1111-4111-8111-111111111103','Kost Tulip Bandung','Kost dekat kampus ITB dan Unpad, udara sejuk.','Jl. Tulip No. 9','Bandung','Jawa Barat','Kota Bandung','Sukajadi','Lebakgede','40132','campur','verified',true,'{}','{wifi,water heater,kasur}',now()),
  ('33333333-3333-4333-8333-000000000008','11111111-1111-4111-8111-111111111103','Villa Sakura Dago','Kost premium di Dago dengan view pegunungan.','Jl. Sakura No. 88','Bandung','Jawa Barat','Kota Bandung','Coblong','Dago','40135','putri','verified',true,'{}','{wifi,ac,water heater,balkon,parkir}',now()),
  ('33333333-3333-4333-8333-000000000009','11111111-1111-4111-8111-111111111103','Kost Cempaka Timur','Kost dekat kawasan industri, cocok untuk pekerja shift.','Jl. Cempaka No. 5','Bandung','Jawa Barat','Kota Cimahi','Cimahi Utara','Cibeber','40513','campur','verified',true,'{}','{wifi,kipas,dapur}',now()),
  ('33333333-3333-4333-8333-000000000010','11111111-1111-4111-8111-111111111104','Kost Bougenville Surabaya','Kost dekat Unair, lingkungan mahasiswa.','Jl. Bougenville No. 14','Surabaya','Jawa Timur','Kota Surabaya','Karangmenjangan','Menur','60292','campur','verified',true,'{}','{wifi,ac,kasur,parkir}',now()),
  ('33333333-3333-4333-8333-000000000011','11111111-1111-4111-8111-111111111104','Kost Palem Hijau','Kost tenang dekat kawasan Pusat Kota Surabaya.','Jl. Palem No. 27','Surabaya','Jawa Timur','Kota Surabaya','Gubeng','Airlangga','60286','putra','verified',true,'{}','{wifi,kipas,parkir,dapur}',now()),
  ('33333333-3333-4333-8333-000000000012','11111111-1111-4111-8111-111111111104','Kost Alamanda Timur','Kost baru renovasi, fasilitas lengkap.','Jl. Alamanda No. 31','Surabaya','Jawa Timur','Kota Surabaya','Wonokromo','Darmo','60189','putri','verified',true,'{}','{wifi,ac,water heater,tv}',now()),
  ('33333333-3333-4333-8333-000000000013','11111111-1111-4111-8111-111111111101','Kost Yogyakarta Zebra','Kost dekat UGM, favorit mahasiswa.','Jl. Zebra No. 2','Yogyakarta','Daerah Istimewa Yogyakarta','Kota Yogyakarta','Gondokusuman','Demangan','55223','campur','verified',true,'{}','{wifi,kipas,kasur,dapur}',now()),
  ('33333333-3333-4333-8333-000000000014','11111111-1111-4111-8111-111111111101','Homestay Kopi Sleman','Suasana rumah khas Jogja, dekat kampus UPN.','Jl. Kopi No. 19','Sleman','Daerah Istimewa Yogyakarta','Kabupaten Sleman','Depok','Condongcatur','55283','campur','verified',true,'{}','{wifi,ac,parkir,balkon}',now()),
  ('33333333-3333-4333-8333-000000000015','11111111-1111-4111-8111-111111111102','Kost Semarang Nanas','Kost dekat Undip, harga bersahabat.','Jl. Nanas No. 6','Semarang','Jawa Tengah','Kota Semarang','Tembalang','Sendangmulyo','50272','campur','verified',true,'{}','{wifi,kipas,parkir}',now()),
  ('33333333-3333-4333-8333-000000000016','11111111-1111-4111-8111-111111111103','Kost Malang Apel','Sejuk seperti nama kotanya, dekat Brawijaya.','Jl. Apel No. 11','Malang','Jawa Timur','Kota Malang','Lowokwaru','Ketawanggede','65145','campur','verified',true,'{}','{wifi,water heater,kasur}',now()),
  ('33333333-3333-4333-8333-000000000017','11111111-1111-4111-8111-111111111104','Kost Medan Durian','Kost luas, parkir motor dan mobil gratis.','Jl. Durian No. 23','Medan','Sumatera Utara','Kota Medan','Medan Baru','Petisah Hulu','20154','campur','verified',true,'{}','{wifi,ac,parkir}',now()),
  ('33333333-3333-4333-8333-000000000018','11111111-1111-4111-8111-111111111101','Kost Makassar Cendana','Kost dekat Hasanuddin, angin laut sepoi-sepoi.','Jl. Cendana No. 4','Makassar','Sulawesi Selatan','Kota Makassar','Tamalanrea','Bira','90245','campur','verified',true,'{}','{wifi,kipas,dapur}',now()),
  ('33333333-3333-4333-8333-000000000019','11111111-1111-4111-8111-111111111102','Kost Denpasar Frangipani','Kost dekat kampus dan pantai Sanur.','Jl. Frangipani No. 16','Denpasar','Bali','Kota Denpasar','Denpasar Selatan','Sanur','80228','campur','verified',true,'{}','{wifi,ac,balkon,parkir}',now()),
  ('33333333-3333-4333-8333-000000000020','11111111-1111-4111-8111-111111111103','Kost Bekasi Sakura Timur','Kost komuter Strategis ke Jakarta, dekat KRL.','Jl. Sakura Timur No. 7','Bekasi','Jawa Barat','Kota Bekasi','Bekasi Timur','Duren Jaya','17111','campur','verified',true,'{}','{wifi,ac,parkir,tv}',now()),
  -- pending (menunggu verifikasi)
  ('33333333-3333-4333-8333-000000000021','11111111-1111-4111-8111-111111111101','Kost Baru Mangga Enak','Baru direnovasi total, siap huni tahun ini.','Jl. Mangga No. 99','Depok','Jawa Barat','Kota Depok','Limo','Limus','16513','putra','pending',true,'{}','{wifi,ac}',NULL),
  ('33333333-3333-4333-8333-000000000022','11111111-1111-4111-8111-111111111104','Kost Rambutan Segar','Kost baru buka di daerah Sentul.','Jl. Rambutan No. 3','Bogor','Jawa Barat','Kabupaten Bogor','Citeureup','Sanja','16810','campur','pending',true,'{}','{wifi,kipas,parkir}',NULL),
  -- rejected & inactive
  ('33333333-3333-4333-8333-000000000023','11111111-1111-4111-8111-111111111102','Kost Test Jelek','Data foto belum lengkap.','Jl. Test No. 1','Jakarta','DKI Jakarta','Jakarta Pusat','Tanah Abang','Bendungan Hilir','10210','campur','rejected',false,'{}','{}',NULL),
  ('33333333-3333-4333-8333-000000000024','11111111-1111-4111-8111-111111111103','Kost Libur Musim Hujan','Sementara tidak menerima penghuni baru.','Jl. Tutup No. 2','Bandung','Jawa Barat','Kota Bandung','Regol','Cigereleng','40253','campur','verified',false,'{}','{wifi}',now())
ON CONFLICT (id) DO NOTHING;

UPDATE kosts SET rejection_note = 'Foto dan alamat belum jelas, mohon lengkapi ya.' WHERE id = '33333333-3333-4333-8333-000000000023';

-- ===== ROOMS =====
-- 3 kamar per kost verified+aktif. ID kamar = 44444444-4444-4444-8444-<ord*100+n>
--   contoh: kost#1 -> ...101,102,103 ; kost#5 -> ...501,502,503
INSERT INTO rooms (id, kost_id, room_number, price_monthly, status, photos, facilities)
SELECT
  ('44444444-4444-4444-8444-' || lpad((k.ord * 100 + n.n)::text, 12, '0'))::uuid,
  k.id,
  chr(64 + n.n) || '-' || lpad(k.ord::text, 2, '0'),
  500000 + k.ord * 100000 + n.n * 250000,
  CASE WHEN k.ord <= 4 AND n.n = 1 THEN 'reserved'::room_status      -- dipakai booking pending
       WHEN k.ord <= 3 AND n.n = 2 THEN 'occupied'::room_status      -- dipakai kontrak aktif
       WHEN k.ord IN (5, 6) AND n.n = 1 THEN 'occupied'::room_status -- kontrak aktif & ended
       ELSE 'available'::room_status END,
  '{}',
  k.facilities
FROM (SELECT id, facilities, row_number() OVER (ORDER BY id) AS ord FROM kosts WHERE status = 'verified' AND is_active = true) k
CROSS JOIN generate_series(1, 3) AS n(n)
ON CONFLICT (id) DO NOTHING;

-- ===== BOOKINGS =====
-- 4 booking pending (masing-masing mengunci 1 kamar jadi reserved)
INSERT INTO bookings (id, room_id, tenant_id, status, expires_at, created_at) VALUES
  ('55555555-5555-4555-8555-000000000001','44444444-4444-4444-8444-000000000101','22222222-2222-4222-8222-222222222201','pending',now()+interval '3 days',now()-interval '1 day'),
  ('55555555-5555-4555-8555-000000000002','44444444-4444-4444-8444-000000000201','22222222-2222-4222-8222-222222222202','pending',now()+interval '2 days',now()-interval '2 hours'),
  ('55555555-5555-4555-8555-000000000003','44444444-4444-4444-8444-000000000301','22222222-2222-4222-8222-222222222203','pending',now()+interval '3 days',now()-interval '3 hours'),
  ('55555555-5555-4555-8555-000000000004','44444444-4444-4444-8444-000000000401','22222222-2222-4222-8222-222222222204','pending',now()+interval '3 days',now()-interval '5 hours')
ON CONFLICT (id) DO NOTHING;

-- riwayat ditolak / kedaluwarsa (kamar tetap available)
INSERT INTO bookings (id, room_id, tenant_id, status, reject_reason, expires_at, created_at, decided_by, decided_at) VALUES
  ('55555555-5555-4555-8555-000000000011','44444444-4444-4444-8444-000000000702','22222222-2222-4222-8222-222222222201','rejected','Kamar sudah penuh bulan ini',now()-interval '2 days',now()-interval '5 days',(SELECT owner_id FROM kosts WHERE id='33333333-3333-4333-8333-000000000007'),now()-interval '4 days'),
  ('55555555-5555-4555-8555-000000000012','44444444-4444-4444-8444-000000000803','22222222-2222-4222-8222-222222222202','expired',NULL,now()-interval '1 day',now()-interval '4 days',NULL,NULL)
ON CONFLICT (id) DO NOTHING;

-- ===== CONTRACTS =====
-- booking approved dulu (sumber kontrak)
INSERT INTO bookings (id, room_id, tenant_id, status, expires_at, created_at, decided_by, decided_at) VALUES
  ('55555555-5555-4555-8555-000000000021','44444444-4444-4444-8444-000000000102','22222222-2222-4222-8222-222222222201','approved',now()-interval '17 days',now()-interval '21 days',(SELECT owner_id FROM kosts WHERE id='33333333-3333-4333-8333-000000000001'),now()-interval '20 days'),
  ('55555555-5555-4555-8555-000000000022','44444444-4444-4444-8444-000000000202','22222222-2222-4222-8222-222222222202','approved',now()-interval '7 days',now()-interval '11 days',(SELECT owner_id FROM kosts WHERE id='33333333-3333-4333-8333-000000000002'),now()-interval '10 days'),
  ('55555555-5555-4555-8555-000000000023','44444444-4444-4444-8444-000000000302','22222222-2222-4222-8222-222222222203','approved',now()-interval '37 days',now()-interval '41 days',(SELECT owner_id FROM kosts WHERE id='33333333-3333-4333-8333-000000000003'),now()-interval '40 days'),
  ('55555555-5555-4555-8555-000000000024','44444444-4444-4444-8444-000000000601','22222222-2222-4222-8222-222222222204','approved',now()-interval '97 days',now()-interval '101 days',(SELECT owner_id FROM kosts WHERE id='33333333-3333-4333-8333-000000000006'),now()-interval '100 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contracts (id, booking_id, room_id, tenant_id, start_date, end_date, status, created_at) VALUES
  ('66666666-6666-4666-8666-000000000001','55555555-5555-4555-8555-000000000021','44444444-4444-4444-8444-000000000102','22222222-2222-4222-8222-222222222201',current_date - 20,current_date + 70,'active',now()-interval '20 days'),
  ('66666666-6666-4666-8666-000000000002','55555555-5555-4555-8555-000000000022','44444444-4444-4444-8444-000000000202','22222222-2222-4222-8222-222222222202',current_date - 10,current_date + 80,'active',now()-interval '10 days'),
  ('66666666-6666-4666-8666-000000000003','55555555-5555-4555-8555-000000000023','44444444-4444-4444-8444-000000000302','22222222-2222-4222-8222-222222222203',current_date - 40,current_date + 50,'active',now()-interval '40 days'),
  ('66666666-6666-4666-8666-000000000004','55555555-5555-4555-8555-000000000024','44444444-4444-4444-8444-000000000601','22222222-2222-4222-8222-222222222204',current_date - 100,current_date - 10,'ended',now()-interval '100 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Ringkasan
SELECT 'users' AS tbl, count(*) FROM users UNION ALL
SELECT 'kosts', count(*) FROM kosts UNION ALL
SELECT 'rooms', count(*) FROM rooms UNION ALL
SELECT 'bookings', count(*) FROM bookings UNION ALL
SELECT 'contracts', count(*) FROM contracts;
