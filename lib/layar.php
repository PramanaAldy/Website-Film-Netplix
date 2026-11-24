<?php
declare(strict_types=1);

const LAYAR_GENRES = ['Animasi', 'Fantasi', 'Fiksi Ilmiah', 'Petualangan', 'Komedi', 'Drama', 'Aksi', 'Horor'];
const LAYAR_VIDEO_LIMIT = 512 * 1024 * 1024;
const LAYAR_POSTER_LIMIT = 8 * 1024 * 1024;

function storageDirectory(bool $create = false): ?string
{
    $app = dirname(__DIR__);
    $configured = getenv('LAYAR_STORAGE_PATH');
    $path = $configured ?: dirname($app, 2) . '/layar-data/' . basename($app);
    if (!is_dir($path)) {
        if (!$create && !file_exists($path)) {
            return null;
        }
        if (!mkdir($path, 0700, true) && !is_dir($path)) {
            throw new RuntimeException('Cannot create Layar storage.');
        }
    }

    $realPath = realpath($path);
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? $app);
    if ($realPath === false || $root === false) {
        throw new RuntimeException('Cannot resolve Layar storage paths.');
    }

    $storage = $realPath . DIRECTORY_SEPARATOR;
    $public = rtrim($root, '/\\') . DIRECTORY_SEPARATOR;
    $insidePublicRoot = DIRECTORY_SEPARATOR === '\\'
        ? stripos($storage, $public) === 0
        : strpos($storage, $public) === 0;
    if ($insidePublicRoot) {
        throw new RuntimeException('Layar storage must be outside the document root.');
    }
    return $realPath;
}

function database(bool $create = false): ?PDO
{
    $directory = storageDirectory($create);
    if ($directory === null || (!$create && !is_file($directory . '/layar.sqlite'))) {
        return null;
    }

    $db = new PDO('sqlite:' . $directory . '/layar.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $db->exec('PRAGMA busy_timeout = 5000');
    if ((int) $db->query('PRAGMA user_version')->fetchColumn() === 0) {
        $db->exec('CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS login_attempts (
            ip TEXT PRIMARY KEY,
            attempts INTEGER NOT NULL,
            expires INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS films (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            year INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            genres TEXT NOT NULL,
            video_mime TEXT NOT NULL,
            poster_mime TEXT
        );
        PRAGMA user_version = 1;');
    }
    return $db;
}

function uploadedFilms(?PDO $db): array
{
    if ($db === null) {
        return [];
    }
    $rows = $db->query('SELECT id, title, description, year, duration, genres, poster_mime FROM films ORDER BY rowid DESC')->fetchAll();
    return array_map(static function (array $row): array {
        $seconds = (int) $row['duration'];
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'year' => (int) $row['year'],
            'duration' => $seconds < 60 ? $seconds . ' dtk' : round($seconds / 60) . ' mnt',
            'genres' => json_decode($row['genres'], true, 512, JSON_THROW_ON_ERROR),
            'hasPoster' => $row['poster_mime'] !== null,
        ];
    }, $rows);
}

function mediaUrl(string $id, string $kind): string
{
    return 'media.php?id=' . rawurlencode($id) . '&kind=' . rawurlencode($kind);
}

function postText(string $name): string
{
    return is_string($_POST[$name] ?? null) ? $_POST[$name] : '';
}

function uploadedFile(string $name, int $limit, array $allowedMimes, bool $required = true): ?array
{
    $file = $_FILES[$name] ?? [];
    $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    $label = $name === 'poster' ? 'Poster' : 'Video';
    if ($error === UPLOAD_ERR_NO_FILE && !$required) {
        return null;
    }
    if (in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || ($file['size'] ?? 0) > $limit) {
        throw new InvalidArgumentException($label . ' melebihi batas ' . ($limit / 1024 / 1024) . ' MB.');
    }
    if ($error !== UPLOAD_ERR_OK || !is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name'])) {
        throw new InvalidArgumentException($error === UPLOAD_ERR_NO_FILE ? 'Pilih video yang akan diunggah.' : 'Unggahan ' . strtolower($label) . ' gagal. Silakan coba lagi.');
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, $allowedMimes, true)) {
        throw new InvalidArgumentException($name === 'poster' ? 'Poster harus berupa JPG, PNG, atau WebP.' : 'Video harus berupa MP4 atau WebM.');
    }
    if ($name === 'poster') {
        $image = @getimagesize($file['tmp_name']);
        if ($image === false || $image['mime'] !== $mime || $image[0] > 8192 || $image[1] > 8192) {
            throw new InvalidArgumentException('Poster harus berupa gambar yang valid dengan sisi maksimal 8192 piksel.');
        }
    }
    return ['path' => $file['tmp_name'], 'mime' => $mime];
}

function publishFilm(PDO $db): string
{
    $title = trim(postText('title'));
    $description = trim(postText('description'));
    $genreInput = $_POST['genres'] ?? [];
    $year = filter_var(postText('year'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1888, 'max_range' => (int) date('Y') + 1]]);
    $duration = filter_var(postText('duration'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 86400]]);
    if ($title === '' || !mb_check_encoding($title, 'UTF-8') || mb_strlen($title, 'UTF-8') > 120 || preg_match('/[\x00-\x1F\x7F]/', $title)) {
        throw new InvalidArgumentException('Isi judul film dengan maksimal 120 karakter.');
    }
    if ($description === '' || !mb_check_encoding($description, 'UTF-8') || mb_strlen($description, 'UTF-8') > 1200) {
        throw new InvalidArgumentException('Isi sinopsis dengan maksimal 1.200 karakter.');
    }
    if ($year === false || $duration === false) {
        throw new InvalidArgumentException('Isi tahun rilis dan durasi dalam detik dengan benar.');
    }
    if (!is_array($genreInput) || !$genreInput || count($genreInput) > count(LAYAR_GENRES)) {
        throw new InvalidArgumentException('Pilih minimal satu genre.');
    }
    foreach ($genreInput as $genre) {
        if (!in_array($genre, LAYAR_GENRES, true)) {
            throw new InvalidArgumentException('Pilih genre dari pilihan yang tersedia.');
        }
    }
    $genres = array_values(array_unique($genreInput));
    $video = uploadedFile('video', LAYAR_VIDEO_LIMIT, ['video/mp4', 'video/webm']);
    $poster = uploadedFile('poster', LAYAR_POSTER_LIMIT, ['image/jpeg', 'image/png', 'image/webp'], false);

    $id = 'upload-' . bin2hex(random_bytes(16));
    $directory = storageDirectory(true);
    $moved = [];
    try {
        foreach (array_filter(['video' => $video, 'poster' => $poster]) as $kind => $file) {
            $destination = $directory . '/' . $id . '-' . $kind;
            if (!move_uploaded_file($file['path'], $destination)) {
                throw new RuntimeException('Cannot move uploaded file.');
            }
            $moved[] = $destination;
        }

        $insert = $db->prepare('INSERT INTO films (id, title, description, year, duration, genres, video_mime, poster_mime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$id, $title, $description, $year, $duration, json_encode($genres, JSON_THROW_ON_ERROR), $video['mime'], $poster['mime'] ?? null]);
    } catch (Throwable $error) {
        foreach ($moved as $file) {
            unlink($file);
        }
        throw $error;
    }
    return $id;
}
