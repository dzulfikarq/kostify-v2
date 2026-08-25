"use client";

import { useEffect, useState } from "react";

type WilayahItem = { kode: string; nama: string; kodepos?: string };

const BASE = "https://api-wilayah-indo.pages.dev/api";

export function useWilayah() {
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [loading, setLoading] = useState({ prov: false, reg: false, dist: false, vill: false });

  useEffect(() => {
    setLoading((s) => ({ ...s, prov: true }));
    fetch(`${BASE}/provinsi`)
      .then((r) => r.json())
      .then((j) => setProvinces(j.data || j))
      .catch(() => setProvinces([]))
      .finally(() => setLoading((s) => ({ ...s, prov: false })));
  }, []);

  const loadRegencies = async (provKode: string) => {
    if (!provKode) return setRegencies([]);
    setLoading((s) => ({ ...s, reg: true }));
    try {
      const r = await fetch(`${BASE}/kabupaten?provinsi=${provKode}`);
      const j = await r.json();
      setRegencies(j.data || j);
    } catch {
      setRegencies([]);
    } finally {
      setLoading((s) => ({ ...s, reg: false }));
    }
  };

  const loadDistricts = async (kabKode: string) => {
    if (!kabKode) return setDistricts([]);
    setLoading((s) => ({ ...s, dist: true }));
    try {
      const r = await fetch(`${BASE}/kecamatan?kabupaten=${kabKode}`);
      const j = await r.json();
      setDistricts(j.data || j);
    } catch {
      setDistricts([]);
    } finally {
      setLoading((s) => ({ ...s, dist: false }));
    }
  };

  const loadVillages = async (kecKode: string) => {
    if (!kecKode) return setVillages([]);
    setLoading((s) => ({ ...s, vill: true }));
    try {
      const r = await fetch(`${BASE}/desa?kecamatan=${kecKode}`);
      const j = await r.json();
      setVillages(j.data || j);
    } catch {
      setVillages([]);
    } finally {
      setLoading((s) => ({ ...s, vill: false }));
    }
  };

  return { provinces, regencies, districts, villages, loading, loadRegencies, loadDistricts, loadVillages };
}

export function WilayahSelect({
  value,
  onChange,
}: {
  value: { province: string; regency: string; district: string; village: string; postal_code: string; provinceKode?: string; regencyKode?: string; districtKode?: string; villageKode?: string };
  onChange: (v: { province: string; regency: string; district: string; village: string; postal_code: string; provinceKode?: string; regencyKode?: string; districtKode?: string; villageKode?: string }) => void;
}) {
  const { provinces, regencies, districts, villages, loading, loadRegencies, loadDistricts, loadVillages } = useWilayah();
  const [provKode, setProvKode] = useState(value.provinceKode || "");
  const [regKode, setRegKode] = useState(value.regencyKode || "");
  const [distKode, setDistKode] = useState(value.districtKode || "");

  // Edit mode: only names are stored, resolve codes by name once lists load.
  useEffect(() => {
    if (!value.province || provKode || !provinces.length) return;
    const p = provinces.find((x) => x.nama === value.province);
    if (!p) return;
    setProvKode(p.kode);
    loadRegencies(p.kode).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);

  useEffect(() => {
    if (!value.regency || regKode || !regencies.length) return;
    const r = regencies.find((x) => x.nama === value.regency);
    if (!r) return;
    setRegKode(r.kode);
    loadDistricts(r.kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regencies]);

  useEffect(() => {
    if (!value.district || distKode || !districts.length) return;
    const d = districts.find((x) => x.nama === value.district);
    if (!d) return;
    setDistKode(d.kode);
    loadVillages(d.kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  const findName = (list: WilayahItem[], kode: string) => list.find((x) => x.kode === kode)?.nama || "";

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm disabled:bg-zinc-50";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Provinsi *</span>
        <select
          value={provKode}
          onChange={(e) => {
            const k = e.target.value;
            setProvKode(k);
            setRegKode("");
            setDistKode("");
            const name = findName(provinces, k);
            onChange({ province: name, regency: "", district: "", village: "", postal_code: "", provinceKode: k, regencyKode: "", districtKode: "", villageKode: "" });
            loadRegencies(k);
          }}
          className={inputCls}
        >
          <option value="">{loading.prov ? "Memuat..." : "Pilih Provinsi"}</option>
          {provinces.map((p) => (
            <option key={p.kode} value={p.kode}>{p.nama}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Kota/Kabupaten *</span>
        <select
          value={regKode}
          onChange={(e) => {
            const k = e.target.value;
            setRegKode(k);
            setDistKode("");
            const name = findName(regencies, k);
            onChange({ ...value, regency: name, district: "", village: "", postal_code: value.postal_code, regencyKode: k, districtKode: "", villageKode: "" });
            loadDistricts(k);
          }}
          disabled={!provKode || loading.reg}
          className={inputCls}
        >
          <option value="">{loading.reg ? "Memuat..." : "Pilih Kota/Kabupaten"}</option>
          {regencies.map((r) => (
            <option key={r.kode} value={r.kode}>{r.nama}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Kecamatan *</span>
        <select
          value={distKode}
          onChange={(e) => {
            const k = e.target.value;
            setDistKode(k);
            const name = findName(districts, k);
            onChange({ ...value, district: name, village: "", postal_code: value.postal_code, districtKode: k, villageKode: "" });
            loadVillages(k);
          }}
          disabled={!regKode || loading.dist}
          className={inputCls}
        >
          <option value="">{loading.dist ? "Memuat..." : "Pilih Kecamatan"}</option>
          {districts.map((d) => (
            <option key={d.kode} value={d.kode}>{d.nama}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Kelurahan/Desa *</span>
        <select
          value={value.villageKode || ""}
          onChange={(e) => {
            const k = e.target.value;
            const item = villages.find((v) => v.kode === k);
            onChange({ ...value, village: item?.nama || "", villageKode: k });
          }}
          disabled={!distKode || loading.vill}
          className={inputCls}
        >
          <option value="">{loading.vill ? "Memuat..." : "Pilih Kelurahan/Desa"}</option>
          {villages.map((v) => (
            <option key={v.kode} value={v.kode}>{v.nama} {v.kodepos ? `(${v.kodepos})` : ""}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5 md:col-span-2">
        <span className="text-sm font-medium">Kode Pos *</span>
        <input
          value={value.postal_code}
          onChange={(e) => onChange({ ...value, postal_code: e.target.value.replace(/\D/g, "").slice(0, 5) })}
          placeholder="Contoh: 16421"
          inputMode="numeric"
          maxLength={5}
          className={inputCls}
        />
      </label>
    </div>
  );
}
