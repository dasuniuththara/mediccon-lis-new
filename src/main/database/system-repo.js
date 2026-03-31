const db = require('./db-config');
const crypto = require('crypto');

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * System Repository
 * Handles Laboratory Profile, Users, and Master Catalog.
 */
const SystemRepo = {
    // --- USER MANAGEMENT ---
    getUsers: () => {
        try {
            return db.prepare('SELECT id, username, role, authorized_machines FROM users').all();
        } catch (e) {
            console.error('getUsers error:', e);
            return [];
        }
    },

    registerUser: (userData) => {
        try {
            const stmt = db.prepare(`
                INSERT INTO users (username, password, role, authorized_machines)
                VALUES (?, ?, ?, '')
            `);
            const hashedPassword = hashPassword(userData.password);
            return stmt.run(userData.username, hashedPassword, userData.role || 'User');
        } catch (e) {
            console.error('registerUser error:', e);
            throw e;
        }
    },

    updateUserPermissions: (userId, machineIds) => {
        try {
            const stmt = db.prepare('UPDATE users SET authorized_machines = ? WHERE id = ?');
            return stmt.run(machineIds.join(','), userId);
        } catch (e) {
            console.error('updateUserPermissions error:', e);
            throw e;
        }
    },

    deleteUser: (id) => {
        try {
            return db.prepare('DELETE FROM users WHERE id = ?').run(id);
        } catch (e) {
            console.error('deleteUser error:', e);
            throw e;
        }
    },

    // --- SYSTEM SETTINGS (LAB PROFILE) ---
    getSettings: () => {
        try {
            const rows = db.prepare('SELECT * FROM system_settings').all();
            const settings = {};
            rows.forEach(r => settings[r.key] = r.value);
            return settings;
        } catch (e) {
            return {};
        }
    },

    saveSetting: (key, value) => {
        try {
            const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
            return stmt.run(key, value.toString());
        } catch (e) {
            console.error('saveSetting error:', e);
            throw e;
        }
    },

    // --- TEST CATALOG ---
    addCatalogItem: (item) => {
        try {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO test_catalog (code, name, category, price, analyzer_code, unit, ref_range)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(item.code, item.name, item.category, item.price, item.analyzer_code || item.code, item.unit || '', item.ref_range || '');
        } catch (e) {
            console.error('addCatalogItem error:', e);
            throw e;
        }
    },

    updateCatalogItem: (item) => {
        try {
            const stmt = db.prepare(`
                UPDATE test_catalog 
                SET name = ?, category = ?, price = ?, analyzer_code = ?, unit = ?, ref_range = ?
                WHERE code = ?
            `);
            return stmt.run(item.name, item.category, item.price, item.analyzer_code, item.unit, item.ref_range, item.code);
        } catch (e) {
            console.error('updateCatalogItem error:', e);
            throw e;
        }
    },

    // --- DYNAMIC REFERENCE RANGES ---
    getTestReferenceRanges: (testCode) => {
        try {
            return db.prepare('SELECT * FROM test_reference_ranges WHERE test_code = ? ORDER BY age_min ASC').all(testCode);
        } catch (e) {
            console.error('getTestReferenceRanges error:', e);
            return [];
        }
    },

    saveTestReferenceRange: (range) => {
        try {
            if (range.id) {
                const stmt = db.prepare(`
                    UPDATE test_reference_ranges 
                    SET gender = ?, age_min = ?, age_max = ?, ref_range = ?, is_active = ?
                    WHERE id = ?
                `);
                return stmt.run(range.gender, range.age_min, range.age_max, range.ref_range, range.is_active ? 1 : 0, range.id);
            } else {
                const stmt = db.prepare(`
                    INSERT INTO test_reference_ranges (test_code, gender, age_min, age_max, ref_range, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                return stmt.run(range.test_code, range.gender, range.age_min, range.age_max, range.ref_range, range.is_active ? 1 : 0);
            }
        } catch (e) {
            console.error('saveTestReferenceRange error:', e);
            throw e;
        }
    },

    deleteTestReferenceRange: (id) => {
        try {
            return db.prepare('DELETE FROM test_reference_ranges WHERE id = ?').run(id);
        } catch (e) {
            console.error('deleteTestReferenceRange error:', e);
            throw e;
        }
    }
};

module.exports = SystemRepo;
