const originalFilms = [
  {
    id: 'charge', title: 'CHARGE', year: 2022, duration: '4 mnt', genres: ['Fiksi Ilmiah', 'Animasi'],
    description: 'Di masa depan yang kehabisan energi, seorang pria menyusup ke sebuah fasilitas untuk mencari baterai yang bisa menyelamatkan nyawa.',
    color: '#583a5d', hero: 'hero-charge.webp', focus: '52% 38%', mobileFocus: '94% 50%',
    source: '1AKMruUNPJQQQ4bvtHYVZQ', file: '70528f27-fd51-479f-8146-abb5a7a81fff-720',
  },
  {
    id: 'sintel', title: 'Sintel', year: 2010, duration: '15 mnt', genres: ['Petualangan', 'Fantasi', 'Animasi'],
    description: 'Seorang pengembara muda melintasi pegunungan bersalju untuk menemukan kembali naga kecil yang pernah ia rawat.',
    color: '#354f66', hero: 'hero-sintel.webp', focus: '50% 33%', mobileFocus: '100% 50%',
    source: '2PcJe5aZqozRvH7MJ8BTmC', file: '0eb052d0-fd51-43e6-aa33-ecdbf77a5d40-480',
  },
  {
    id: 'cosmos', title: 'Cosmos Laundromat', year: 2015, duration: '12 mnt', genres: ['Fantasi', 'Drama', 'Animasi'],
    description: 'Franck, seekor domba yang kesepian, bertemu orang asing yang menawarkan kesempatan untuk menjalani hidup yang sama sekali berbeda.',
    color: '#713858', source: 'wfW3bDTkUhQKRnEfT9Wpeq', file: 'f507dfdc-e73e-45a4-9778-d758cbe1ce96-480',
  },
  {
    id: 'caminandes', title: 'Caminandes', subtitle: 'Llamigos', year: 2016, duration: '3 mnt', genres: ['Komedi', 'Petualangan', 'Animasi'],
    description: 'Di tengah musim dingin Patagonia, seekor llama bernama Koro dan seekor penguin memperebutkan buah beri terakhir.',
    color: '#285e6b', source: '5ruRYckTcQMTMQvyqMnVsr', file: '23f3ef79-15dc-44c5-aa45-cf92e78a4509-480',
  },
  {
    id: 'tears', title: 'Tears of Steel', year: 2012, duration: '12 mnt', genres: ['Fiksi Ilmiah', 'Drama'],
    description: 'Sekelompok pejuang dan ilmuwan kembali ke masa lalu di Amsterdam untuk mencegah bencana yang mengancam masa depan.',
    color: '#41535d', source: 'hs1zJY8mdr3iH2JNmxpeGV', file: '8533ea43-4271-4a57-9694-e9d0b35e1aa1-480',
  },
  {
    id: 'spring', title: 'Spring', year: 2019, duration: '8 mnt', genres: ['Fantasi', 'Petualangan', 'Animasi'],
    description: 'Seorang gadis penggembala dan anjingnya menjumpai roh purba di pegunungan demi membawa musim semi kembali.',
    color: '#395d39', hero: 'hero-spring.webp', focus: '50% 40%', mobileFocus: '99% 50%',
    source: '8B5QmoLSS3mWJ4fmZZu3Ye', file: '3d95fb3d-c866-42c8-9db1-fe82f48ccb95-480',
  },
  {
    id: 'bunny', title: 'Big Buck Bunny', year: 2008, duration: '10 mnt', genres: ['Komedi', 'Animasi'],
    description: 'Seekor kelinci raksasa yang cinta damai menyusun akal setelah tiga pengacau kecil merusak hari cerahnya.',
    color: '#7a663a', source: 'pAQiVCgv2CsLg79KKXUoMw', file: 'bf1f3fb5-b119-4f9f-9930-8e20e892b898-480',
  },
  {
    id: 'elephants', title: 'Elephants Dream', year: 2006, duration: '11 mnt', genres: ['Fiksi Ilmiah', 'Fantasi', 'Animasi'],
    description: 'Emo dan Proog menjelajahi sebuah mesin raksasa, tetapi keduanya melihat dunia di dalamnya dengan cara yang berbeda.',
    color: '#74532c', source: 'rhMeBiBURa2KgsAfkC6kda', file: 'cccc3e60-0291-4ecc-aa56-39b2e2c7d0d5-480',
  },
  {
    id: 'wing-it', title: 'WING IT!', year: 2023, duration: '4 mnt', genres: ['Komedi', 'Animasi'],
    description: 'Seekor kucing yang suka mengatur bertemu anak anjing yang bertekad menerbangkan roket buatannya sendiri.',
    color: '#784859', source: 'pkDDcE7HiLU3UTGmRV1nJG', file: '1be4c93c-1fd2-498d-adc7-50126823033e-480',
  },
  {
    id: 'coffee', title: 'Coffee Run', year: 2020, duration: '3 mnt', genres: ['Drama', 'Animasi'],
    description: 'Dengan secangkir kopi sebagai teman, seorang perempuan berlari melewati berbagai kenangan dalam hidupnya.',
    color: '#7d5043', source: 'xymLD6rkpHNug3fzzMyhmZ', file: 'ff8fe61b-026f-4f07-b66b-2a790d6f6ab1-480',
  },
];

const recentAdditions = [
  {
    id: 'singularity', title: 'Singularity', year: 2026, duration: '7 mnt', genres: ['Fiksi Ilmiah', 'Petualangan', 'Animasi'],
    description: 'Setelah gejolak kosmik menelan rumah esnya, makhluk kecil mencari perlindungan bersama kawanan bercahaya yang dijaga sosok misterius.',
    color: '#3c427a', source: '4pSeQCu9XXz9wWMh5gTNMf', file: 'f91fd74e-a81f-48ec-b92b-c9504ac46e31-1080',
  },
  {
    id: 'sprite-fright', title: 'Sprite Fright', year: 2021, duration: '11 mnt', genres: ['Horor', 'Komedi', 'Animasi'],
    description: 'Sekelompok remaja masuk ke hutan terpencil dan bertemu makhluk jamur mungil. Saat malam tiba, mereka sadar bahwa hutan itu punya aturan sendiri.',
    color: '#445332', source: 'mziZQzmf95pGMSqk7BPZvi', file: 'a69d68a5-a0e0-4a80-9d66-49f093c97aaf-720',
    license: 'https://studio.blender.org/projects/sprite-fright/pages/about/#licensing',
  },
  {
    id: 'hero', title: 'HERO', year: 2018, duration: '4 mnt', genres: ['Petualangan', 'Animasi'],
    description: 'Seorang pemuda menghadapi ujian yang memaksanya memilih sendiri apa artinya menjadi pahlawan.',
    color: '#79472f', source: '8KerEHuf8qyGtCVoAoEdzQ', file: '6c79205c-bd3a-42b5-a8a2-ce7a2a166154-536',
  },
  {
    id: 'daily-dweebs', title: 'The Daily Dweebs', year: 2017, duration: '1 mnt', genres: ['Komedi', 'Animasi'],
    description: 'Kenali Dixey, anjing kecil yang menjalani hari penuh kejutan di kawasan perumahan Amerika tahun 1950-an.',
    color: '#6d7144', source: 'gdfAeNysimipmpo7AbgaTp', file: '7b2eff2a-35f2-4403-9d88-d0dd6e4b5ba1-480',
  },
  {
    id: 'agent-327', title: 'Agent 327', subtitle: 'Operation Barbershop', year: 2017, duration: '4 mnt', genres: ['Aksi', 'Komedi', 'Animasi'],
    description: 'Seorang agen rahasia Belanda mencari petunjuk di sebuah barbershop dan berhadapan dengan musuh bebuyutannya, Boris Kloris.',
    color: '#355653', source: '5JoZUZzbUdpNqGXpd5QJ5T', file: '264ff760-803e-430e-8d81-15648e904183-480',
    license: 'https://studio.blender.org/projects/agent-327/pages/about/#licensing',
  },
  {
    id: 'glass-half', title: 'Glass Half', year: 2015, duration: '3 mnt', genres: ['Komedi', 'Animasi'],
    description: 'Dua kritikus seni amatir berdebat di sebuah galeri, sampai satu karya akhirnya membuat mereka sependapat.',
    color: '#744f6b', source: 'dnayqfMS4PAE9pSZ3kyVUb', file: '64222c8a-c4c7-4b3b-9850-7fb2078edcf6-480',
  },
  {
    id: 'gran-dillama', title: 'Caminandes', subtitle: 'Gran Dillama', year: 2013, duration: '2 mnt', genres: ['Komedi', 'Petualangan', 'Animasi'],
    description: 'Koro si llama melihat makanan di seberang pagar listrik dan mencoba berbagai cara untuk mencapainya.',
    color: '#795439', source: 'x3QKwgFXGZQ7yvCTD2wHJA', file: 'fb70d459-48d2-4db5-adba-813c84f9200a-480',
  },
];

const filmCatalog = [...originalFilms, ...recentAdditions];
