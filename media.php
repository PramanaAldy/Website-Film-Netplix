<?php
declare(strict_types=1);

require __DIR__ . '/lib/layar.php';

ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET, HEAD');
    http_response_code(405);
    exit;
}

try {
    $db = database();
    if (!isset($_GET['id']) && !isset($_GET['kind'])) {
        $json = json_encode(uploadedFilms($db), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        if ($method === 'GET') {
            echo $json;
        }
        exit;
    }

    $id = $_GET['id'] ?? '';
    $kind = $_GET['kind'] ?? '';
    if ($db === null || !is_string($id) || !preg_match('/\Aupload-[a-f0-9]{32}\z/', $id) || !in_array($kind, ['video', 'poster'], true)) {
        http_response_code(404);
        exit;
    }
    $select = $db->prepare('SELECT video_mime, poster_mime FROM films WHERE id = ?');
    $select->execute([$id]);
    $entry = $select->fetch();
    $select->closeCursor();
    $mime = $entry[$kind . '_mime'] ?? null;
    $file = storageDirectory() . '/' . $id . '-' . $kind;
    if ($mime === null || !is_file($file)) {
        http_response_code(404);
        exit;
    }

    $stream = fopen($file, 'rb');
    if ($stream === false) {
        throw new RuntimeException('Cannot read requested media.');
    }
    $size = fstat($stream)['size'];
    serveMedia($stream, $size, $mime, '"' . $id . '-' . $kind . '"', $method === 'HEAD');
    fclose($stream);
} catch (Throwable $error) {
    error_log('Layar media: ' . $error->getMessage());
    http_response_code(500);
}

function serveMedia($stream, int $size, string $mime, string $etag, bool $head): void
{
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline');
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    header('Accept-Ranges: bytes');

    $matches = array_map('trim', explode(',', $_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    if (in_array($etag, $matches, true) || in_array('W/' . $etag, $matches, true) || in_array('*', $matches, true)) {
        http_response_code(304);
        return;
    }

    $start = 0;
    $end = $size - 1;
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    if (!$head && (!isset($_SERVER['HTTP_IF_RANGE']) || $_SERVER['HTTP_IF_RANGE'] === $etag)
        && preg_match('/\Abytes=(\d*)-(\d*)\z/i', $range, $bounds)) {
        if ($bounds[1] === '') {
            $start = max(0, $size - (int) $bounds[2]);
        } else {
            $start = (int) $bounds[1];
            if ($bounds[2] !== '') {
                $end = min($end, (int) $bounds[2]);
            }
        }
        if ($start > $end) {
            http_response_code(416);
            header('Content-Range: bytes */' . $size);
            header('Content-Length: 0');
            return;
        }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }

    $remaining = $end - $start + 1;
    header('Content-Length: ' . $remaining);
    if ($head) {
        return;
    }
    ini_set('zlib.output_compression', '0');
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    fseek($stream, $start);
    while ($remaining > 0 && !connection_aborted()) {
        $chunk = fread($stream, min($remaining, 256 * 1024));
        if ($chunk === false || $chunk === '') {
            break;
        }
        echo $chunk;
        $remaining -= strlen($chunk);
    }
}
