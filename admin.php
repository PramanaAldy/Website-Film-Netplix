<?php
declare(strict_types=1);

require __DIR__ . '/lib/layar.php';

ini_set('display_errors', '0');
ini_set('session.use_strict_mode', '1');
session_name('layar_admin');
$cookie = [
    'path' => rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/admin.php')), '/') . '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
];
session_set_cookie_params($cookie);
session_start();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; img-src 'self' blob:; media-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'");

class AdminRequestError extends RuntimeException {}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirectToAdmin(): void
{
    header('Location: admin.php', true, 303);
    exit;
}

function jsonReply(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function startAdminSession(): void
{
    session_regenerate_id(true);
    $_SESSION = ['admin' => true, 'csrf' => bin2hex(random_bytes(32))];
}

function checkPassword(PDO $db, string $hash, string $password, string $ip): void
{
    $now = time();
    $lookup = $db->prepare('SELECT attempts FROM login_attempts WHERE ip = ? AND expires > ?');
    $lookup->execute([$ip, $now]);
    $attempts = (int) $lookup->fetchColumn();
    $lookup->closeCursor();
    if ($attempts >= 6) {
        throw new AdminRequestError('Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.', 429);
    }
    if (strlen($password) > 72 || strpos($password, "\0") !== false || !password_verify($password, $hash)) {
        $db->prepare('DELETE FROM login_attempts WHERE expires <= ?')->execute([$now]);
        $record = $db->prepare('INSERT INTO login_attempts (ip, attempts, expires) VALUES (?, 1, ?)
            ON CONFLICT(ip) DO UPDATE SET attempts = attempts + 1');
        $record->execute([$ip, $now + 300]);
        throw new AdminRequestError('Kata sandi admin salah.', 401);
    }
    $db->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
}

$_SESSION['csrf'] = $_SESSION['csrf'] ?? bin2hex(random_bytes(32));
$token = $_SESSION['csrf'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$wantsJson = $method === 'POST' && strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$localSetup = in_array($ip, ['::1', '127.0.0.1', '::ffff:127.0.0.1'], true);
$authenticated = false;
$setup = false;
$available = true;
$error = '';
$success = $_SESSION['success'] ?? '';
unset($_SESSION['success']);
$uploads = [];

try {
    $db = database();
    $hash = $db ? $db->query('SELECT password_hash FROM admin WHERE id = 1')->fetchColumn() : false;
    $setup = $hash === false;
    $authenticated = !$setup && ($_SESSION['admin'] ?? false) === true;

    if ($method === 'POST') {
        $action = postText('action');
        if ($wantsJson && !$authenticated) {
            throw new AdminRequestError('Sesi admin berakhir. Buka kembali halaman admin dan masuk lagi.', 401);
        }
        if (!$_POST && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            throw new AdminRequestError('Unggahan melebihi batas ukuran yang dapat diterima Laragon.', 413);
        }
        if (!hash_equals($token, postText('csrf'))) {
            throw new AdminRequestError('Sesi formulir berakhir. Muat ulang halaman admin dan coba lagi.', 403);
        }

        if ($action === 'setup') {
            if (!$setup || !$localSetup) {
                throw new AdminRequestError('Buka admin dari localhost untuk mengatur kata sandi pertama kali.', 403);
            }
            $password = postText('password');
            if (!mb_check_encoding($password, 'UTF-8') || mb_strlen($password, 'UTF-8') < 12 || strlen($password) > 72 || strpos($password, "\0") !== false) {
                throw new AdminRequestError('Buat kata sandi minimal 12 karakter dan maksimal 72 byte.', 422);
            }
            if ($password !== postText('confirmation')) {
                throw new AdminRequestError('Kedua kata sandi harus sama.', 422);
            }
            $db = database(true);
            $create = $db->prepare('INSERT OR IGNORE INTO admin (id, password_hash) VALUES (1, ?)');
            $create->execute([password_hash($password, PASSWORD_DEFAULT)]);
            if ($create->rowCount() !== 1) {
                redirectToAdmin();
            }
            startAdminSession();
            redirectToAdmin();
        }

        if ($action === 'login' && !$setup && !$authenticated) {
            checkPassword($db, $hash, postText('password'), $ip);
            startAdminSession();
            redirectToAdmin();
        }

        if (!$authenticated) {
            throw new AdminRequestError('Masuk sebagai admin untuk melanjutkan.', 401);
        }
        if ($action === 'logout') {
            $_SESSION = [];
            session_destroy();
            setcookie(session_name(), '', $cookie + ['expires' => 1]);
            redirectToAdmin();
        }
        if ($action !== 'upload') {
            throw new AdminRequestError('Tindakan tidak dikenal.', 400);
        }

        $id = publishFilm($db);
        $_SESSION['success'] = 'Film berhasil diunggah dan sudah muncul di katalog.';
        if ($wantsJson) {
            jsonReply(201, ['id' => $id]);
        }
        redirectToAdmin();
    }
    if ($method !== 'GET' && $method !== 'HEAD') {
        header('Allow: GET, HEAD, POST');
        throw new AdminRequestError('Metode permintaan tidak didukung.', 405);
    }
} catch (InvalidArgumentException | AdminRequestError $problem) {
    $status = $problem instanceof AdminRequestError ? $problem->getCode() : 422;
    $error = $problem->getMessage();
    if ($wantsJson) {
        jsonReply($status, ['error' => $error]);
    }
    http_response_code($status);
} catch (Throwable $problem) {
    error_log('Layar admin: ' . $problem->getMessage());
    $available = false;
    $error = 'Penyimpanan Layar tidak bisa dibuka. Periksa konfigurasi Laragon, lalu coba lagi.';
    if ($wantsJson) {
        jsonReply(500, ['error' => $error]);
    }
    http_response_code(500);
}

if ($available && $authenticated) {
    $uploads = uploadedFilms($db);
}
$pageTitle = $authenticated ? 'Unggah film' : ($setup ? 'Siapkan admin' : 'Masuk admin');
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#101411">
    <title><?= h($pageTitle) ?> — Layar</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="admin.css">
    <script defer src="admin.js"></script>
</head>
<body>
    <div class="admin-shell">
        <header class="admin-header">
            <a class="brand admin-brand" href="./" aria-label="Beranda Layar"><img src="assets/favicon.svg" alt="" width="36" height="36"><span>LAYAR<span class="brand-period">.</span></span></a>
            <nav aria-label="Navigasi admin">
                <a class="button" href="./">Lihat katalog</a>
                <?php if ($authenticated): ?>
                    <form method="post" action="admin.php">
                        <input type="hidden" name="action" value="logout">
                        <input type="hidden" name="csrf" value="<?= h($token) ?>">
                        <button class="button" type="submit">Keluar</button>
                    </form>
                <?php endif; ?>
            </nav>
        </header>

        <?php if (!$authenticated || !$available): ?>
            <main class="admin-auth">
                <div class="admin-panel">
                    <p class="admin-kicker">Admin Layar</p>
                    <h1><?= h($pageTitle) ?></h1>
                    <?php if ($error !== ''): ?><p class="admin-error" role="alert"><?= h($error) ?></p><?php endif; ?>
                    <?php if ($available && $setup && !$localSetup): ?>
                        <p class="admin-muted">Buka halaman ini dari localhost untuk mengatur kata sandi pertama kali.</p>
                    <?php elseif ($available): ?>
                        <p class="admin-muted"><?= $setup ? 'Buat kata sandi untuk mengelola unggahan film.' : 'Masukkan kata sandi untuk membuka dashboard unggahan.' ?></p>
                        <form class="admin-form" method="post" action="admin.php">
                            <input type="hidden" name="action" value="<?= $setup ? 'setup' : 'login' ?>">
                            <input type="hidden" name="csrf" value="<?= h($token) ?>">
                            <label class="admin-field">Kata sandi
                                <input type="password" name="password" autocomplete="<?= $setup ? 'new-password' : 'current-password' ?>" <?= $setup ? 'minlength="12"' : '' ?> maxlength="72" required>
                                <?php if ($setup): ?><small>Minimal 12 karakter.</small><?php endif; ?>
                            </label>
                            <?php if ($setup): ?>
                                <label class="admin-field">Ulangi kata sandi
                                    <input type="password" name="confirmation" autocomplete="new-password" minlength="12" maxlength="72" required>
                                </label>
                            <?php endif; ?>
                            <button class="button primary" type="submit"><?= $setup ? 'Buat kata sandi admin' : 'Masuk' ?></button>
                        </form>
                    <?php endif; ?>
                </div>
            </main>
        <?php else: ?>
            <main>
                <div class="admin-heading">
                    <p class="admin-kicker">Admin Layar</p>
                    <h1>Unggah film</h1>
                    <p class="admin-muted">Publikasikan video ke katalog Layar.</p>
                </div>
                <?php if ($success !== ''): ?><p class="admin-success" role="status"><?= h($success) ?></p><?php endif; ?>
                <div class="admin-layout">
                    <section class="admin-panel" aria-labelledby="upload-title">
                        <h2 id="upload-title">Film baru</h2>
                        <?php if ($error !== ''): ?><p class="admin-error" role="alert"><?= h($error) ?></p><?php endif; ?>
                        <form id="upload-form" class="admin-form" enctype="multipart/form-data" method="post" action="admin.php">
                            <input type="hidden" name="action" value="upload">
                            <input type="hidden" name="csrf" value="<?= h($token) ?>">
                            <label class="admin-field">Judul film
                                <input type="text" name="title" placeholder="Judul yang tampil di katalog" maxlength="120" required>
                            </label>
                            <div class="admin-field-row">
                                <label class="admin-field">Tahun rilis
                                    <input type="number" name="year" min="1888" max="<?= (int) date('Y') + 1 ?>" value="<?= (int) date('Y') ?>" required>
                                </label>
                                <label class="admin-field">Durasi dalam detik
                                    <input id="duration" type="number" name="duration" min="1" max="86400" placeholder="Terisi saat video dipilih" required>
                                </label>
                            </div>
                            <fieldset class="admin-field admin-genres">
                                <legend>Genre</legend>
                                <div class="admin-picks">
                                    <?php foreach (LAYAR_GENRES as $genre): ?>
                                        <label class="admin-pick"><input type="checkbox" name="genres[]" value="<?= h($genre) ?>"><span><?= h($genre) ?></span></label>
                                    <?php endforeach; ?>
                                </div>
                            </fieldset>
                            <label class="admin-field">Sinopsis
                                <textarea name="description" rows="4" maxlength="1200" placeholder="Tulis ringkasan singkat film" required></textarea>
                            </label>
                            <div class="admin-field-row">
                                <label class="admin-field">Video
                                    <input id="video-file" type="file" name="video" accept=".mp4,.webm,video/mp4,video/webm" required>
                                    <small>MP4 atau WebM, maksimal 512 MB.</small>
                                </label>
                                <label class="admin-field"><span class="admin-field-label">Poster <small>Opsional</small></span>
                                    <input id="poster-file" type="file" name="poster" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
                                    <small>JPG, PNG, atau WebP, maksimal 8 MB.</small>
                                </label>
                            </div>
                            <div class="admin-upload-progress" id="upload-progress" hidden>
                                <progress aria-label="Kemajuan unggahan" max="100" value="0"></progress>
                                <small role="status"></small>
                            </div>
                            <p class="admin-error" id="upload-error" role="alert" hidden></p>
                            <button class="button primary" type="submit">Unggah dan publikasikan</button>
                        </form>
                    </section>

                    <section class="admin-panel admin-library" aria-labelledby="library-title">
                        <h2 id="library-title">Film yang diunggah <span><?= count($uploads) ?></span></h2>
                        <?php if (!$uploads): ?>
                            <p class="admin-muted">Belum ada film yang diunggah.</p>
                        <?php else: ?>
                            <ul class="admin-upload-list">
                                <?php foreach ($uploads as $film): ?>
                                    <li>
                                        <a href="<?= h(mediaUrl($film['id'], 'video')) ?>" target="_blank" rel="noopener" aria-label="Putar <?= h($film['title']) ?>">
                                            <span class="admin-thumb"><?php if ($film['hasPoster']): ?><img src="<?= h(mediaUrl($film['id'], 'poster')) ?>" alt="" loading="lazy"><?php else: ?>&#9654;<?php endif; ?></span>
                                            <span class="admin-film"><strong><?= h($film['title']) ?></strong><small><?= $film['year'] ?> · <?= h($film['duration']) ?></small></span>
                                            <span class="admin-uploaded-play">Putar <span aria-hidden="true">↗</span></span>
                                        </a>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </section>
                </div>
            </main>
        <?php endif; ?>
    </div>
</body>
</html>
