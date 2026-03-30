CREATE DATABASE IF NOT EXISTS forum_cir2;
USE forum_cir2;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    token VARCHAR(255)
);

CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    userLogin VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT NOW()
);

CREATE TABLE replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topicId INT NOT NULL,
    userLogin VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (topicId) REFERENCES topics(id)
);

INSERT INTO users (login, password, token) VALUES
('alice', SHA1('password123'), NULL),
('bob', SHA1('azerty456'), NULL);

INSERT INTO topics (title, content, userLogin) VALUES
('Bienvenue sur le forum', 'Premier sujet de test.', 'alice'),
('Questions sur le projet', 'Qui gère le WebSocket ?', 'bob'),
('Retours séance 1', 'Tout s\'est bien passé.', 'alice');

INSERT INTO replies (topicId, userLogin, content) VALUES
(1, 'bob', 'Merci pour ce sujet !'),
(1, 'alice', 'Avec plaisir.'),
(2, 'alice', 'C\'est le responsable intégration.'),
(3, 'bob', 'Oui très bien.'),
(3, 'alice', 'On continue en S2.');
