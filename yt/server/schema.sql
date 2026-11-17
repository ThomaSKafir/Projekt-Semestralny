CREATE DATABASE IF NOT EXISTS yappatoilet
    CHARACTER SET utf8mb4;

USE yappatoilet;


-- tabela uzytkownikow

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    pw VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- tabela toalet

CREATE TABLE toilets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    descr VARCHAR(200),
    price INT NOT NULL
);


-- tabela zamowien

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    toilet_id INT NOT NULL,

    color VARCHAR(20) NOT NULL,
    extras JSON NOT NULL,
    panel VARCHAR(20) NOT NULL,

    renovation TINYINT(1) NOT NULL DEFAULT 0,

    install_date DATE NOT NULL,
    install_hour TINYINT NOT NULL,

    renovation_date DATE NULL,

    street VARCHAR(80) NOT NULL,
    zip CHAR(6) NOT NULL,
    city VARCHAR(50) NOT NULL,

    total INT NOT NULL,

    status TINYINT NOT NULL DEFAULT 0
        COMMENT '0 oczekuje, 1 potwierdzone, 2 w realizacji, 3 zrealizowane, 4 anulowane',

    confirm_token CHAR(48) NULL,

    created DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_users
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_orders_toilets
        FOREIGN KEY (toilet_id)
        REFERENCES toilets(id)
);


-- tabela terminow

CREATE TABLE slots (
    slot_date DATE NOT NULL,

    slot_hour TINYINT NOT NULL
        COMMENT '99 = remont (cały dzień)',

    order_id INT NOT NULL,

    PRIMARY KEY (slot_date, slot_hour),

    CONSTRAINT fk_slots_orders
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);


-- dane poczatkowe

INSERT INTO toilets (name, descr, price)
VALUES
    (
        'Klasyk Compact',
        'Kompaktowa toaleta stojąca, idealna do małych ubikacji.',
        890
    ),
    (
        'Wiszący Slim',
        'Miska wisząca bez kołnierza, stelaż podtynkowy w zestawie.',
        1290
    ),
    (
        'Comfort Rimless',
        'Podwyższona miska rimless, łatwa w czyszczeniu.',
        1590
    ),
    (
        'Smart Bidet',
        'Toaleta z funkcją bidetu i podgrzewanym siedziskiem.',
        2790
    ),
    (
        'Royal Ceramic',
        'Ceramiczny model premium o klasycznej formie.',
        3490
    );
