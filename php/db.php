<?php
require_once 'constantes.php';

function dbConnect() {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(['error' => 'Database unavailable']);
        exit();
    }
}

<?php
require_once 'db.php';

function dbRequestTopics($db) {
    $stmt = $db->prepare('SELECT * FROM topics ORDER BY created_at DESC');
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function dbRequestTopic($db, $id) {
    $stmt = $db->prepare('SELECT * FROM topics WHERE id = :id');
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function dbRequestReplies($db, $topicId) {
    $stmt = $db->prepare('SELECT * FROM replies WHERE topicId = :topicId ORDER BY created_at ASC');
    $stmt->execute([':topicId' => $topicId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}