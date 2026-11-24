# Layar

Layar adalah aplikasi web berbahasa Indonesia untuk menjelajahi dan menonton koleksi 17 film pendek. Antarmukanya responsif dan memakai identitas visual Layar.

## Jalankan di Laragon

1. Jalankan Apache dari Laragon.
2. Buka [Layar di localhost](http://localhost/NETFLIX/).
3. Pilih **Putar Film** di Beranda, atau pilih judul dari **Semua Film**.

Apache menyajikan aplikasi dari folder proyek. Film Blender diputar dari kanal resminya melalui internet, sedangkan film unggahan diputar dari Laragon. **Daftar Saya**, **Riwayat**, dan posisi pemutaran tersimpan di `localStorage` pada peramban dan alamat situs yang sama.

## Admin dan unggahan video

1. Buka [Admin Layar](http://localhost/NETFLIX/admin.php), atau pilih **Admin** di bagian bawah katalog.
2. Buat kata sandi admin minimal 12 karakter saat pertama kali membuka halaman dari localhost. Pada kunjungan berikutnya, gunakan kata sandi itu untuk masuk.
3. Isi judul, tahun, genre, dan sinopsis. Pilih video **MP4 atau WebM** maksimal **512 MB**. Durasi biasanya terisi dari file video dan bisa diisi dalam detik jika diperlukan. Anda juga bisa memilih poster JPG, PNG, atau WebP maksimal **8 MB**.
4. Pilih **Unggah dan publikasikan**. Film muncul di **Baru di Layar** dan **Semua Film**, serta tersedia melalui pencarian dan filter genre.

Admin membutuhkan PHP dengan `pdo_sqlite`, `fileinfo`, dan `mbstring`. Data admin dan unggahan disimpan di `D:/laragon/layar-data/NETFLIX/` pada instalasi ini. Untuk instalasi lain, `LAYAR_STORAGE_PATH` dapat menunjuk ke folder yang dapat ditulis PHP di luar document root Apache. Gunakan pengaturan `upload_max_filesize` minimal `512M` dan `post_max_size` yang lebih besar dari kapasitas gabungan video dan poster, misalnya `530M`.

## Penerapan RUSH

RUSH di proyek ini ditafsirkan sebagai pembuatan prototipe cepat dalam tiga iterasi.

1. **Katalog.** Susun data film, beranda, tampilan detail, pencarian, dan filter genre.
2. **Tontonan.** Hubungkan pemutar ke video resmi. Tambahkan daftar simpan, riwayat, dan lanjutkan dari posisi terakhir.
3. **Verifikasi.** Jalankan melalui Apache di Laragon dan periksa alur desktop serta seluler.

`catalog.js` berisi data untuk menambah atau memperbarui film. Poster memakai nama yang sama dengan `id` film dan disimpan di `assets/art/`.

## Kredit

- Film © Blender Foundation. Setiap detail film menyertakan tautan ke video resmi. [Katalog Blender Studio](https://studio.blender.org/films/), [ketentuan lisensi](https://studio.blender.org/remixing/)
- Ilustrasi WebP di `assets/art/` dibuat menggunakan ImageGen bawaan. Brief utamanya adalah gambar lebar **Spring** dengan gadis penggembala di hutan pegunungan, gambar lebar **CHARGE** dengan teknisi dan robot di fasilitas energi, gambar lebar **Sintel** dengan pengembara dan naga kecil di punggung gunung, serta kotak ilustrasi poster film pendek tanpa teks. Poster **WING IT!** menampilkan kucing dan anak anjing di dalam roket rakitan.
- Font Inter dan Barlow Condensed disertai lisensi di `assets/fonts/`.

<details>
<summary>Prompt ilustrasi</summary>

**Spring**

```text
Use case: stylized-concept. Create a wide 16:9 cinematic key art background for an independent streaming service featuring the Blender Open Movie Spring (2019), in tactile high-end 3D animation film still style. Panoramic enchanted alpine woodland, slanting bank of mossy giant roots and deep evergreen ferns. On the RIGHT third only, a young alpine shepherd girl with short dark bob hair, fur-lined hooded coat, a wooden staff, small brown scruffy sheepdog at her feet, looking upward toward a gentle gold-green shaft of sunlight reaching the forest floor. The scene is richly detailed, selectively sharp, natural cinematic chiaroscuro, volumetric mist, backlit yellow-green foliage, dew in grasses. Strongest key light and focal subject on right half. Left 44% dark forest in shadow as negative space, no bright distractions there, subtle trees and mist filling entire canvas. Green and deep teal palette with warm chartreuse highlights. Widescreen hero background, immersive and atmospheric rather than childish. No writing, no letters, no logos, no borders, no watermark.
```

**Kumpulan poster**

```text
Use case: stylized-concept. Design one edge-to-edge image atlas of exactly TEN film poster illustrations as a precisely evenly divided grid with 5 columns and 2 rows, 10 equally sized tall panels (image total landscape aspect ratio 5:3 if possible). No gaps, margins, outlines, or gutters whatsoever. Each of the ten bordered-by-its-neighbor cells is an entirely distinct vertical cinematic movie artwork, with no elements crossing its edges. Subjects centered and concentrated in each panel's upper two-thirds, darker unobtrusive foreground in bottom third where separate HTML lettering will be laid. NO text, logos, letters, watermark or typography. Row 1 left to right: (1) CHARGE, a rugged gray-haired cyberpunk man staring toward camera in rainy futuristic night with red signage glow and deep violet, photographic; (2) SINTEL, a red-haired traveler in a cape facing away toward snow mountains and a dragon silhouette in a pale blue avalanche valley, oil painted animation; (3) COSMOS LAUNDROMAT, a lone scruffy dark sheep on a rugged rocky green cliff amid violently swirling magenta and orange cloud storm, stylized CGI; (4) CAMINANDES, an adorable brown llama with big eyes in snow-covered Patagonian mountains under clear turquoise sky, bright stylized CGI; (5) TEARS OF STEEL, a lone woman with a bright yellow scarf on a rubble strewn bridge in misty futuristic Amsterdam, cool gray-blue with red sparks, photoreal. Row 2 left to right: (6) SPRING, a small hooded shepherd girl and little dog in dense luminous moss forest, green-gold atmospheric stylized CGI; (7) BIG BUCK BUNNY, a giant light gray rabbit in a sunny tall-grass meadow with butterflies and yellow flowers lush golden afternoon animation; (8) ELEPHANTS DREAM, two human silhouettes deep inside a surreal mechanical art deco factory with copper pipes lurid amber and black shadows; (9) WING IT, a flamboyant purple bird with orange goggles high in a large colorful orange and pink sky, animated; (10) COFFEE RUN, dynamic monorail lines with a young cafe courier wearing an orange overshirt sprinting with a coffee cup against a peach and coral geometric city with dark plum shadows, CGI animation. Make it stylized like film festival key art, intentional professional art direction, clear focal hierarchy in each cell. Exactly 5 across and 2 down. Total landscape composition.
```

**CHARGE**

```text
Use case: stylized-concept. One cinematic 16:9 panoramic streaming service hero background inspired by CHARGE, a futuristic science fiction short. On the far right, a rugged gray-bearded older technician in a dark knit cap crouches beside a glowing electric blue battery terminal as a damaged service robot with a magenta display looms behind him. The ruined energy facility at night has rain glinting against practical deep purple and dark blue lights, believable worn metal texture, rich cinematic shadows. Left 45% is the quiet, deeply shadowed interior of the same facility and stays dark enough for separate off-white website text. Right third holds the visual focus. Realistic tactile 3D animated film still, cinematic chiaroscuro, evocative color. No text, title, typography, graphic overlays, watermarks, logos, borders or black bars.
```

**Sintel**

```text
Use case: stylized-concept. One cinematic 16:9 panoramic streaming service hero background inspired by Sintel. On the RIGHT third only, a weary red-haired female adventurer in an earth-gray cape and her baby dragon pause on a dramatic snowy rocky ridge, a few red strands bright in the wind. An alpine winter landscape, blue-white distant crags emerging from snow mist, snow and ice in dark gullies. The left 46% is naturally shielded by a dark slate rock wall with deeply shaded blue light, designed for later off-white website typography. Characters are side lit and isolated with subtle backlight, tones of ice blue, dark slate, and copper hair. Tactile cinematic 3D animation feature film key art. No writing, logos, signage, watermark, borders or black bars.
```

**WING IT!**

```text
Use case: stylized-concept. Single vertical cinematic poster art for the independent animated short WING IT!. A fastidious angular orange cat and a jovial puppy blast off side by side in a comically homemade tin rocket, against a dramatic peach, orange, and plum sunset over a modest neighborhood, broad kinetic hand-painted clouds. Expressive stylized character design, mid-century cartoon influence with textured lighting, excellent silhouette close to the center of upper two-thirds. Lower quarter falls gently into clean darker plum shadows to support later lettering. 2:3 vertical full-bleed, no words, letters, marks, logo, or borders.
```

**Kumpulan poster Baru di Layar**

```text
+Use case: stylized-concept. Create a single square 4:3 landscape atlas with exactly 4 columns and 2 rows of equal portrait film poster paintings, tight edge-to-edge, no gaps or frames. Every separate cell is a vertical 2:3 cover, centered focal action in the upper two thirds and a gently darkened foreground low in the frame for website typography. No words, writing, numbers, letters, logos or watermarks anywhere. Cinematic range of colors and tones, recognizable subject silhouettes. Top row left to right: (1) Singularity, a curious small white space creature with luminous eyes on jagged icy terrain beneath an immense star-blue and lavender galactic vortex, painterly watercolor fantasy. (2) Sprite Fright, two expressive tiny mischievous mushroom folk with red caps and round cream-colored faces close to camera beside deep ferns and a distant flashlight beam in a dark British forest, textured 3D animation. (3) HERO, an angular young traveler with swept dark hair and a dark ochre scarf, a weathered futuristic settlement in the distance, dramatic russet and golden sunset, expressively inked 2D adventure animation. (4) The Daily Dweebs, a small charming brown-and-white dog with floppy ears at the front of a nostalgic 1950s suburban yard, rich mustard and mint tones, expressive stylized animation. Bottom row left to right: (5) Agent 327, a smartly dressed 1960s spy in black suit and thick black-rimmed glasses, vintage detective atmosphere in a small dusky Amsterdam barbershop, teal shadows and shafts of amber light. (6) Glass Half, two colorful quirky flat 2D cartoon critics gesturing expressively at an abstract work in a museum gallery, purple and coral geometric composition. (7) Gran Dillama, an expressive sandy llama nervously facing an empty road that divides a high-altitude desert landscape with brown rocks and distant blue mountains, warm sandy dusk and vivid clear stylized animation. (8) Generic cactus and rocks in golden sunlight. Exactly four even columns, two even rows.
```

</details>
"# Website-Film-Netplix" 
