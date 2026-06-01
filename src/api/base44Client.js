const STORAGE_KEY = 'kirana-shop-db';
const USER_KEY = 'kirana-shop-users';
const AUTH_TOKEN_KEY = 'kirana-shop-auth-token';
const OTP_KEY = 'kirana-shop-otp';
const RESET_KEY = 'kirana-shop-reset';

const defaultState = {
  InventoryItem: [
    {
      id: 'item-1',
      name: 'MASOOR DAL',
      code: 'MD001',
      barcode: '8901234567890',
      category: 'PULSES',
      sale_type: 'General Sale',
      mrp: 120,
      sale_price: 110,
      purchase_price: 100,
      gst_percentage: 5,
      stock_qty: 20,
      min_stock: 5,
      price_tiers: [
        { qty: 1, mrp: 120, sale_rate: 110, unit_type: 'PKT' }
      ],
      created_date: new Date().toISOString()
    },
    {
      id: 'item-2',
      name: 'SALT',
      code: 'SLT001',
      barcode: '8901234567891',
      category: 'GENERAL',
      sale_type: 'General Sale',
      mrp: 40,
      sale_price: 36,
      purchase_price: 30,
      gst_percentage: 5,
      stock_qty: 50,
      min_stock: 10,
      price_tiers: [],
      created_date: new Date().toISOString()
    }
  ],
  Bill: [],
  CreditCustomer: [],
  Vendor: [],
  Offer: [],
  StoreSettings: [
    {
      id: 'settings-1',
      store_name: 'kirana shop billing system',
      gst_number: '',
      phone: '',
      email: '',
      upi_id: '',
      address: '',
      logo_url: '',
      bill_prefix: 'SVK',
      bill_footer: 'Thank you for your purchase!',
      default_gst: 5,
      created_date: new Date().toISOString()
    }
  ],
  StockEntry: []
};

const getStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const setStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage write failed', error);
  }
};

const getDatabase = () => {
  const db = getStorage(STORAGE_KEY, null);
  if (!db) {
    setStorage(STORAGE_KEY, defaultState);
    return defaultState;
  }
  return db;
};

const saveDatabase = (db) => {
  setStorage(STORAGE_KEY, db);
};

const ensureUsers = () => {
  const users = getStorage(USER_KEY, []);
  if (users.length === 0) {
    const defaultUser = {
      id: 'user-admin',
      email: 'admin@kirana.local',
      name: 'Admin User',
      role: 'admin',
      password: 'admin123',
      verified: true,
      created_date: new Date().toISOString(),
    };
    setStorage(USER_KEY, [defaultUser]);
    return [defaultUser];
  }
  return users;
};

const saveUsers = (users) => {
  setStorage(USER_KEY, users);
};

const getUsers = () => ensureUsers();
const findUserByEmail = (email) => getUsers().find((user) => user.email.toLowerCase() === email.toLowerCase());

const createToken = (email) => `local-auth:${email}`;
const getToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (token) => window.localStorage.setItem(AUTH_TOKEN_KEY, token);
const removeToken = () => window.localStorage.removeItem(AUTH_TOKEN_KEY);

const getCurrentUser = () => {
  const token = getToken();
  if (!token) {
    throw Object.assign(new Error('Not authenticated'), { status: 401 });
  }
  const [prefix, email] = token.split(':');
  if (prefix !== 'local-auth' || !email) {
    removeToken();
    throw Object.assign(new Error('Not authenticated'), { status: 401 });
  }
  const user = findUserByEmail(email);
  if (!user) {
    removeToken();
    throw Object.assign(new Error('Not authenticated'), { status: 401 });
  }
  return user;
};

const sortRecords = (records, sortArg) => {
  if (!sortArg) return records;
  const descending = String(sortArg).startsWith('-');
  const field = descending ? sortArg.slice(1) : sortArg;
  return [...records].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return descending ? bv.localeCompare(av) : av.localeCompare(bv);
    }
    return descending ? Number(bv) - Number(av) : Number(av) - Number(bv);
  });
};

const createEntity = (entityName) => ({
  list: async (sortArg) => {
    const db = getDatabase();
    const records = db[entityName] || [];
    return sortRecords(records, sortArg);
  },
  filter: async (query) => {
    const db = getDatabase();
    const records = db[entityName] || [];
    return records.filter((record) => {
      return Object.entries(query).every(([key, value]) => {
        const existing = record[key];
        if (existing === undefined || existing === null) return false;
        if (typeof value === 'string') {
          return String(existing).toLowerCase().includes(value.toLowerCase());
        }
        return existing === value;
      });
    });
  },
  create: async (payload) => {
    const db = getDatabase();
    const records = db[entityName] || [];
    const id = `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      ...payload,
      id,
      created_date: payload.created_date || new Date().toISOString(),
    };
    db[entityName] = [...records, record];
    saveDatabase(db);
    return record;
  },
  update: async (id, patch) => {
    const db = getDatabase();
    const records = db[entityName] || [];
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`${entityName} not found`);
    }
    const updated = { ...records[index], ...patch };
    db[entityName] = [...records.slice(0, index), updated, ...records.slice(index + 1)];
    saveDatabase(db);
    return updated;
  },
  delete: async (id) => {
    const db = getDatabase();
    const records = db[entityName] || [];
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`${entityName} not found`);
    }
    const deleted = records[index];
    db[entityName] = [...records.slice(0, index), ...records.slice(index + 1)];
    saveDatabase(db);
    return deleted;
  },
});

const entities = {
  InventoryItem: createEntity('InventoryItem'),
  Bill: createEntity('Bill'),
  CreditCustomer: createEntity('CreditCustomer'),
  Vendor: createEntity('Vendor'),
  Offer: createEntity('Offer'),
  StoreSettings: createEntity('StoreSettings'),
  StockEntry: createEntity('StockEntry'),
};

const getResetStore = () => getStorage(RESET_KEY, {});
const saveResetStore = (store) => setStorage(RESET_KEY, store);
const getOtpStore = () => getStorage(OTP_KEY, {});
const saveOtpStore = (store) => setStorage(OTP_KEY, store);

const auth = {
  me: async () => {
    return getCurrentUser();
  },
  loginViaEmailPassword: async (email, password) => {
    ensureUsers();
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    const token = createToken(user.email);
    setToken(token);
    return { access_token: token };
  },
  loginWithProvider: async (_provider, redirectUrl) => {
    ensureUsers();
    const providerEmail = 'google-guest@kirana.local';
    let user = findUserByEmail(providerEmail);
    if (!user) {
      const users = getUsers();
      user = {
        id: 'user-google-guest',
        email: providerEmail,
        name: 'Google Guest',
        role: 'admin',
        password: '',
        verified: true,
        created_date: new Date().toISOString(),
      };
      saveUsers([...users, user]);
    }
    const token = createToken(user.email);
    setToken(token);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
    return { access_token: token };
  },
  register: async ({ email, password }) => {
    ensureUsers();
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists');
    }
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: 'admin',
      password,
      verified: false,
      created_date: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    const otpStore = getOtpStore();
    otpStore[normalizedEmail] = '123456';
    saveOtpStore(otpStore);
    return { success: true };
  },
  verifyOtp: async ({ email, otpCode }) => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();
    const user = users.find((userItem) => userItem.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No account found for this email');
    }
    const otpStore = getOtpStore();
    if (otpStore[normalizedEmail] !== otpCode) {
      throw new Error('Invalid verification code');
    }
    const updatedUsers = users.map((item) =>
      item.email.toLowerCase() === normalizedEmail ? { ...item, verified: true } : item
    );
    saveUsers(updatedUsers);
    const token = createToken(user.email);
    setToken(token);
    return { access_token: token };
  },
  resendOtp: async (email) => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();
    const user = users.find((userItem) => userItem.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No account found for this email');
    }
    const otpStore = getOtpStore();
    otpStore[normalizedEmail] = '123456';
    saveOtpStore(otpStore);
    return { success: true };
  },
  resetPasswordRequest: async (email) => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();
    const user = users.find((userItem) => userItem.email.toLowerCase() === normalizedEmail);
    if (user) {
      const token = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const resetStore = getResetStore();
      resetStore[token] = user.email;
      saveResetStore(resetStore);
    }
    return { success: true };
  },
  resetPassword: async ({ resetToken, newPassword }) => {
    const resetStore = getResetStore();
    const email = resetStore[resetToken];
    if (!email) {
      throw new Error('Invalid reset token');
    }
    const users = getUsers();
    const updatedUsers = users.map((item) =>
      item.email.toLowerCase() === email.toLowerCase() ? { ...item, password: newPassword } : item
    );
    saveUsers(updatedUsers);
    delete resetStore[resetToken];
    saveResetStore(resetStore);
    return { success: true };
  },
  logout: async (redirect = false) => {
    removeToken();
    if (typeof redirect === 'string' && redirect) {
      window.location.href = '/login';
    }
  },
  redirectToLogin: async () => {
    window.location.href = '/login';
  },
  setToken: async (token) => {
    setToken(token);
    return { access_token: token };
  },
};

export const base44 = {
  entities,
  auth,
  setToken: auth.setToken,
};
