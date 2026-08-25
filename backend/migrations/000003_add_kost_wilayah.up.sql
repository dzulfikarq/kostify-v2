-- Wilayah detail for kosts (provinsi, kota, kecamatan, kelurahan, kode pos)
ALTER TABLE kosts ADD COLUMN province varchar(100);
ALTER TABLE kosts ADD COLUMN regency varchar(100);
ALTER TABLE kosts ADD COLUMN district varchar(100);
ALTER TABLE kosts ADD COLUMN village varchar(100);
ALTER TABLE kosts ADD COLUMN postal_code varchar(10);
-- Keep city for backward compat, but new fields are preferred
CREATE INDEX idx_kosts_province ON kosts(province);
CREATE INDEX idx_kosts_postal ON kosts(postal_code);
