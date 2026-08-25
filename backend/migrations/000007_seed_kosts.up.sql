-- Seed 20 dummy kost entries with owners
-- Depends on: 000001_init (users table must exist)
BEGIN;

-- Insert 20 dummy users
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Budi Santoso', 'budi.santoso@example.com', '081234567890', 'hash1', 'owner'),
('Siti Aminah', 'siti.aminah@example.com', '081234567891', 'hash2', 'owner'),
('Andi Wijaya', 'andi.wijaya@example.com', '081234567892', 'hash3', 'owner'),
('Dewi Laras', 'dewi.laras@example.com', '081234567893', 'hash3', 'owner'),
('Raka Pratama', 'raka.pratama@example.com', '081234567894', 'hash4', 'owner'),
('Putri Sari', 'putri.sari@example.com', '081234567895', 'hash4', 'owner'),
('Budi Utomo', 'budi.utomo@example.com', '081234567896', 'hash5', 'owner'),
('Maya Dewi', 'maya.dewi@example.com', '081234567897', 'hash5', 'owner'),
('Tommy Setiawan', 'tommy.setiawan@example.com', '081234567898', 'hash6', 'owner'),
('Lestari', 'lestari@example.com', '081234567899', 'hash6', 'owner'),
('Fandy Putra', 'fandy.putra@example.com', '081234567900', 'hash7', 'owner'),
('Gita', 'gita@example.com', '081234567901', 'hash7', 'owner'),
('Hans Kim', 'hans.kim@example.com', '081234567902', 'hash8', 'owner'),
('Sarah Johnson', 'sarah.johnson@example.com', '081234567903', 'hash8', 'owner'),
('Michael Brown', 'michael.brown@example.com', '081234567904', 'hash9', 'owner'),
('Emily Davis', 'emily.davis@example.com', '081234567905', 'hash9', 'owner'),
('David Wilson', 'david.wilson@example.com', '081234567906', 'hash10', 'owner'),
('Lisa Anderson', 'lisa.anderson@example.com', '081234567907', 'hash10', 'owner'),
('Chris Lee', 'chris.lee@example.com', '081234567908', 'hash10', 'owner'),
('Olivia Taylor', 'olivia.taylor@example.com', '081234567909', 'hash10', 'owner');

-- Insert 20 dummy kost entries with owners
INSERT INTO kosts (owner_id, name, description, address, city, gender, status, photos, facilities, verified_at) VALUES
(uuid(), 'Kost Budi', 'Kost dekat ITB', 'Jl. Merdeka No. 1', 'Bandung', 'putra', 'verified', '{"https://picsum.photos/seed/budi1/800/600.jpg}"::text[], '{kamar, wifi}', now()),
(uuid(), 'Kost Budi 2', 'Kost murah', 'Jl. Raya No. 10', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/budi2/800/600.jpg}"::text[], '{kamar, makanan}', now()),
(uuid(), 'Kost Siti', 'Kost keluarga', 'Jl. Sudirman No. 5', 'Jakarta', 'campur', 'verified', '{"https://picsum.photos/seed/siti1/800/600.jpg}"::text[], '{kamar, ac}', now()),
(uuid(), 'Kost Siti 2', 'Kost premium', 'Jl. Thamrin No. 3', 'Jakarta', 'putri', 'pending', '{"https://picsum.photos/seed/siti2/800/600.jpg}"::text[], '{kamar, kolam}', now()),
(uuid(), 'Kost Andi', 'Kost operasional', 'Jl. Gatot Subroto No. 5', 'Jakarta', 'putra', 'verified', '{"https://picsum.photos/seed/andi1/800/600.jpg}"::text[], '{kamar, parkir}', now()),
(uuid(), 'Kost Andi 2', 'Kost bisnis', 'Jl. Palmerah No. 7', 'Jakarta', 'campur', 'rejected', '{"https://picsum.photos/seed/andi2/800/600.jpg}"::text[], '{fasilitas}', now()),
(uuid(), 'Kost Dewi', 'Kost mahasiswa', 'Jl. Kenari No. 5', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/dewi1/800/600.jpg}"::text[], '{kafe, wifi}', now()),
(uuid(), 'Kost Dewi 2', 'Kost umum', 'Jl. Sawah No. 2', 'Bandung', 'putra', 'pending', '{"https://picsum.photos/seed/dewi2/800/600.jpg}"::text[], '{kamar}', now()),
(uuid(), 'Kost Raka', 'Kost kartu', 'Jl. Asia Afrika No. 3', 'Bandung', 'putra', 'verified', '{"https://picsum.photos/seed/raka1/800/600.jpg}"::text[], '{"sepeda"}', now()),
(uuid(), 'Kost Putri', 'Kost Wanita', 'Jl. Pahlawan No. 1', 'Jakarta', 'putri', 'verified', '{"https://picsum.photos/seed/putri1/800/600.jpg}"::text[], '{minimarket}', now()),
(uuid(), 'Kost Budi Utomo', 'Kost Keluarga', 'Jl. Cikutra No. 5', 'Bandung', 'campur', 'verified', '{"https://picsum.photos/seed/budi21/800/600.jpg}"::text[], '{"tasik", "kamal"}', now()),
(uuid(), 'Kost Maya', 'Kost Dekat Pasar', 'Jl. Pasar No. 10', 'Jakarta', 'putri', 'verified', '{"https://picsum.photos/seed/maya1/800/600.jpg}"::text[], '{"parkir"}', now()),
(uuid(), 'Kost Tommy', 'Kost Relawan', 'Jl. Khusus No. 5', 'Bandung', 'campur', 'verified', '{"https://picsum.photos/seed/tommy1/800/600.jpg}"::text[], '{bantuan}', now()),
(uuid(), 'Kost Lestari', 'Kost Sehat', 'Jl. Sehat No. 3', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/lestari1/800/600.jpg}"::text[], '{"fisio"}', now()),
(uuid(), 'Kost Fandy', 'Kost Muda', 'Jl. Muda No. 1', 'Jakarta', 'putra', 'verified', '{"https://picsum.photos/seed/fandy1/800/600.jpg}"::text[], '{renovasi}', now()),
(uuid(), 'Kost Gita', 'Kost Relawan', 'Jl. Relawan No. 3', 'Jakarta', 'campur', 'pending', '{"https://picsum.photos/seed/gita1/800/600.jpg}"::text[], '{bantuan}', now()),
(uuid(), 'Kost Hans', 'Kost Internasional', 'Jl. International No. 1', 'Jakarta', 'putra', 'verified', '{"https://picsum.photos/seed/hans1/800/600.jpg}"::text[], '{internet}', now()),
(uuid(), 'Kost Sarah', 'Kost Studi', 'Jl. Studi No. 5', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/sarah1/800/600.jpg}"::text[], '{studi}', now()),
(uuid(), 'Kost Michael', 'Kost Kerja', 'Jl. Kerja No. 3', 'Jakarta', 'putra', 'verified', '{"https://picsum.photos/seed/michael1/800/600.jpg}"::text[], '{kantor}', now()),
(uuid(), 'Kost Emily', 'Kost Wisata', 'Jl. Wisata No. 7', 'Bandung', 'campur', 'verified', '{"https://picsum.photos/seed/emily1/800/600.jpg}"::text[], '{tour}', now()),
(uuid(), 'Kost David', 'Kost Percobaan', 'Jl. Percobaan No. 1', 'Jakarta', 'putra', 'verified', '{"https://picsum.photos/seed/david1/800/600.jpg}"::text[], '{percobaan}', now()),
(uuid(), 'Kost Lisa', 'Kost Agama', 'Jl. Agama No. 1', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/lisa1/800/600.jpg}"::text[], '{qudrat}', now()),
(uuid(), 'Kost Chris', 'Kost Relokasi', 'Jl. Relokasi No. 5', 'Jakarta', 'campur', 'verified', '{"https://picsum.photos/seed/chris1/800/600.jpg}"::text[], '{ekspedisi}', now()),
(uuid(), 'Kost Olivia', 'Kost Renovasi', 'Jl. Renovasi No. 7', 'Bandung', 'putri', 'verified', '{"https://picsum.photos/seed/olivia1/800/600.jpg}"::text[], '{renovasi}', now());

COMMIT;