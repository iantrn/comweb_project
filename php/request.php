<?php
header('Content-Type: application/json');
require_once 'functions.php';

$db = dbConnect();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));

if ($method === 'GET' && $parts[0] === 'topics' && !isset($parts[1])) {
    $topics = dbRequestTopics($db);
    http_response_code(200);
    echo json_encode($topics);
    exit();
}

if ($method === 'GET' && $parts[0] === 'topics' && isset($parts[1]) && is_numeric($parts[1])) {
    $topic = dbRequestTopic($db, (int)$parts[1]);
    if ($topic) {
        http_response_code(200);
        echo json_encode($topic);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Sujet introuvable']);
    }
    exit();
}

if ($method === 'GET' && $parts[0] === 'replies' && isset($_GET['id']) && is_numeric($_GET['id'])) {
    $replies = dbRequestReplies($db, (int)$_GET['id']);
    http_response_code(200);
    echo json_encode($replies);
    exit();
}

http_response_code(400);
echo json_encode(['error' => 'Route invalide']);