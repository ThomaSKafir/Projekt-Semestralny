
import { useState, useEffect } from 'react';

const API_URL = '/api';

const ORDER_STATUSES = [
    'Oczekuje na potwierdzenie e-mail',
    'Potwierdzone',
    'W realizacji',
    'Zrealizowane',
    'Anulowane'
];

const DEFAULT_COLOR = 'Biały';
const DEFAULT_PANEL = 'Standardowy';

const formatPrice = (price) =>
    price.toLocaleString('pl-PL') + ' zł';

const api = async (endpoint, method = 'GET', body = null) => {
    const options = {
        method,
        credentials: 'include',
        headers: body
            ? { 'Content-Type': 'application/json' }
            : {},
        body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(API_URL + endpoint, options);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || 'Wystąpił błąd.');
    }

    return result;
};

// GŁÓWNA APLIKACJA

export default function App() {
    const [config, setConfig] = useState(null);
    const [user, setUser] = useState(null);

    const [currentView, setCurrentView] = useState('katalog');
    const [selectedToilet, setSelectedToilet] = useState(null);
    const [editedOrder, setEditedOrder] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api('/config').then(setConfig);
        api('/me').then(setUser).catch(() => {});
    }, []);

    const navigateTo = (view) => {
        setCurrentView(view);
        setSelectedToilet(null);
        setEditedOrder(null);
        setMessage('');
    };

    const handleLogout = async () => {
        try {
            await api('/logout', 'POST');
            setUser(null);
            navigateTo('katalog');
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleOrderStart = (toiletId) => {
        if (!user) {
            setCurrentView('konto');
            setMessage('Aby zamówić, zaloguj się lub załóż konto.');
            return;
        }

        setSelectedToilet(toiletId);
    };

    if (!config) {
        return <main>Ładowanie...</main>;
    }

    return (
        <>
            <header>
                <h1>🚽 YappaToilet</h1>

                <nav>
                    <button onClick={() => navigateTo('katalog')}>
                        Katalog
                    </button>

                    {user ? (
                        <>
                            <button onClick={() => navigateTo('zamowienia')}>
                                Zamówienia
                            </button>

                            <button onClick={handleLogout}>
                                Wyloguj ({user.name})
                            </button>
                        </>
                    ) : (
                        <button onClick={() => navigateTo('konto')}>
                            Zaloguj / Rejestracja
                        </button>
                    )}
                </nav>
            </header>

            <main>
                {message && <p className="er">{message}</p>}

                {currentView === 'konto' && (
                    <Account onDone={(loggedUser) => {
                        setUser(loggedUser);
                        navigateTo('katalog');
                    }} />
                )}

                {currentView === 'zamowienia' && user && !editedOrder && (
                    <Orders
                        config={config}
                        onEdit={setEditedOrder}
                    />
                )}

                {(selectedToilet || editedOrder) && (
                    <OrderForm
                        config={config}
                        order={editedOrder}
                        toiletId={selectedToilet}
                        onDone={() => navigateTo('zamowienia')}
                        onCancel={() => navigateTo(
                            editedOrder ? 'zamowienia' : 'katalog'
                        )}
                    />
                )}

                {!selectedToilet &&
                    !editedOrder &&
                    currentView !== 'konto' &&
                    currentView !== 'zamowienia' && (
                        <ToiletCatalog
                            config={config}
                            onOrder={handleOrderStart}
                        />
                    )}
            </main>
        </>
    );
}

// KATALOG TOALET

function ToiletCatalog({ config, onOrder }) {
    return (
        <div className="g">
            {config.toilets.map((toilet) => (
                <div className="c" key={toilet.id}>
                    <h3>{toilet.name}</h3>

                    <p className="m">{toilet.descr}</p>

                    <div className="pr">
                        od {formatPrice(toilet.price)}
                    </div>

                    <div className="row">
                        <button
                            className="p"
                            onClick={() => onOrder(toilet.id)}
                        >
                            Konfiguruj i zamów
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// LOGOWANIE I REJESTRACJA

function Account({ onDone }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [isRegistration, setIsRegistration] = useState(false);

    const updateField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleChange = (field) => (event) => {
        updateField(field, event.target.value);
    };

    const handleSubmit = async () => {
        try {
            const endpoint = isRegistration ? '/register' : '/login';

            const user = await api(endpoint, 'POST', formData);

            onDone(user);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="c" style={{ maxWidth: 380 }}>
            <h3>{isRegistration ? 'Rejestracja' : 'Logowanie'}</h3>

            {isRegistration && (
                <>
                    <label>Imię</label>
                    <input
                        value={formData.name}
                        onChange={handleChange('name')}
                        maxLength={40}
                    />
                </>
            )}

            <label>E-mail</label>
            <input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
            />

            <label>
                Hasło
                {isRegistration && ' (min. 8 znaków, litera i cyfra)'}
            </label>

            <input
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
            />

            <div className="er">{error}</div>

            <div className="row">
                <button className="p" onClick={handleSubmit}>
                    {isRegistration ? 'Załóż konto' : 'Zaloguj'}
                </button>

                <button onClick={() => {
                    setIsRegistration(!isRegistration);
                    setError('');
                }}>
                    {isRegistration ? 'Mam konto' : 'Nowe konto'}
                </button>
            </div>
        </div>
    );
}

// FORMULARZ ZAMÓWIENIA

function OrderForm({
    config,
    order,
    toiletId,
    onDone,
    onCancel
}) {
    const [formData, setFormData] = useState(
        order || {
            toilet_id: toiletId,
            color: DEFAULT_COLOR,
            extras: [],
            panel: DEFAULT_PANEL,
            renovation: false,
            date: '',
            hour: config.hours[0],
            rdate: '',
            street: '',
            zip: '',
            city: ''
        }
    );

    const [captcha, setCaptcha] = useState(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!order) {
            api('/captcha').then(setCaptcha).catch((error) => {
                setError(error.message);
            });
        }
    }, [order]);

    const updateField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        updateField(field, value);
    };

    const toggleExtra = (extra) => {
        setFormData((previous) => ({
            ...previous,
            extras: previous.extras.includes(extra)
                ? previous.extras.filter((item) => item !== extra)
                : [...previous.extras, extra]
        }));
    };

    const handleSubmit = async () => {
        try {
            const data = {
                ...formData,
                hour: Number(formData.hour)
            };

            if (order) {
                await api(`/orders/${order.id}`, 'PUT', data);
            } else {
                await api('/orders', 'POST', {
                    ...data,
                    captcha: captchaAnswer,
                    captchaToken: captcha?.token
                });
            }

            onDone();
        } catch (error) {
            setError(error.message);
        }
    };

    const minimumDate = new Date(Date.now() + 86400000)
        .toISOString()
        .slice(0, 10);

    const toilet = config.toilets.find(
        (item) => item.id === formData.toilet_id
    );

    return (
        <div className="c">
            <h3>
                {order
                    ? `Edycja zamówienia #${order.id}`
                    : `Konfiguracja: ${toilet?.name}`}
            </h3>

            <label>Kolor</label>
            <select
                value={formData.color}
                onChange={handleChange('color')}
            >
                {Object.keys(config.colors).map((color) => (
                    <option key={color}>{color}</option>
                ))}
            </select>

            <label>Dodatki</label>

            {Object.entries(config.extras).map(([extra, price]) => (
                <label className="k" key={extra}>
                    <input
                        type="checkbox"
                        checked={formData.extras.includes(extra)}
                        onChange={() => toggleExtra(extra)}
                    />
                    {extra} (+{formatPrice(price)})
                </label>
            ))}

            <label>System panelu sterowania</label>
            <select
                value={formData.panel}
                onChange={handleChange('panel')}
            >
                {Object.keys(config.panels).map((panel) => (
                    <option key={panel}>{panel}</option>
                ))}
            </select>

            <label>Data montażu</label>
            <input
                type="date"
                min={minimumDate}
                value={formData.date}
                onChange={handleChange('date')}
            />

            <label>Godzina</label>
            <select
                value={formData.hour}
                onChange={handleChange('hour')}
            >
                {config.hours.map((hour) => (
                    <option key={hour} value={hour}>
                        {hour}:00
                    </option>
                ))}
            </select>

            <label className="k">
                <input
                    type="checkbox"
                    checked={formData.renovation}
                    onChange={handleChange('renovation')}
                />
                Remont ubikacji (+{formatPrice(config.ren)})
            </label>

            {formData.renovation && (
                <>
                    <label>Data remontu (cały dzień)</label>
                    <input
                        type="date"
                        min={minimumDate}
                        value={formData.rdate || ''}
                        onChange={handleChange('rdate')}
                    />
                </>
            )}

            <label>Ulica i numer</label>
            <input
                maxLength={80}
                value={formData.street}
                onChange={handleChange('street')}
            />

            <label>Kod pocztowy (00-000)</label>
            <input
                maxLength={6}
                value={formData.zip}
                onChange={handleChange('zip')}
            />

            <label>Miasto</label>
            <input
                maxLength={50}
                value={formData.city}
                onChange={handleChange('city')}
            />

            {captcha && (
                <>
                    <label>CAPTCHA: ile to {captcha.q}?</label>
                    <input
                        inputMode="numeric"
                        value={captchaAnswer}
                        onChange={(event) => setCaptchaAnswer(
                            event.target.value
                        )}
                    />
                </>
            )}

            <div className="er">{error}</div>

            <div className="row">
                <button className="p" onClick={handleSubmit}>
                    {order ? 'Zapisz zmiany' : 'Złóż zamówienie'}
                </button>

                <button onClick={onCancel}>
                    Anuluj
                </button>
            </div>
        </div>
    );
}

// LISTA ZAMÓWIEŃ

function Orders({ config, onEdit }) {
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState('');

    const loadOrders = async () => {
        try {
            const result = await api('/orders');
            setOrders(result);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCancel = async (orderId) => {
        const confirmed = window.confirm(
            `Anulować zamówienie #${orderId}?`
        );

        if (!confirmed) return;

        try {
            await api(`/orders/${orderId}`, 'DELETE');
            await loadOrders();
        } catch (error) {
            setError(error.message);
        }
    };

    if (!orders) {
        return <p>Ładowanie...</p>;
    }

    if (!orders.length) {
        return <p>Nie masz jeszcze zamówień.</p>;
    }

    return (
        <>
            <h2>Twoje zamówienia</h2>

            <div className="er">{error}</div>

            <div className="g">
                {orders.map((order) => {
                    const toilet = config.toilets.find(
                        (item) => item.id === order.toilet_id
                    );

                    return (
                        <div className="c" key={order.id}>
                            <h3>
                                #{order.id} {toilet?.name}
                            </h3>

                            <span className="tag">
                                {ORDER_STATUSES[order.status]}
                            </span>

                            <p className="m">
                                {order.color} · panel {order.panel}
                                {order.extras.length > 0 &&
                                    ' · ' + order.extras.join(', ')}
                            </p>

                            <p className="m">
                                Montaż: {order.date}, {order.hour}:00

                                {order.renovation && (
                                    <>
                                        <br />
                                        Remont: {order.rdate}
                                    </>
                                )}

                                <br />
                                Adres: {order.street}, {order.zip} {order.city}
                            </p>

                            <div className="pr">
                                {formatPrice(order.total)}
                            </div>

                            <div className="row">
                                {order.status < 2 && (
                                    <button onClick={() => onEdit(order)}>
                                        Edytuj
                                    </button>
                                )}

                                {order.status < 3 && (
                                    <button
                                        className="d"
                                        onClick={() => handleCancel(order.id)}
                                    >
                                        Anuluj
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
