
import 'dotenv/config';

import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';


const {
    JWT_SECRET,
    DB_HOST = 'localhost',
    DB_USER,
    DB_PASS,
    DB_NAME = 'yappatoilet',
    PORT = 3001,
    BASE_URL = 'http://localhost:5173',
    API_BASE_URL = 'http://localhost:3001',
    NODE_ENV
} = process.env;

if (!JWT_SECRET) {
    throw new Error('Brak JWT_SECRET w pliku .env');
}

const db = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    connectionLimit: 10,
    dateStrings: true
});

const app = express();

app.set('trust proxy', 1);

app.use(
    helmet(),
    express.json({ limit: '20kb' }),
    cookieParser()
);

//stałe i cennik

const COLORS = {
    'Biały': 0,
    'Kremowy': 0,
    'Czarny mat': 200
};

const EXTRAS = {
    'Deska wolnoopadająca': 150,
    'Bidet ręczny': 400,
    'Podgrzewane siedzisko': 300
};

const PANELS = {
    'Standardowy': 0,
    'Premium': 600,
    'Premium AI': 1500
};

const RENOVATION_PRICE = 2500;

const AVAILABLE_HOURS = [8, 10, 12, 14, 16];

const MAX_ACTIVE_ORDERS = 3;

const ORDER_STATUS = {
    WAITING: 0,
    CONFIRMED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4
};

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const COOKIE_CLEAR_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production'
};

//funkcje pomocnicze

const bad = (res, message, status = 400) => {
    return res.status(status).json({
        error: message
    });
};

const wrap = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch((error) => {
            console.error(error);
            bad(res, 'Błąd serwera.', 500);
        });
    };
};

const createLimiter = (maxRequests) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false
    });
};

app.use('/api/', createLimiter(300));

const isValidEmail = (email) => {
    return (
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
        email.length <= 120
    );
};

const isFutureDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (isNaN(parsedDate.getTime())) {
        return false;
    }

    const normalizedDate = [
        parsedDate.getFullYear(),
        String(parsedDate.getMonth() + 1).padStart(2, '0'),
        String(parsedDate.getDate()).padStart(2, '0')
    ].join('-');

    if (normalizedDate !== date) {
        return false;
    }

    const today = new Date();

    const currentDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    return date > currentDate;
};

const hasOwn = (object, key) => {
    return Object.hasOwn(object, key);
};

//obsluga uzytkownikow i weryfikacja

const createToken = (userId) => {
    return jwt.sign(
        { uid: userId },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const setAuthCookie = (res, userId) => {
    res.cookie(
        'token',
        createToken(userId),
        COOKIE_OPTIONS
    );
};

const authenticate = wrap(async (req, res, next) => {
    let tokenData;

    try {
        tokenData = jwt.verify(
            req.cookies.token || '',
            JWT_SECRET
        );
    } catch {
        return bad(res, 'Wymagane logowanie.', 401);
    }

    const [[user]] = await db.query(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [tokenData.uid]
    );

    if (!user) {
        return bad(res, 'Wymagane logowanie.', 401);
    }

    req.user = user;

    next();
});

//captcha

const createCaptchaHash = (answer) => {
    return crypto
        .createHash('sha256')
        .update(String(answer) + JWT_SECRET)
        .digest('hex');
};

app.get('/api/captcha', (req, res) => {
    const firstNumber = 1 + Math.floor(Math.random() * 9);
    const secondNumber = 1 + Math.floor(Math.random() * 9);

    const answer = firstNumber + secondNumber;

    const token = jwt.sign(
        { h: createCaptchaHash(answer) },
        JWT_SECRET,
        { expiresIn: '10m' }
    );

    res.json({
        q: `${firstNumber} + ${secondNumber}`,
        token
    });
});

const verifyCaptcha = (token, answer) => {
    try {
        if (!/^\d+$/.test(String(answer))) {
            return false;
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        return decoded.h === createCaptchaHash(answer);
    } catch {
        return false;
    }
};

//konfig

app.get('/api/config', wrap(async (req, res) => {
    const [toilets] = await db.query(
        'SELECT id, name, descr, price FROM toilets'
    );

    res.json({
        toilets,
        colors: COLORS,
        extras: EXTRAS,
        panels: PANELS,
        hours: AVAILABLE_HOURS,
        ren: RENOVATION_PRICE
    });
}));

//rejestracja

app.post(
    '/api/register',
    createLimiter(10),
    wrap(async (req, res) => {
        const {
            name = '',
            email = '',
            password = ''
        } = req.body || {};

        const userName = String(name).trim();
        const userEmail = String(email).trim().toLowerCase();
        const userPassword = String(password);

        if (userName.length < 2 || userName.length > 40) {
            return bad(res, 'Podaj imię (2–40 znaków).');
        }

        if (!isValidEmail(userEmail)) {
            return bad(res, 'Nieprawidłowy e-mail.');
        }

        if (
            userPassword.length < 8 ||
            Buffer.byteLength(userPassword, 'utf8') > 72 ||
            !/[a-zA-Z]/.test(userPassword) ||
            !/\d/.test(userPassword)
        ) {
            return bad(
                res,
                'Hasło: min. 8 znaków, litera i cyfra.'
            );
        }

        try {
            const hashedPassword = await bcrypt.hash(
                userPassword,
                12
            );

            const [result] = await db.query(
                `INSERT INTO users (name, email, pw)
                 VALUES (?, ?, ?)`,
                [userName, userEmail, hashedPassword]
            );

            setAuthCookie(res, result.insertId);

            res.status(201).json({
                id: result.insertId,
                name: userName,
                email: userEmail,
                role: 'user'
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return bad(
                    res,
                    'Konto z tym e-mailem już istnieje.',
                    409
                );
            }

            throw error;
        }
    })
);

//login

app.post(
    '/api/login',
    createLimiter(10),
    wrap(async (req, res) => {
        const email = String(
            req.body?.email || ''
        ).trim().toLowerCase();

        const password = String(
            req.body?.password || ''
        );

        const [[user]] = await db.query(
            `SELECT id, name, email, pw, role
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (
            !user ||
            !await bcrypt.compare(password, user.pw)
        ) {
            return bad(
                res,
                'Nieprawidłowy e-mail lub hasło.',
                401
            );
        }

        setAuthCookie(res, user.id);

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    })
);

//logaut

app.post('/api/logout', (req, res) => {
    res.clearCookie('token', COOKIE_CLEAR_OPTIONS);

    res.json({ ok: 1 });
});

// aktualnie zalogowany ziutek

app.get('/api/me', authenticate, (req, res) => {
    res.json(req.user);
});

//Walidacja i wycena zamowien

async function validateOrder(data) {
    const order = {
        toilet_id: Number(data.toilet_id),

        color: String(data.color || ''),

        extras: Array.isArray(data.extras)
            ? [...new Set(data.extras.map(String))]
            : [],

        panel: String(data.panel || ''),

        renovation:
            data.renovation === true ||
            data.renovation === 1,

        date: String(data.date || ''),

        hour: Number(data.hour),

        rdate: data.renovation
            ? String(data.rdate || '')
            : null,

        street: String(data.street || '').trim(),

        zip: String(data.zip || '').trim(),

        city: String(data.city || '').trim()
    };

    const [[toilet]] = await db.query(
        'SELECT price FROM toilets WHERE id = ?',
        [order.toilet_id]
    );

    if (!toilet) {
        return 'Nieznany model.';
    }

    if (
        !hasOwn(COLORS, order.color) ||
        !hasOwn(PANELS, order.panel) ||
        order.extras.some((extra) => !hasOwn(EXTRAS, extra))
    ) {
        return 'Nieprawidłowa konfiguracja.';
    }

    if (
        order.street.length < 3 ||
        order.street.length > 80 ||
        !/\d/.test(order.street)
    ) {
        return 'Podaj ulicę z numerem.';
    }

    if (!/^\d{2}-\d{3}$/.test(order.zip)) {
        return 'Kod pocztowy: 00-000.';
    }

    if (
        order.city.length < 2 ||
        order.city.length > 50
    ) {
        return 'Podaj miasto.';
    }

    if (!AVAILABLE_HOURS.includes(order.hour)) {
        return 'Nieprawidłowa godzina.';
    }

    if (!isFutureDate(order.date)) {
        return 'Termin montażu musi być w przyszłości.';
    }

    if (
        order.renovation &&
        (
            !isFutureDate(order.rdate) ||
            order.rdate === order.date
        )
    ) {
        return 'Nieprawidłowa data remontu.';
    }

    const extrasPrice = order.extras.reduce(
        (total, extra) => total + EXTRAS[extra],
        0
    );

    order.total =
        toilet.price +
        COLORS[order.color] +
        extrasPrice +
        PANELS[order.panel] +
        (order.renovation ? RENOVATION_PRICE : 0);

    return order;
}

//rezerwacja terminow

async function reserveSlot(connection, orderId, order) {
    await connection.query(
        'DELETE FROM slots WHERE order_id = ?',
        [orderId]
    );

    const reservedDays = order.renovation
        ? [order.date, order.rdate]
        : [order.date];

    const [existingSlots] = await connection.query(
        `SELECT slot_date, slot_hour
         FROM slots
         WHERE slot_date IN (?)
         FOR UPDATE`,
        [reservedDays]
    );

    const installationConflict = existingSlots.some((slot) => {
        return (
            slot.slot_date === order.date &&
            (
                slot.slot_hour === order.hour ||
                slot.slot_hour === 99
            )
        );
    });

    if (installationConflict) {
        return 'Ten termin montażu jest zajęty.';
    }

    if (order.renovation) {
        const renovationConflict = existingSlots.some((slot) => {
            return slot.slot_date === order.rdate;
        });

        if (renovationConflict) {
            return 'W dniu remontu są już zaplanowane prace.';
        }
    }

    await connection.query(
        `INSERT INTO slots (slot_date, slot_hour, order_id)
         VALUES (?, ?, ?)`,
        [order.date, order.hour, orderId]
    );

    if (order.renovation) {
        await connection.query(
            `INSERT INTO slots (slot_date, slot_hour, order_id)
             VALUES (?, ?, ?)`,
            [order.rdate, 99, orderId]
        );
    }

    return null;
}

//potwierdzenie zamowienia

const sendConfirmation = (email, token) => {
    const confirmationUrl =
        `${API_BASE_URL}/api/confirm/${token}`;

    // Tymczasowa obsługa wiadomości.
    // W produkcji należy podłączyć np. Nodemailer.

    console.log(
        `[MAIL do ${email}] Potwierdź zamówienie: ${confirmationUrl}`
    );
};

//formatowanie zamowien

const formatOrder = (order) => ({
    id: order.id,
    toilet_id: order.toilet_id,
    color: order.color,

    extras: typeof order.extras === 'string'
        ? JSON.parse(order.extras)
        : order.extras,

    panel: order.panel,
    renovation: Boolean(order.renovation),

    date: order.install_date,
    hour: order.install_hour,
    rdate: order.renovation_date,

    street: order.street,
    zip: order.zip,
    city: order.city,

    total: order.total,
    status: order.status
});

// pobieranie zamowien

app.get(
    '/api/orders',
    authenticate,
    wrap(async (req, res) => {
        const [orders] = await db.query(
            `SELECT *
             FROM orders
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.user.id]
        );

        res.json(orders.map(formatOrder));
    })
);

// tworzenie zamowienia

app.post(
    '/api/orders',
    authenticate,
    createLimiter(30),
    wrap(async (req, res) => {
        if (!verifyCaptcha(
            req.body?.captchaToken,
            req.body?.captcha
        )) {
            return bad(res, 'Błędna odpowiedź CAPTCHA.');
        }

        const order = await validateOrder(req.body || {});

        if (typeof order === 'string') {
            return bad(res, order);
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            

            await connection.query(
                'SELECT id FROM users WHERE id = ? FOR UPDATE',
                [req.user.id]
            );

            const [[{ count }]] = await connection.query(
                `SELECT COUNT(*) AS count
                 FROM orders
                 WHERE user_id = ?
                 AND status < ?`,
                [req.user.id, ORDER_STATUS.COMPLETED]
            );

            if (count >= MAX_ACTIVE_ORDERS) {
                await connection.rollback();

                return bad(
                    res,
                    `Limit aktywnych zamówień: ${MAX_ACTIVE_ORDERS}.`,
                    429
                );
            }

            const confirmationToken = crypto
                .randomBytes(24)
                .toString('hex');

            const [result] = await connection.query(
                `INSERT INTO orders (
                    user_id,
                    toilet_id,
                    color,
                    extras,
                    panel,
                    renovation,
                    install_date,
                    install_hour,
                    renovation_date,
                    street,
                    zip,
                    city,
                    total,
                    confirm_token
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user.id,
                    order.toilet_id,
                    order.color,
                    JSON.stringify(order.extras),
                    order.panel,
                    order.renovation,
                    order.date,
                    order.hour,
                    order.rdate,
                    order.street,
                    order.zip,
                    order.city,
                    order.total,
                    confirmationToken
                ]
            );

            const reservationError = await reserveSlot(
                connection,
                result.insertId,
                order
            );

            if (reservationError) {
                await connection.rollback();

                return bad(res, reservationError, 409);
            }

            await connection.commit();

            sendConfirmation(
                req.user.email,
                confirmationToken
            );

            res.status(201).json({
                id: result.insertId
            });

        } catch (error) {
            await connection.rollback();

            if (error.code === 'ER_DUP_ENTRY') {
                return bad(res, 'Termin zajęty.', 409);
            }

            throw error;

        } finally {
            connection.release();
        }
    })
);

// sprawdzenie wlasciciela zamowienia

async function findUserOrder(req) {
    const [[order]] = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [Number(req.params.id)]
    );

    if (!order) {
        return null;
    }

    const isOwner = order.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    return isOwner || isAdmin ? order : null;
}

// edycja zamowienia

app.put(
    '/api/orders/:id',
    authenticate,
    wrap(async (req, res) => {
        const existingOrder = await findUserOrder(req);

        if (!existingOrder) {
            return bad(res, 'Nie znaleziono zamówienia.', 404);
        }

        if (existingOrder.status >= ORDER_STATUS.IN_PROGRESS) {
            return bad(
                res,
                'Tego zamówienia nie można już edytować.',
                409
            );
        }

        const order = await validateOrder({
            ...req.body,
            toilet_id: existingOrder.toilet_id
        });

        if (typeof order === 'string') {
            return bad(res, order);
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const reservationError = await reserveSlot(
                connection,
                existingOrder.id,
                order
            );

            if (reservationError) {
                await connection.rollback();

                return bad(res, reservationError, 409);
            }

            await connection.query(
                `UPDATE orders
                 SET color = ?,
                     extras = ?,
                     panel = ?,
                     renovation = ?,
                     install_date = ?,
                     install_hour = ?,
                     renovation_date = ?,
                     street = ?,
                     zip = ?,
                     city = ?,
                     total = ?
                 WHERE id = ?`,
                [
                    order.color,
                    JSON.stringify(order.extras),
                    order.panel,
                    order.renovation,
                    order.date,
                    order.hour,
                    order.rdate,
                    order.street,
                    order.zip,
                    order.city,
                    order.total,
                    existingOrder.id
                ]
            );

            await connection.commit();

            res.json({ ok: 1 });

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    })
);

//anulowanie zamowienia

app.delete(
    '/api/orders/:id',
    authenticate,
    wrap(async (req, res) => {
        const order = await findUserOrder(req);

        if (!order) {
            return bad(res, 'Nie znaleziono zamówienia.', 404);
        }

        if (order.status >= ORDER_STATUS.COMPLETED) {
            return bad(
                res,
                'Zamówienia nie można anulować.',
                409
            );
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE orders
                 SET status = ?
                 WHERE id = ?`,
                [ORDER_STATUS.CANCELLED, order.id]
            );

            await connection.query(
                'DELETE FROM slots WHERE order_id = ?',
                [order.id]
            );

            await connection.commit();

            res.json({ ok: 1 });

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    })
);

// potwierdzenie zamowienia

app.get(
    '/api/confirm/:token',
    wrap(async (req, res) => {
        const token = req.params.token;

        if (!/^[0-9a-f]{48}$/.test(token)) {
            return bad(res, 'Nieprawidłowy link.');
        }

        await db.query(
            `UPDATE orders
             SET status = ?,
                 confirm_token = NULL
             WHERE confirm_token = ?
             AND status = ?`,
            [
                ORDER_STATUS.CONFIRMED,
                token,
                ORDER_STATUS.WAITING
            ]
        );

        res.redirect(BASE_URL);
    })
);

//uruchomienie serwera

app.listen(PORT, () => {
    console.log(`API działa na porcie ${PORT}`);
});
