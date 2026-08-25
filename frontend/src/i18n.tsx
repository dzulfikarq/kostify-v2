"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Lang = "id" | "en";

// [indonesian, english] — Indonesian uses short, warm, everyday words
const DICT: Record<string, [string, string]> = {
  // nav
  "nav.utama": ["MENU UTAMA", "MAIN MENU"],
  "nav.admin": ["ADMIN", "ADMIN"],
  "nav.dashboard": ["Beranda", "Dashboard"],
  "nav.kostsaya": ["Kost Saya", "My Kosts"],
  "nav.bookings": ["Booking Masuk", "Bookings"],
  "nav.kontrak": ["Kontrak Sewa", "Contracts"],
  "nav.verifikasi": ["Verifikasi", "Verification"],
  "nav.masterkost": ["Semua Kost", "All Kosts"],
  "nav.users": ["Pengguna", "Users"],

  // common
  "c.kembali": ["← Kembali", "← Back"],
  "c.batal": ["Batal", "Cancel"],
  "c.simpan": ["Simpan", "Save"],
  "c.hapus": ["Hapus", "Delete"],
  "c.edit": ["Ubah", "Edit"],
  "c.detail": ["Lihat Detail", "View Details"],
  "c.cari": ["Cari", "Search"],
  "c.cari_halaman": ["Cari halaman...", "Search pages..."],
  "c.reset": ["Atur Ulang", "Reset"],
  "c.tutup": ["Tutup", "Close"],
  "c.muat": ["Sedang memuat...", "Loading..."],
  "c.gagal": ["Waduh, ada kendala. Coba lagi ya.", "Oops, something went wrong. Please try again."],
  "c.konfirmasi": ["Ya, Lanjutkan", "Yes, Continue"],
  "c.sebelumnya": ["Sebelumnya", "Previous"],
  "c.berikutnya": ["Selanjutnya", "Next"],
  "c.hal": ["Halaman", "Page"],
  "c.dari": ["dari", "of"],
  "c.semua": ["Semua", "All"],
  "c.aktif": ["Aktif", "Active"],
  "c.nonaktif": ["Nonaktif", "Inactive"],
  "c.lihat": ["Lihat", "View"],

  // confirm dialog
  "cd.perhatian": ["Konfirmasi Dulu Ya", "Please Confirm"],
  "cd.yakin": ["Apakah kamu yakin?", "Are you sure?"],

  // dashboard home
  "dash.salam.pagi": ["Selamat pagi", "Good morning"],
  "dash.salam.siang": ["Selamat siang", "Good afternoon"],
  "dash.salam.malam": ["Selamat malam", "Good evening"],
  "dash.sub": ["Ini ringkasan kost kamu hari ini.", "Here's a summary of your kosts today."],
  "dash.total_kost": ["Jumlah Kost", "Total Kosts"],
  "dash.booking_pending": ["Booking Menunggu", "Pending Bookings"],
  "dash.kamar_occupied": ["Kamar Terisi", "Occupied Rooms"],
  "dash.kontrak_aktif": ["Penyewa Aktif", "Active Tenants"],

  // kosts list
  "kost.judul": ["Kost Saya", "My Kosts"],
  "kost.sub": ["Kelola semua kosanmu di satu tempat.", "Manage all your kosts in one place."],
  "kost.tambah": ["+ Tambah Kost", "+ Add Kost"],
  "kost.cari_ph": ["Cari nama atau kota...", "Search name or city..."],
  "kost.kolom.kost": ["Kost", "Kost"],
  "kost.kolom.kota": ["Kota", "City"],
  "kost.kolom.gender": ["Untuk", "For"],
  "kost.kolom.status": ["Status", "Status"],
  "kost.kolom.aksi": ["Aksi", "Actions"],
  "kost.kelola": ["Kelola", "Manage"],
  "kost.kosong.judul": ["Belum Ada Kost", "No Kosts Yet"],
  "kost.kosong.sub": ["Yuk daftarkan kost pertamamu. Nanti dicek dulu oleh tim kami maksimal 1×24 jam.", "Register your first kost. Our team will review it within 1×24 hours."],
  "kost.buat": ["Daftarkan Kost", "Register Kost"],
  "status.pending": ["Menunggu Dicek", "Pending Review"],
  "status.verified": ["Disetujui", "Approved"],
  "status.rejected": ["Ditolak", "Rejected"],

  // new kost
  "new.judul": ["Daftarkan Kost Baru", "Register New Kost"],
  "new.sub": ["Isi info kostmu di bawah ini. Tim kami akan mengecek dulu sebelum kostmu tampil.", "Fill in your kost details below. Our team will review it before it goes live."],
  "new.info": ["Info Kost", "Kost Information"],
  "new.badge": ["Nanti dicek admin dulu ya", "Will be reviewed by admin first"],
  "new.nama": ["Nama Kost *", "Kost Name *"],
  "new.nama_ph": ["Contoh: Kost Bahagia", "e.g. Happy Kost"],
  "new.wilayah": ["Wilayah *", "Area *"],
  "new.alamat": ["Alamat Lengkap (nama jalan & nomor)", "Full Address (street & number)"],
  "new.alamat_ph": ["Contoh: Jl. Merdeka No. 123", "e.g. Jl. Merdeka No. 123"],
  "new.deskripsi": ["Ceritakan Tentang Kostmu", "Describe Your Kost"],
  "new.deskripsi_ph": ["Contoh: dekat kampus, lingkungan aman dan tenang...", "e.g. near campus, safe and quiet neighborhood..."],
  "new.peruntukan": ["Untuk Siapa?", "For Whom?"],
  "new.fasilitas": ["Fasilitas (tulis dipisah koma)", "Facilities (comma separated)"],
  "new.fasilitas_ph": ["contoh: wifi, ac, parkir", "e.g. wifi, ac, parking"],
  "new.foto": ["Foto Kost", "Kost Photos"],
  "new.foto_sub": ["Foto JPG/PNG, paling besar 2MB. Foto bikin kost lebih cepat disewa!", "JPG/PNG photos, max 2MB each. Photos help your kost rent faster!"],
  "new.foto_pilih": ["Klik di sini untuk pilih foto", "Click here to choose photos"],
  "new.upload": ["Sedang mengunggah...", "Uploading..."],
  "new.batal": ["Batal", "Cancel"],
  "new.ajukan": ["Kirim untuk Dicek", "Submit for Review"],
  "new.mengajukan": ["Mengirim...", "Submitting..."],
  "new.sukses": ["Terima kasih! Kost sudah kami terima dan akan dicek oleh tim kami.", "Thank you! Your kost has been received and will be reviewed."],
  "new.cd_title": ["Kirim kost ini?", "Submit this kost?"],
  "new.cd_desc": ["Pastikan semua data sudah benar. Setelah dikirim, tim kami akan mengeceknya.", "Make sure everything is correct. Our team will review after submission."],
  "new.foto_ok": ["Foto berhasil diunggah", "Photo uploaded"],
  "new.foto_gagal": ["Gagal mengunggah foto — gunakan JPG/PNG/WebP ya", "Upload failed — please use JPG/PNG/WebP"],
  "new.maks2mb": ["Ukuran foto maksimal 2MB ya", "Photo must be under 2MB"],

  // manage kost
  "mgr.edit_judul": ["Ubah Info Kost", "Edit Kost Info"],
  "mgr.kamar": ["Kamar", "Rooms"],
  "mgr.kamar_kosong": ["Belum ada kamar — tambahkan di bawah ya", "No rooms yet — add one below"],
  "mgr.tambah_kamar": ["Tambah Kamar", "Add Room"],
  "mgr.nomor_ph": ["Nomor kamar (contoh: A101)", "Room number (e.g. A101)"],
  "mgr.harga_ph": ["Harga per bulan", "Price per month"],
  "mgr.fasilitas_ph": ["fasilitas: ac, wifi", "facilities: ac, wifi"],
  "mgr.tunggu": ["Sedang menunggu pengecekan oleh tim kami", "Waiting for our team's review"],
  "mgr.cd_simpan": ["Simpan perubahan?", "Save changes?"],
  "mgr.cd_hapus_kamar": ["Hapus kamar ini?", "Delete this room?"],

  // bookings
  "bk.judul": ["Booking Masuk", "Incoming Bookings"],
  "bk.sub": ["Orang yang ingin menyewa kamarmu. Cek dulu, baru setujui ya.", "People who want to rent your rooms. Review first, then approve."],
  "bk.setujui": ["Setujui", "Approve"],
  "bk.tolak": ["Tolak", "Reject"],
  "bk.penyeua_modal": ["Setujui Booking", "Approve Booking"],
  "bk.approve_sub": ["Pilih tanggal mulai sewa dan lamanya. Setelah disetujui, kontrak otomatis dibuat.", "Choose start date and duration. A contract is created automatically once approved."],
  "bk.tgl_mulai": ["Tanggal Mulai", "Start Date"],
  "bk.durasi": ["Lama Sewa", "Duration"],
  "bk.bulan": ["bulan", "month(s)"],
  "bk.cd_tolak": ["Tolak booking ini?", "Reject this booking?"],
  "bk.cd_tolak_desc": ["Penyewa akan mendapat kabar bahwa bookingnya ditolak.", "The tenant will be notified of the rejection."],
  "bk.kolom.kamar": ["Kamar", "Room"],
  "bk.kolom.penyewa": ["Penyewa", "Tenant"],
  "bk.kolom.status": ["Status", "Status"],
  "bk.kolom.expired": ["Berlaku Sampai", "Valid Until"],
  "bk.kosong_pending": ["Belum ada booking masuk", "No pending bookings"],
  "bk.kosong_pending_sub": ["Sabar ya, kalau ada yang mau sewa akan muncul di sini.", "Don't worry, new requests will appear here."],

  // contracts
  "ct.judul": ["Kontrak Sewa", "Rental Contracts"],
  "ct.sub": ["Daftar penyewa yang sedang atau pernah menyewa kamarmu.", "Tenants currently or previously renting your rooms."],
  "ct.akhiri": ["Akhiri", "End"],
  "ct.cd_akhiri": ["Akhiri kontrak ini?", "End this contract?"],
  "ct.cd_akhiri_desc": ["Kamar akan langsung kosong dan bisa disewakan lagi.", "The room will be available again immediately."],
  "ct.berjalan": ["Sedang Berjalan", "Ongoing"],
  "ct.selesai": ["Selesai", "Finished"],
  "ct.kosong": ["Belum ada kontrak", "No contracts yet"],
  "ct.kosong_sub": ["Kontrak dibuat otomatis saat kamu menyetujui booking.", "Contracts are created automatically when you approve a booking."],

  // verification
  "vf.judul": ["Verifikasi Kost", "Kost Verification"],
  "vf.sub": ["Kost baru yang menunggu persetujuan kamu.", "New kosts waiting for your approval."],
  "vf.setujui": ["Setujui", "Approve"],
  "vf.tolak": ["Tolak", "Reject"],
  "vf.alasan_ph": ["Alasan menolak", "Rejection reason"],
  "vf.isi_alasan": ["Tulis dulu alasannya ya", "Please write the reason first"],
  "vf.cd_setuju": ['Setujui "{name}"?', 'Approve "{name}"?'],
  "vf.cd_setuju_desc": ["Kost akan langsung tampil di pencarian.", "The kost will appear in search immediately."],
  "vf.cd_tolak": ['Tolak "{name}"?', 'Reject "{name}"?'],
  "vf.kosong": ["Tidak ada kost yang menunggu", "Nothing waiting for review"],
  "vf.kosong_sub": ["Semua pengajuan sudah kamu proses. Kerja bagus!", "You've processed everything. Great job!"],
  "vf.lihat_master": ["Lihat Semua Kost", "View All Kosts"],
  "vf.kolom.diajukan": ["Diajukan Pada", "Submitted At"],

  // master kost
  "mk.judul": ["Semua Kost", "All Kosts"],
  "mk.sub": ["Semua kost yang terdaftar di aplikasi. Semua aksi butuh konfirmasi dulu.", "Every kost registered in the app. All actions require confirmation."],
  "mk.tambah": ["+ Tambah Kost Manual", "+ Add Manually"],
  "mk.owner": ["Pemilik", "Owner"],
  "mk.cd_hapus": ['Hapus "{name}"?', 'Delete "{name}"?'],
  "mk.cd_hapus_desc": ["Semua kamar & booking ikut terhapus dan tidak bisa dikembalikan!", "All rooms & bookings will be deleted permanently!"],
  "mk.cd_verif": ['Setujui "{name}"?', 'Approve "{name}"?'],
  "mk.cd_nonaktif": ["Matikan kost ini?", "Deactivate this kost?"],
  "mk.cd_aktif": ["Nyalakan kost ini?", "Activate this kost?"],
  "mk.cd_nonaktif_desc": ["Kost tidak akan tampil di pencarian.", "The kost will be hidden from search."],
  "mk.cd_aktif_desc": ["Kost akan tampil kembali di pencarian.", "The kost will appear in search again."],
  "mk.dibuat": ["Dibuat", "Created"],

  // create manual modal (admin)
  "cmn.judul": ["Tambah Kost Manual (Admin)", "Add Kost Manually (Admin)"],
  "cmn.sub": ["Langsung disetujui & aktif", "Instantly approved & active"],

  // users
  "us.judul": ["Kelola Pengguna", "Manage Users"],
  "us.sub": ["Semua orang yang punya akun di aplikasi ini.", "Everyone with an account in this app."],
  "us.buat": ["+ Buat Akun", "+ Create Account"],
  "us.cari_ph": ["Cari nama atau email...", "Search name or email..."],
  "us.kosong": ["Tidak ada pengguna", "No users found"],
  "us.cd_buat": ["Buat akun baru?", "Create new account?"],
  "us.cd_role": ["Ganti peran pengguna ini?", "Change this user's role?"],
  "us.cd_toggle_on": ["Aktifkan pengguna ini?", "Activate this user?"],
  "us.cd_toggle_off": ["Nonaktifkan pengguna ini?", "Deactivate this user?"],
  "us.cd_hapus": ["Hapus pengguna ini?", "Delete this user?"],
  "us.cd_hapus_desc": ["Akun tidak bisa dikembalikan setelah dihapus!", "This account cannot be recovered!"],

  // user detail modal
  "ud.telepon": ["Telepon", "Phone"],
  "ud.status": ["Status", "Status"],
  "ud.terdaftar": ["Terdaftar", "Registered"],
  "ud.id": ["ID Pengguna", "User ID"],

  // profile
  "pf.judul": ["Profil Saya", "My Profile"],
  "pf.edit": ["Ubah Profil", "Edit Profile"],
  "pf.nama": ["Nama", "Name"],
  "pf.telepon": ["Telepon", "Phone"],
  "pf.bergabung": ["Bergabung", "Joined"],
  "pf.sukses": ["Profil berhasil diperbarui", "Profile updated"],
  "pf.logout": ["Keluar", "Log Out"],
  "pf.logging_out": ["Sedang keluar...", "Logging out..."],

  // my bookings (tenant)
  "mb.judul": ["Booking Saya", "My Bookings"],
  "mb.login_first": ["Masuk dulu untuk melihat booking kamu", "Log in to see your bookings"],
  "mb.masuk": ["Masuk", "Log In"],
  "mb.hanya_tenant": ["Halaman ini hanya untuk pencari kos", "This page is for tenants only"],
  "mb.belum": ["Belum ada booking", "No bookings yet"],
  "mb.belum_sub": ["Yuk cari kos impianmu!", "Find your dream kost now!"],
  "mb.cari_kost": ["Cari Kost", "Browse Kosts"],
  "mb.cd_batal": ["Batalkan booking ini?", "Cancel this booking?"],
  "mb.cd_batal_desc": ["Kamar akan langsung tersedia untuk penyewa lain.", "The room will be available for others immediately."],
  "mb.expires": ["Berlaku sampai", "Valid until"],
  "mb.batal": ["Batalkan", "Cancel"],

  // public header/footer
  "ph.cari": ["Cari Kost", "Find Kosts"],
  "ph.booking_saya": ["Booking Saya", "My Bookings"],
  "ph.dashboard": ["Dashboard", "Dashboard"],
  "ph.masuk": ["Masuk", "Log In"],
  "ph.daftar": ["Daftar", "Sign Up"],
  "ph.keluar": ["Keluar", "Log Out"],
  "pf.footer": ["Kostify — tempat cari kos terpercaya. Booking tanpa DP, survei dulu baru deal.", "Kostify — trusted kost finder. Book without deposit, survey first then deal."],

  // landing
  "ph.badge_hero": ["Diverifikasi · Aman · Tanpa DP", "Verified · Safe · No Deposit"],
  "ph.hero_judul_1": ["Cari kost terverifikasi,", "Find verified kosts,"],
  "ph.hero_judul_2": ["booking tanpa ribet", "book without the hassle"],
  "ph.hero_desc": ["Kost telah diverifikasi admin. Booking kamar kosong, tunggu maksimal 3 hari untuk survei & deal langsung — tanpa pembayaran online.", "All kosts are verified by admin. Book an empty room, wait up to 3 days for a survey & deal on-site — no online payment."],
  "ph.search_placeholder": ["Cari kota, nama kost, alamat...", "Search city, kost name, address..."],
  "ph.stat_kost": ["1.200+", "1,200+"],
  "ph.stat_kota": ["15", "15"],
  "ph.stat_rating": ["4.8", "4.8"],
  "ph.kategori": ["Tipe Kost Populer", "Popular Kost Types"],
  "ph.kategori_desc": ["Pilih tipe kost yang sesuai kebutuhan dan preferensi kamu", "Choose the kost type that fits your needs and preferences"],
  "ph.kategori.putri": ["Kost Putri", "Female Only"],
  "ph.kategori.putri_sub": ["Nyaman & aman untuk wanita", "Comfortable & safe for women"],
  "ph.kategori.putra": ["Kost Putra", "Male Only"],
  "ph.kategori.putra_sub": ["Praktis & fungsional", "Practical & functional"],
  "ph.kategori.campur": ["Campur", "Mixed"],
  "ph.kategori.campur_sub": ["Fleksibel untuk semua", "Flexible for everyone"],
  "ph.kategori.exklusif": ["Eksklusif", "Exclusive"],
  "ph.kategori.exklusif_sub": ["Fasilitas premium lengkap", "Full premium facilities"],
  "ph.kost_terbaru": ["Kost Terbaru", "Latest Kosts"],
  "ph.lihat_semua": ["Lihat semua", "View all"],
  "ph.belum_ada_kost": ["Belum ada kost terverifikasi", "No verified kosts yet"],
  "ph.jadilah_pertama": ["Jadilah pemilik pertama yang mendaftarkan kost di Kostify!", "Be the first owner to list a kost on Kostify!"],
  "ph.daftar_kost": ["Daftarkan Kost", "List Your Kost"],
  "ph.mengapa_kostify": ["Kenapa Kostify?", "Why Kostify?"],
  "ph.trust_foto": ["Survei & Foto Asli", "Real Surveys & Photos"],
  "ph.trust_foto_sub": ["Setiap kost diverifikasi tim kami dengan foto asli kamar, fasilitas, dan lingkungan sekitar.", "Every kost is verified by our team with real photos of rooms, facilities, and surroundings."],
  "ph.trust_dp": ["Booking Tanpa DP Ribet", "Book Without Deposit Hassle"],
  "ph.trust_dp_sub": ["Booking gratis, kamar ter-reserve 3 hari. Bayar di lokasi setelah survei cocok.", "Free booking, room held for 3 days. Pay on-site after a satisfying survey."],
  "ph.trust_support": ["Bantuan 24 Jam", "24/7 Support"],
  "ph.trust_support_sub": ["Tim support siap bantu dari pencarian kost sampai kontrak selesai. Kamu tidak sendirian.", "Our support team helps from kost hunting until your contract ends. You're not alone."],
  "ph.cara_kerja": ["Cara Kerja", "How It Works"],
  "ph.cara_kerja_desc": ["Proses booking transparan dan terstruktur, dari cari sampai kontrak aktif", "A transparent, structured booking process from search to active contract"],
  "ph.step1": ["Cari & Booking", "Search & Book"],
  "ph.step1_sub": ["Pilih kamar yang tersedia di kota tujuan. Booking gratis — kamar ter-reserve selama 3 hari.", "Pick an available room in your destination city. Free booking — room held for 3 days."],
  "ph.step2": ["Survei & Deal", "Survey & Deal"],
  "ph.step2_sub": ["Pemilik menghubungi kamu untuk jadwal survei. Cek kamar langsung. Cocok? Deal di tempat.", "The owner contacts you to schedule a survey. Check the room directly. Like it? Deal on-site."],
  "ph.step3": ["Kontrak Aktif", "Contract Active"],
  "ph.step3_sub": ["Booking disetujui, kontrak 1–12 bulan dibuat otomatis. Tinggal pindahan.", "Once approved, a 1–12 month contract is created automatically. Just move in."],
  "ph.testimoni": ["Testimoni", "Testimonials"],
  "ph.testimoni_quote": ["Kostify beneran ngebantu aku nemuin kos dekat kampus tanpa ribet. Booking gratis, survei 3 hari, deal di tempat. Ga perlu DP ke rekening anonim yang bikin deg-dean.", "Kostify really helped me find a kost near campus without hassle. Free booking, 3-day survey, deal on-site. No deposit to anonymous accounts."],
  "ph.cta_title": ["Punya Kost? Daftarkan Gratis!", "Own a Kost? List It Free!"],
  "ph.cta_desc": ["Jangkau ribuan pencari kos. Verifikasi gratis, tanpa biaya tersembunyi, kelola booking dari dashboard yang mudah.", "Reach thousands of kost seekers. Free verification, no hidden fees, manage bookings from an easy dashboard."],
  "ph.daftar_sekarang": ["Daftarkan Kost Sekarang", "List Your Kost Now"],

  // kost detail public
  "kd.fasilitas": ["Fasilitas", "Facilities"],
  "kd.kontak": ["Hubungi Pemilik", "Contact Owner"],
  "kd.pemilik": ["Pemilik", "Owner"],
  "kd.kamar": ["Daftar Kamar", "Room List"],
  "kd.belum_ada": ["Kost tidak ditemukan atau belum disetujui", "Kost not found or not yet approved"],
  "kd.kembali_daftar": ["Kembali ke daftar", "Back to list"],
  "kd.belum_ada_kamar": ["Belum ada kamar", "No rooms yet"],
  "kd.cd_booking": ["Booking kamar {room}?", "Book room {room}?"],
  "kd.cd_booking_desc": ["Rp {price}/bulan — reservasi berlaku 3 hari menunggu jawaban pemilik.", "Rp {price}/month — reservation holds for 3 days awaiting owner's answer."],
  "kd.booking_sekarang": ["Booking Sekarang", "Book Now"],
  "kd.login_dulu": ["Masuk dulu ya sebagai pencari kos", "Please log in as a tenant first"],
  "kd.hanya_tenant": ["Hanya pencari kos yang bisa booking", "Only tenants can book"],
  "kd.booking_sukses": ["Yeay! Booking berhasil — tunggu konfirmasi pemilik ya (maks 3 hari).", "Yay! Booked — please wait for the owner's confirmation (max 3 days)."],

  // auth
  "au.selamat_datang": ["Selamat Datang Kembali", "Welcome Back"],
  "au.masuk_sub": ["Masuk untuk lanjut cari & kelola kost.", "Log in to continue managing kosts."],
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LangCtx>({ lang: "id", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("kostify-lang") as Lang | null) : null;
    if (saved === "en" || saved === "id") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("kostify-lang", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const pair = DICT[key];
      let s = pair ? pair[lang === "id" ? 0 : 1] : key;
      if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.replace(`{${k}}`, String(v))));
      return s;
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

// Simple ID/EN pill toggle for headers.
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 text-xs font-semibold ${className}`}>
      {(["id", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 uppercase transition ${lang === l ? "bg-[#8550e6] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
