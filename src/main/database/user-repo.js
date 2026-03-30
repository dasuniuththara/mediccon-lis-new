const db = require('./db-config');
const crypto = require('crypto');

/**
 * User Repository
 * Handles user authentication, registration, and account management.
 */
const UserRepo = {
    
    // Hash password using SHA-256
    hashPassword: (password) => {
        return crypto.createHash('sha256').update(password).digest('hex');
    },

    // Register a new user account
    registerUser: (userData) => {
        try {
            const stmt = db.prepare(`
                INSERT INTO users (username, password, email, role, labLocation) 
                VALUES (?, ?, ?, ?, ?)
            `);
            return stmt.run(
                userData.username,
                UserRepo.hashPassword(userData.password),
                userData.email || null,
                userData.role || 'Technician',
                userData.labLocation || 'Default Lab'
            );
        } catch (error) {
            console.error("DB Error (registerUser):", error);
            throw error;
        }
    },

    // Login user - verify credentials
    loginUser: (username, password) => {
        try {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            
            if (!user) {
                return null; // User not found
            }

            const hashedPassword = UserRepo.hashPassword(password);
            if (user.password === hashedPassword) {
                // Don't return the password hash
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            return null; // Password mismatch
        } catch (error) {
            console.error("DB Error (loginUser):", error);
            return null;
        }
    },

    // Get user by ID
    getUserById: (userId) => {
        try {
            const user = db.prepare('SELECT id, username, email, role, labLocation, created_at FROM users WHERE id = ?').get(userId);
            return user || null;
        } catch (error) {
            console.error("DB Error (getUserById):", error);
            return null;
        }
    },

    // Update user profile
    updateUser: (userId, updateData) => {
        try {
            const allowedFields = ['email', 'role', 'labLocation'];
            const updates = [];
            const values = [];

            for (const key in updateData) {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            }

            if (updates.length === 0) {
                return { changes: 0 };
            }

            values.push(userId);
            const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
            return stmt.run(...values);
        } catch (error) {
            console.error("DB Error (updateUser):", error);
            throw error;
        }
    },

    // Change user password
    changePassword: (userId, oldPassword, newPassword) => {
        try {
            const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
            
            if (!user) {
                return false;
            }

            const hashedOldPassword = UserRepo.hashPassword(oldPassword);
            if (user.password !== hashedOldPassword) {
                return false; // Old password incorrect
            }

            const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
            stmt.run(UserRepo.hashPassword(newPassword), userId);
            return true;
        } catch (error) {
            console.error("DB Error (changePassword):", error);
            return false;
        }
    },

    // Check if username already exists
    userExists: (username) => {
        try {
            const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
            return !!user;
        } catch (error) {
            console.error("DB Error (userExists):", error);
            return false;
        }
    }
};

module.exports = UserRepo;
