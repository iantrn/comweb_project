

CREATE DATABASE IF NOT EXISTS forum_cir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE forum_cir;

CREATE TABLE IF NOT EXISTS users (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    login    VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(40)  NOT NULL,
    token    VARCHAR(64)  DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS topics (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    userLogin  VARCHAR(100) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS replies (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    topicId    INT          NOT NULL,
    userLogin  VARCHAR(100) NOT NULL,
    content    TEXT         NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE CASCADE
);


INSERT INTO users (login, password) VALUES
    ('alice', SHA1('password')),
    ('bob',   SHA1('password'));

INSERT INTO topics (title, content, userLogin, created_at) VALUES
    ('Bienvenue sur CIRForum !',    'Ceci est le premier sujet du forum. Bonne discussion à tous !', 'alice', NOW() - INTERVAL 3 DAY),
    ('Questions sur le projet PHP', 'Comment gérer la connexion PDO proprement ?',                    'bob',   NOW() - INTERVAL 2 DAY),
    ('Ressources Bootstrap utiles', 'Voici quelques liens utiles pour Bootstrap 5...',                 'alice', NOW() - INTERVAL 1 DAY);

INSERT INTO replies (topicId, userLogin, content, created_at) VALUES
    (1, 'bob',   'Merci pour ce forum !',                               NOW() - INTERVAL 2 DAY),
    (1, 'alice', 'Avec plaisir, bonne chance pour le projet.',          NOW() - INTERVAL 2 DAY),
    (1, 'bob',   'On va y arriver !',                                   NOW() - INTERVAL 1 DAY),
    (2, 'alice', 'Regarde la doc PHP sur PDO, c''est très bien expliqué.', NOW() - INTERVAL 1 DAY),
    (3, 'bob',   'La doc officielle Bootstrap est top aussi.',          NOW());
