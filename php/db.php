<?php
require_once 'constantes.php';

function dbConnect() {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(['error' => 'Connexion BDD impossible']);
        exit;
    }
}


function dbRequestTopics($db) {
    $stmt = $db->prepare('SELECT * FROM topics ORDER BY created_at DESC');
    $stmt->execute();
    return $stmt->fetchAll();
}

function dbRequestTopic($db, $id) {
    $stmt = $db->prepare('SELECT * FROM topics WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function dbAddTopic($db, $title, $content, $userLogin) {
    $stmt = $db->prepare(
        'INSERT INTO topics (title, content, userLogin, created_at) VALUES (?, ?, ?, NOW())'
    );
    $stmt->execute([
        strip_tags($title),
        strip_tags($content),
        strip_tags($userLogin)
    ]);
    return $db->lastInsertId();
}

function dbModifyTopic($db, $id, $title, $content, $userLogin) {
    $stmt = $db->prepare('SELECT userLogin FROM topics WHERE id = ?');
    $stmt->execute([$id]);
    $topic = $stmt->fetch();
    if (!$topic || $topic['userLogin'] !== $userLogin) {
        return false;
    }
    $stmt = $db->prepare(
        'UPDATE topics SET title = ?, content = ? WHERE id = ?'
    );
    $stmt->execute([strip_tags($title), strip_tags($content), $id]);
    return true;
}

function dbDeleteTopic($db, $id, $userLogin) {
    $stmt = $db->prepare('SELECT userLogin FROM topics WHERE id = ?');
    $stmt->execute([$id]);
    $topic = $stmt->fetch();
    if (!$topic || $topic['userLogin'] !== $userLogin) {
        return false;
    }
    $stmt = $db->prepare('DELETE FROM replies WHERE topicId = ?');
    $stmt->execute([$id]);
    $stmt = $db->prepare('DELETE FROM topics WHERE id = ?');
    $stmt->execute([$id]);
    return true;
}


function dbRequestReplies($db, $topicId) {
    $stmt = $db->prepare(
        'SELECT * FROM replies WHERE topicId = ? ORDER BY created_at ASC'
    );
    $stmt->execute([$topicId]);
    return $stmt->fetchAll();
}

function dbAddReply($db, $topicId, $userLogin, $content) {
    $stmt = $db->prepare(
        'INSERT INTO replies (topicId, userLogin, content, created_at) VALUES (?, ?, ?, NOW())'
    );
    $stmt->execute([$topicId, strip_tags($userLogin), strip_tags($content)]);
    return $db->lastInsertId();
}

function dbModifyReply($db, $id, $content, $userLogin) {
    $stmt = $db->prepare('SELECT userLogin FROM replies WHERE id = ?');
    $stmt->execute([$id]);
    $reply = $stmt->fetch();
    if (!$reply || $reply['userLogin'] !== $userLogin) {
        return false;
    }
    $stmt = $db->prepare('UPDATE replies SET content = ? WHERE id = ?');
    $stmt->execute([strip_tags($content), $id]);
    return true;
}

function dbDeleteReply($db, $id, $userLogin) {
    $stmt = $db->prepare('SELECT userLogin FROM replies WHERE id = ?');
    $stmt->execute([$id]);
    $reply = $stmt->fetch();
    if (!$reply || $reply['userLogin'] !== $userLogin) {
        return false;
    }
    $stmt = $db->prepare('DELETE FROM replies WHERE id = ?');
    $stmt->execute([$id]);
    return true;
}


function dbLogin($db, $login, $password) {
    $stmt = $db->prepare('SELECT * FROM users WHERE login = ?');
    $stmt->execute([strip_tags($login)]);
    $user = $stmt->fetch();
    if (!$user || $user['password'] !== sha1($password)) {
        return false;
    }
    $token = bin2hex(openssl_random_pseudo_bytes(16));
    $stmt = $db->prepare('UPDATE users SET token = ? WHERE id = ?');
    $stmt->execute([$token, $user['id']]);
    return $token;
}

function dbGetUserByToken($db, $token) {
    if (!$token) return false;
    $stmt = $db->prepare('SELECT * FROM users WHERE token = ?');
    $stmt->execute([$token]);
    return $stmt->fetch();
}
