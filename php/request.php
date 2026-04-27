<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$db = dbConnect();
$method = $_SERVER['REQUEST_METHOD'];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^.*?/php/request\.php#', '', $uri);
$uri = trim($uri, '/');
$parts = explode('/', $uri);

function getBearerToken() {
    $headers = getallheaders();
    foreach ($headers as $k => $v) {
        if (strtolower($k) === 'authorization') {
            if (preg_match('/Bearer\s+(.+)/i', $v, $m)) {
                return $m[1];
            }
        }
    }
    return null;
}

function requireAuth($db) {
    $token = getBearerToken();
    $user = dbGetUserByToken($db, $token);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Non autorisé — token manquant ou invalide']);
        exit;
    }
    return $user;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];


if ($parts[0] === 'login' && $method === 'POST') {
    $authHeader = null;
    foreach (getallheaders() as $k => $v) {
        if (strtolower($k) === 'authorization') { $authHeader = $v; break; }
    }
    if (!$authHeader || !preg_match('/Basic\s+(.+)/i', $authHeader, $m)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization Basic requis']);
        exit;
    }
    $decoded = base64_decode($m[1]);
    [$login, $password] = explode(':', $decoded, 2);

    $token = dbLogin($db, $login, $password);
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Identifiants invalides']);
        exit;
    }
    http_response_code(200);
    echo json_encode(['token' => $token, 'login' => strip_tags($login)]);
    exit;
}


if ($parts[0] === 'topics') {
    $topicId = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;

    if ($method === 'GET' && $topicId === null) {
        $topics = dbRequestTopics($db);
        http_response_code(200);
        echo json_encode($topics);
        exit;
    }

    if ($method === 'GET' && $topicId !== null) {
        $topic = dbRequestTopic($db, $topicId);
        if (!$topic) {
            http_response_code(400);
            echo json_encode(['error' => 'Sujet introuvable']);
            exit;
        }
        http_response_code(200);
        echo json_encode($topic);
        exit;
    }

    if ($method === 'POST' && $topicId === null) {
        $user = requireAuth($db);
        if (empty($body['title']) || empty($body['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'title et content sont requis']);
            exit;
        }
        $id = dbAddTopic($db, $body['title'], $body['content'], $user['login']);
        http_response_code(201);
        echo json_encode(['id' => $id, 'message' => 'Sujet créé']);
        exit;
    }

    if ($method === 'PUT' && $topicId !== null) {
        $user = requireAuth($db);
        if (empty($body['title']) || empty($body['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'title et content sont requis']);
            exit;
        }
        $ok = dbModifyTopic($db, $topicId, $body['title'], $body['content'], $user['login']);
        if (!$ok) {
            http_response_code(401);
            echo json_encode(['error' => 'Non autorisé ou sujet introuvable']);
            exit;
        }
        http_response_code(200);
        echo json_encode(['message' => 'Sujet modifié']);
        exit;
    }

    if ($method === 'DELETE' && $topicId !== null) {
        $user = requireAuth($db);
        $ok = dbDeleteTopic($db, $topicId, $user['login']);
        if (!$ok) {
            http_response_code(401);
            echo json_encode(['error' => 'Non autorisé ou sujet introuvable']);
            exit;
        }
        http_response_code(200);
        echo json_encode(['message' => 'Sujet supprimé']);
        exit;
    }
}


if ($parts[0] === 'replies') {
    $replyId = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;

    if ($method === 'GET') {
        $topicId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if ($topicId === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Paramètre id requis']);
            exit;
        }
        $replies = dbRequestReplies($db, $topicId);
        http_response_code(200);
        echo json_encode($replies);
        exit;
    }

    if ($method === 'POST') {
        $user = requireAuth($db);
        if (empty($body['topicId']) || empty($body['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'topicId et content sont requis']);
            exit;
        }
        $id = dbAddReply($db, (int)$body['topicId'], $user['login'], $body['content']);
        http_response_code(201);
        echo json_encode(['id' => $id, 'message' => 'Réponse ajoutée']);
        exit;
    }

    if ($method === 'PUT' && $replyId !== null) {
        $user = requireAuth($db);
        if (empty($body['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'content est requis']);
            exit;
        }
        $ok = dbModifyReply($db, $replyId, $body['content'], $user['login']);
        if (!$ok) {
            http_response_code(401);
            echo json_encode(['error' => 'Non autorisé ou réponse introuvable']);
            exit;
        }
        http_response_code(200);
        echo json_encode(['message' => 'Réponse modifiée']);
        exit;
    }

    if ($method === 'DELETE' && $replyId !== null) {
        $user = requireAuth($db);
        $ok = dbDeleteReply($db, $replyId, $user['login']);
        if (!$ok) {
            http_response_code(401);
            echo json_encode(['error' => 'Non autorisé ou réponse introuvable']);
            exit;
        }
        http_response_code(200);
        echo json_encode(['message' => 'Réponse supprimée']);
        exit;
    }
}

http_response_code(400);
echo json_encode(['error' => 'Route inconnue']);
