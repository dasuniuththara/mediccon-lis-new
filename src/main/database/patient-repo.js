const db = require('./db-config');

/**
 * Patient Repository
 * Handles all database operations for Patients, Machines, and Test Results.
 */
const PatientRepo = {

    // 1. Register a new patient and initialize Visit Node
    registerPatient: (patient, username) => {
        const insertPatient = db.prepare(`
            INSERT OR REPLACE INTO patients (nic, title, name, age, age_type, gender, phone, barcode, registered_by, doctor_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertVisit = db.prepare(`
            INSERT INTO lab_visits (patient_nic, doctor_id, registered_by)
            VALUES (?, ?, ?)
        `);

        const insertTest = db.prepare(`
            INSERT INTO patient_tests (patient_nic, visit_id, test_code, test_name, price)
            VALUES (?, ?, ?, ?, ?)
        `);

        // Use a transaction for consistency
        const registerTransaction = db.transaction((pat, user) => {
            // Update or create patient master record
            insertPatient.run(pat.nic, pat.title || '', pat.name, pat.age, pat.age_type || 'Years', pat.gender, pat.phone || '', pat.barcode, user || pat.registered_by, pat.doctor_id || null);

            // Initialize a unique Visit sequence for this event
            const visitResult = insertVisit.run(pat.nic, pat.doctor_id || null, user || pat.registered_by);
            const visitId = visitResult.lastInsertRowid;

            // Link tests to the Visit Node
            if (pat.tests && pat.tests.length > 0) {
                for (const test of pat.tests) {
                    insertTest.run(pat.nic, visitId, test.code, test.name, test.price || 0);
                }
            }

            return { success: true, visitId };
        });

        try {
            return registerTransaction(patient, username);
        } catch (error) {
            console.error("DB Error (registerPatient):", error);
            throw error;
        }
    },

    // 2. Find a patient by NIC Number (National ID)
    getPatientByNic: (nic) => {
        try {
            return db.prepare(`
                SELECT p.*, d.name as doctor_name, d.code as doctor_code 
                FROM patients p 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id 
                WHERE p.nic = ?
            `).get(nic);
        } catch (error) {
            console.error("DB Error (getPatientByNic):", error);
            return null;
        }
    },

    // 3. Save a test result received from a machine (HL7/ASTM/Serial)
    saveResult: (resultData) => {
        try {
            // Lazy load InventoryRepo
            const InventoryRepo = require('./inventory-repo');

            // 1. Resolve Patient Identity Node for demographics (Scan NIC OR Barcode)
            const patient = db.prepare('SELECT nic, age, gender FROM patients WHERE nic = ? OR barcode = ?').get(resultData.nic, resultData.nic);
            if (!patient) throw new Error("PATIENT_NODE_MISSING");

            // Normalize NIC to ensure consistency if barcode was used
            const resolvedNic = patient.nic;

            // 2. Resolve the latest ACTIVE visit for this patient
            const visit = db.prepare('SELECT id FROM lab_visits WHERE patient_nic = ? AND status = ? ORDER BY created_at DESC LIMIT 1')
                .get(resolvedNic, 'ACTIVE');

            const visitId = visit ? visit.id : null;

            // 3. Fetch metadata from catalog
            const catalog = db.prepare('SELECT code, unit, ref_range, decimal_places FROM test_catalog WHERE name = ? OR analyzer_code = ?').get(resultData.testName, resultData.testName);
            const testCode = catalog ? catalog.code : '';
            const precision = (catalog && catalog.decimal_places !== null) ? catalog.decimal_places : 2;

            // 3.1 Normalize Value Accuracy
            let normalizedValue = resultData.testValue;
            if (normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                normalizedValue = parseFloat(normalizedValue).toFixed(precision);
            }

            // 4. Resolve Dynamic Reference Range based on demographics
            let finalRefRange = catalog ? catalog.ref_range : '';
            if (testCode) {
                const dynamicRange = db.prepare(`
                    SELECT ref_range FROM test_reference_ranges 
                    WHERE test_code = ? AND is_active = 1
                    AND (gender = ? OR gender = 'Both')
                    AND ? >= age_min AND ? <= age_max
                    LIMIT 1
                `).get(testCode, patient.gender, patient.age, patient.age);

                if (dynamicRange) {
                    finalRefRange = dynamicRange.ref_range;
                }
            }

            // 4.1 Automated Clinical Flagging (Intervention Logic)
            let flag = '';
            if (finalRefRange && normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                const val = parseFloat(normalizedValue);
                if (finalRefRange.includes('-')) {
                    const [min, max] = finalRefRange.split('-').map(p => parseFloat(p.trim()));
                    if (val < min) flag = 'L';
                    else if (val > max) flag = 'H';

                    // Panic Check ( simulated logic: 300% deviation is Panic)
                    if (val < min * 0.3 || val > max * 3.0) flag = 'P';
                }
            }

            // 5. Commit Diagnostic Result Matrix
            const stmt = db.prepare(`
                INSERT INTO results (patient_nic, visit_id, machine_id, test_name, test_value, unit, user_id, test_code, ref_range, status, flag) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const info = stmt.run(
                resolvedNic,
                visitId,
                resultData.machineId,
                resultData.testName,
                normalizedValue,
                resultData.unit || (catalog ? catalog.unit : ''),
                resultData.userId || 1,
                testCode,
                finalRefRange,
                'PENDING',
                flag
            );

            // AUTO-DEDUCTION
            if (testCode) {
                InventoryRepo.deductByTest(testCode, resultData.machineId);
            } else {
                InventoryRepo.deductByTest(resultData.testName, resultData.machineId);
            }

            // Return the full saved node for real-time telemetry dispatch
            return db.prepare('SELECT r.*, p.name as patient_name FROM results r JOIN patients p ON r.patient_nic = p.nic WHERE r.id = ?').get(info.lastInsertRowid);
        } catch (error) {
            console.error("DB Error (saveResult):", error);
            throw error;
        }
    },

    // 3.1 Clinical Validation Engine
    validateResult: (id, userId) => {
        try {
            const stmt = db.prepare("UPDATE results SET status = 'VALIDATED', validator_id = ?, validated_at = CURRENT_TIMESTAMP WHERE id = ?");
            return stmt.run(userId, id);
        } catch (error) {
            console.error("DB Error (validateResult):", error);
            return { success: false, error: error.message };
        }
    },

    // 4. Get all results for a specific patient
    getResultsByNic: (nic, visitId = null) => {
        try {
            let sql = 'SELECT * FROM results WHERE patient_nic = ?';
            const params = [nic];
            if (visitId) {
                sql += ' AND visit_id = ?';
                params.push(visitId);
            }
            sql += ' ORDER BY timestamp DESC';
            return db.prepare(sql).all(...params);
        } catch (error) {
            console.error("DB Error (getResultsByNic):", error);
            return [];
        }
    },

    // 4.1 Get all visits for a patient (Clinical Timeline)
    getVisitsByNic: (nic) => {
        try {
            return db.prepare(`
                SELECT v.*, d.name as doctor_name, 
                (SELECT count(*) FROM patient_tests WHERE visit_id = v.id) as test_count
                FROM lab_visits v
                LEFT JOIN referring_doctors d ON v.doctor_id = d.id
                WHERE v.patient_nic = ?
                ORDER BY v.visit_date DESC, v.created_at DESC
            `).all(nic);
        } catch (error) {
            console.error("DB Error (getVisitsByNic):", error);
            return [];
        }
    },

    // 5. Machine Management: Add/Update a machine and its Security Key
    registerMachine: (machine) => {
        try {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO machines (id, name, type, security_key) 
                VALUES (?, ?, ?, ?)
            `);
            return stmt.run(
                machine.id,
                machine.name,
                machine.type,
                machine.securityKey
            );
        } catch (error) {
            console.error("DB Error (registerMachine):", error);
            throw error;
        }
    },

    // 6. Verify if a machine key is valid (for Security)
    validateMachineKey: (machineId, key) => {
        try {
            const machine = db.prepare('SELECT security_key FROM machines WHERE id = ?').get(machineId);
            return machine && machine.security_key === key;
        } catch (error) {
            return false;
        }
    },

    // 7. Get All Patients (Latest 50)
    getAllPatients: (user) => {
        try {
            const query = `
                SELECT p.*, 
                d.name as doctor_name,
                (SELECT COUNT(*) FROM patient_tests WHERE patient_nic = p.nic) as total_tests,
                (SELECT COUNT(*) FROM patient_tests WHERE patient_nic = p.nic AND status = 'COMPLETED') as completed_tests,
                (SELECT COUNT(*) FROM patient_tests WHERE patient_nic = p.nic AND status = 'PENDING' OR status IS NULL) as pending_tests
                FROM patients p 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id
                ${(!user || user.role === 'Developer') ? '' : 'WHERE p.registered_by = ?'}
                ORDER BY p.id DESC LIMIT 100
            `;
            const stmt = db.prepare(query);
            return (!user || user.role === 'Developer') ? stmt.all() : stmt.all(user.username);
        } catch (error) {
            console.error("DB Error (getAllPatients):", error);
            return [];
        }
    },

    searchPatients: (term) => {
        try {
            return db.prepare(`
                SELECT p.*, d.name as doctor_name 
                FROM patients p 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id
                WHERE p.name LIKE ? OR p.nic LIKE ? OR p.phone LIKE ? OR p.barcode LIKE ?
                ORDER BY p.created_at DESC
            `).all(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
        } catch (error) {
            console.error("DB Error (searchPatients):", error);
            return [];
        }
    },

    // 8. Get Global Recent Activity (Latest 10)
    getLatestActivity: () => {
        try {
            return db.prepare(`
                SELECT 'REGISTRATION' as type, name as patient, nic, created_at as timestamp, 'Pending' as status, 'Front Desk' as subtext
                FROM patients
                UNION ALL
                SELECT 'RESULT' as type, p.name as patient, p.nic, r.timestamp as timestamp, r.status as status, r.test_name as subtext
                FROM results r
                JOIN patients p ON r.patient_nic = p.nic
                ORDER BY timestamp DESC
                LIMIT 10
            `).all();
        } catch (error) {
            console.error("DB Error (getLatestActivity):", error);
            return [];
        }
    },

    // --- RESULT VALIDATION ---
    validateResult: async (id, userId) => {
        try {
            // 1. Execute clinical validation in master record
            const info = db.prepare(`
                UPDATE results 
                SET status = 'VALIDATED', validator_id = ?, validated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(userId, id);

            if (info.changes > 0) {
                // 2. Automated Dispatch Logic (Sequential Logic Check)
                // Extract patient and visit context for this result cluster
                const context = db.prepare(`
                    SELECT r.visit_id, r.patient_nic, p.name, p.phone
                    FROM results r
                    JOIN patients p ON r.patient_nic = p.nic
                    WHERE r.id = ?
                `).get(id);

                if (context && context.visit_id) {
                    // Check if all test nodes in this visit are stabilized (VALIDATED or REJECTED)
                    const pendingTests = db.prepare(`
                        SELECT COUNT(*) as count 
                        FROM results 
                        WHERE visit_id = ? 
                        AND status IN ('PENDING', 'PRELIMINARY')
                    `).get(context.visit_id).count;

                    if (pendingTests === 0) {
                        // All diagnostic nodes ready. Triggering Dispatch Manager.
                        const DispatchManager = require('../managers/dispatch-manager');
                        // Fire-and-forget dispatch to avoid blocking the UI thread
                        DispatchManager.sendDiagnosticReport(context).catch(e => {
                            console.error("[DISPATCH_ERROR]", e);
                        });
                    }
                }
            }
            return { success: info.changes > 0 };
        } catch (error) {
            console.error("DB Error (validateResult):", error);
            return { success: false, error: error.message };
        }
    },

    rejectResult: (id) => {
        try {
            return db.prepare("UPDATE results SET status = 'REJECTED' WHERE id = ?").run(id);
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getPendingResults: () => {
        try {
            return db.prepare(`
                SELECT r.*, p.name as patient_name, m.name as machine_name 
                FROM results r
                LEFT JOIN patients p ON r.patient_nic = p.nic
                LEFT JOIN machines m ON r.machine_id = m.id
                WHERE r.status = 'PENDING' OR r.status IS NULL
                ORDER BY r.timestamp DESC
            `).all();
        } catch (error) {
            console.error("DB Error (getPendingResults):", error);
            return [];
        }
    },

    updateResult: (id, value, userId) => {
        try {
            return db.prepare("UPDATE results SET test_value = ?, validator_id = ?, status = 'VALIDATED', validated_at = CURRENT_TIMESTAMP WHERE id = ?").run(value, userId, id);
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateResultTestName: (id, testName, userId) => {
        try {
            // Re-resolve catalog info for the new name
            const catalog = db.prepare('SELECT code, unit, ref_range FROM test_catalog WHERE name = ? OR analyzer_code = ?').get(testName, testName);
            const testCode = catalog ? catalog.code : '';
            const unit = catalog ? catalog.unit : '';
            const refRange = catalog ? catalog.ref_range : '';

            const stmt = db.prepare("UPDATE results SET test_name = ?, test_code = ?, unit = COALESCE(?, unit), ref_range = COALESCE(?, ref_range), validator_id = ? WHERE id = ?");
            return stmt.run(testName, testCode, unit, refRange, userId, id);
        } catch (error) {
            console.error("DB Error (updateResultTestName):", error);
            return { success: false, error: error.message };
        }
    },

    // 9. Get Dashboard Stats
    getQuickStats: () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const patients = db.prepare("SELECT COUNT(*) as count FROM patients WHERE created_at LIKE ?").get(today + '%');
            const results = db.prepare("SELECT COUNT(*) as count FROM results WHERE timestamp LIKE ?").get(today + '%');
            const pending = db.prepare("SELECT COUNT(*) as count FROM patient_tests WHERE status = 'PENDING'").get();
            const lowStock = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_threshold").get();

            const revenue = db.prepare(`
                SELECT SUM(paid_amount) as total 
                FROM invoices 
                WHERE created_at LIKE ?
            `).get(today + '%');

            return {
                todayPatients: patients.count || 0,
                completedTests: results.count || 0,
                pendingReports: pending.count || 0,
                lowStockCount: lowStock.count || 0,
                todayRevenue: revenue.total || 0
            };
        } catch (error) {
            console.error("DB Error (getQuickStats):", error);
            return { todayPatients: 0, completedTests: 0, pendingReports: 0, lowStockCount: 0 };
        }
    },

    getMotherUIStats: () => {
        try {
            // 1. Global Clinical Throughput (Total results processed ever)
            const throughput = db.prepare("SELECT COUNT(*) as count FROM results").get().count || 0;

            // 2. Global Revenue Stream (Total invoices generated)
            const revenue = db.prepare("SELECT SUM(total_amount) as total FROM invoices").get().total || 0;

            // 3. AI Diagnostic Validations (Percentage of validated results)
            const totalRes = db.prepare("SELECT COUNT(*) as count FROM results").get().count || 0;
            const validatedRes = db.prepare("SELECT COUNT(*) as count FROM results WHERE status = 'VALIDATED'").get().count || 0;
            const panicRes = db.prepare("SELECT COUNT(*) as count FROM results WHERE flag = 'P'").get().count || 0;
            const validationRate = totalRes > 0 ? ((validatedRes / totalRes) * 100).toFixed(1) : "100";

            // 4. Registration Intelligence Trend (Last 7 Days)
            const registrationTrend = db.prepare(`
                SELECT date(created_at) as day, COUNT(*) as count 
                FROM patients 
                WHERE created_at >= date('now', '-7 days')
                GROUP BY date(created_at)
                ORDER BY day ASC
            `).all();

            // 5. User Security Audit Matrix
            const usersList = db.prepare("SELECT id, username, role FROM users LIMIT 10").all();

            // 6. Facility Intelligence Matrix (Grouping machines by pilot sites)
            const facilities = db.prepare("SELECT * FROM facilities").all();
            const nodes = facilities.map(fac => {
                const machines = db.prepare("SELECT * FROM machines WHERE facility_id = ?").all(fac.id);

                let facilityTests = 0;
                let facilityToday = 0;
                let isOnline = false;

                const machineData = machines.map(m => {
                    const lifetime = db.prepare("SELECT COUNT(*) as count FROM results WHERE machine_id = ?").get(m.id).count || 0;
                    const today = db.prepare("SELECT COUNT(*) as count FROM results WHERE machine_id = ? AND date(timestamp) = date('now')").get(m.id).count || 0;

                    // Recent Results for this machine
                    const lastResults = db.prepare(`
                        SELECT r.test_name, r.test_value, r.unit, r.timestamp, p.name as patient_name
                        FROM results r
                        JOIN patients p ON r.patient_nic = p.nic
                        WHERE r.machine_id = ?
                        ORDER BY r.timestamp DESC LIMIT 5
                    `).all(m.id);

                    // Pending worklist items for this machine (simplified count)
                    const pending = db.prepare(`
                        SELECT COUNT(*) as count 
                        FROM patient_tests pt
                        JOIN test_catalog tc ON pt.test_name = tc.name
                        WHERE tc.category = ? AND pt.status = 'PENDING'
                    `).get(m.category).count || 0;

                    facilityTests += lifetime;
                    facilityToday += today;
                    if (m.status === 'Online') isOnline = true;

                    return {
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        tests: lifetime,
                        testsToday: today,
                        status: m.status,
                        lastResults,
                        pendingWorklist: pending,
                        connectivity: m.connection_type === 'Ethernet' ? `${m.host || '0.0.0.0'}:${m.port}` : `${m.com_port} (${m.baud_rate}bps)`,
                        reagents: [
                            { name: 'CALIBRATOR', rem: 85, used: 15, status: 'OPTIMAL' },
                            { name: 'CLEANER', rem: 12, used: 188, status: 'CRITICAL' },
                            { name: 'DILUENT', rem: 440, used: 60, status: 'OPTIMAL' }
                        ]
                    };
                });

                return {
                    id: fac.id,
                    location: fac.location || fac.name,
                    facilityName: fac.name,
                    type: fac.type,
                    status: isOnline ? 'OPTIMAL' : (machines.length > 0 ? 'ACTIVE' : 'IDLE'),
                    latency: '12ms',
                    load: facilityToday > 10 ? 'ULTRA' : 'NOMINAL',
                    tests: facilityTests,
                    testsToday: facilityToday,
                    machines: machineData
                };
            });

            return {
                throughput,
                revenue,
                validationRate,
                panicRes,
                registrationTrend,
                usersList,
                nodes
            };
        } catch (error) {
            console.error("Mother UI Stats Engine Failure:", error);
            return null;
        }
    },

    getDeepAnalytics: (days = 7) => {
        try {
            const historyDays = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                historyDays.push(date.toISOString().split('T')[0]);
            }

            const volumeData = historyDays.map(date => {
                const count = db.prepare("SELECT COUNT(*) as c FROM patients WHERE created_at LIKE ?").get(date + '%').c;
                return { date, count };
            });

            const revenueData = historyDays.map(date => {
                const total = db.prepare("SELECT SUM(paid_amount) as t FROM invoices WHERE created_at LIKE ?").get(date + '%').t;
                return { date, revenue: total || 0 };
            });

            // --- PROFITABILITY & YIELD MATRIX ---
            const profitabilityDistribution = db.prepare(`
                SELECT 
                    tc.category as name,
                    SUM(pt.price) as revenue,
                    SUM(COALESCE(tr_cost.total_cost, 0)) as cost
                FROM patient_tests pt
                JOIN test_catalog tc ON pt.test_code = tc.code
                LEFT JOIN (
                    SELECT tr.test_code, SUM(i.unit_cost * tr.usage_amount) as total_cost
                    FROM test_reagents tr
                    JOIN inventory i ON tr.item_id = i.id
                    GROUP BY tr.test_code
                ) tr_cost ON pt.test_code = tr_cost.test_code
                WHERE pt.created_at >= date('now', '-' || ? || ' days')
                GROUP BY tc.category
            `).all(days);

            const testDistribution = db.prepare(`
                SELECT test_name as name, COUNT(*) as value 
                FROM results 
                GROUP BY test_name 
                ORDER BY value DESC LIMIT 8
            `).all();

            const analyzerWorkload = db.prepare(`
                SELECT m.name as name, COUNT(r.id) as value
                FROM machines m
                JOIN results r ON m.id = r.machine_id
                GROUP BY m.id
                ORDER BY value DESC
            `).all();

            const doctorPerformance = db.prepare(`
                SELECT d.name, COUNT(p.id) as patients, SUM(i.total_amount) as total
                FROM referring_doctors d
                JOIN patients p ON d.id = p.doctor_id
                JOIN invoices i ON p.nic = i.patient_nic
                GROUP BY d.id
                ORDER BY total DESC LIMIT 5
            `).all();

            const reagentUsage = db.prepare(`
                SELECT 
                    date(r.timestamp) as date, 
                    m.name as lab, 
                    r.test_name as reagent, 
                    COUNT(r.id) as value
                FROM results r
                JOIN machines m ON r.machine_id = m.id
                WHERE r.timestamp >= date('now', '-' || ? || ' days')
                GROUP BY date, lab, reagent
                ORDER BY date DESC, value DESC
            `).all(days);

            // --- SMART FORECAST ENGINE ---
            // Calculate daily burn rate (usage over last 30 days) and project stock depletion
            const forecast = db.prepare(`
                WITH DailyUsage AS (
                    SELECT 
                        r.test_name,
                        COUNT(r.id) * 1.0 / 30 as burn_rate
                    FROM results r
                    WHERE r.timestamp >= date('now', '-30 days')
                    GROUP BY r.test_name
                )
                SELECT 
                    i.name as reagent,
                    i.quantity as current_stock,
                    i.min_threshold as low_stock_boundary,
                    u.burn_rate,
                    CASE 
                        WHEN u.burn_rate > 0 THEN ROUND(i.quantity / u.burn_rate, 1)
                        ELSE 999 
                    END as days_remaining,
                    m.name as analyzer
                FROM inventory i
                JOIN test_reagents tr ON i.id = tr.item_id
                JOIN DailyUsage u ON tr.test_code = u.test_name -- Mapping test name to usage
                LEFT JOIN machines m ON i.machine_id = m.id
                WHERE i.category = 'Reagent' OR i.category = 'Consumable'
                ORDER BY days_remaining ASC
            `).all();

            return {
                volumeData,
                revenueData,
                profitabilityDistribution,
                testDistribution,
                analyzerWorkload,
                doctorPerformance,
                reagentUsage,
                forecast: forecast || []
            };
        } catch (error) {
            console.error("Deep Analytics Engine Failure:", error);
            return null;
        }
    },

    exportAnalyticsCSV: () => {
        try {
            const data = PatientRepo.getDeepAnalytics();
            if (!data) return "ERROR: DATA_FETCH_FAILED";

            let csv = "--- MEDICCON LIS ANALYTICS NODE EXPORT ---\n\n";

            // 1. Volume & Revenue (7D)
            csv += "DATE,SUBJECT_VOLUME,REVENUE_LKR\n";
            data.volumeData.forEach((v, i) => {
                csv += `${v.date},${v.count},${data.revenueData[i].revenue}\n`;
            });
            csv += "\n";

            // 2. Test Distribution
            csv += "TEST_NAME,ANALYSIS_COUNT\n";
            data.testDistribution.forEach(t => {
                csv += `"${t.name}",${t.value}\n`;
            });
            csv += "\n";

            // 3. Referring Node Performance
            csv += "DOCTOR_NAME,PATIENT_VOLUME,GROSS_TOTAL\n";
            data.doctorPerformance.forEach(d => {
                csv += `"${d.name}",${d.patients},${d.total}\n`;
            });

            return csv;
        } catch (error) {
            console.error("CSV Export Failure:", error);
            return "ERROR: EXPORT_EXCEPTION";
        }
    },

    // --- BILLING & CATALOG ---

    getTestCatalog: () => {
        try {
            return db.prepare('SELECT * FROM test_catalog').all();
        } catch (error) {
            console.error("DB Error (getTestCatalog):", error);
            return [];
        }
    },

    updateTestPrice: (code, price) => {
        try {
            return db.prepare('UPDATE test_catalog SET price = ? WHERE code = ?').run(price, code);
        } catch (error) {
            console.error("DB Error (updateTestPrice):", error);
            throw error;
        }
    },

    createInvoice: (invoice) => {
        try {
            const stmt = db.prepare(`
                INSERT INTO invoices (patient_nic, visit_id, total_amount, discount, paid_amount, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(invoice.nic, invoice.visitId || null, invoice.total, invoice.discount || 0, invoice.paid || 0, invoice.status || 'PENDING');
        } catch (error) {
            console.error("DB Error (createInvoice):", error);
            throw error;
        }
    },

    getInvoiceByNic: (nic) => {
        try {
            return db.prepare(`
                SELECT i.*, d.name as doctor_name, p.name, p.age, p.gender
                FROM invoices i 
                LEFT JOIN patients p ON i.patient_nic = p.nic 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id 
                WHERE i.patient_nic = ? 
                ORDER BY i.id DESC
            `).get(nic);
        } catch (error) {
            console.error("DB Error (getInvoiceByNic):", error);
            return null;
        }
    },

    getInvoiceByVisitId: (visitId) => {
        try {
            return db.prepare(`
                SELECT i.*, d.name as doctor_name, p.name, p.age, p.gender
                FROM invoices i 
                LEFT JOIN patients p ON i.patient_nic = p.nic 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id 
                WHERE i.visit_id = ?
            `).get(visitId);
        } catch (error) {
            console.error("DB Error (getInvoiceByVisitId):", error);
            return null;
        }
    },

    updateInvoice: (id, data) => {
        try {
            const stmt = db.prepare(`
                UPDATE invoices 
                SET paid_amount = ?, status = ?, discount = ?
                WHERE id = ?
            `);
            return stmt.run(data.paid, data.status, data.discount || 0, id);
        } catch (error) {
            console.error("DB Error (updateInvoice):", error);
            throw error;
        }
    },

    getAllInvoices: () => {
        try {
            return db.prepare(`
                SELECT i.*, p.name, p.gender, p.age, d.name as doctor_name 
                FROM invoices i 
                LEFT JOIN patients p ON i.patient_nic = p.nic 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id
                ORDER BY i.id DESC LIMIT 100
            `).all();
        } catch (error) {
            console.error("DB Error (getAllInvoices):", error);
            return [];
        }
    },

    getPatientTrends: (nic) => {
        try {
            return db.prepare(`
                SELECT 
                    test_name,
                    result_value,
                    unit,
                    date(timestamp) as date
                FROM results
                WHERE patient_nic = ? AND status = 'COMPLETED'
                ORDER BY timestamp ASC
            `).all(nic);
        } catch (error) {
            console.error("Historical Trend Extraction Failure:", error);
            return [];
        }
    },

    updatePatient: (oldNic, newNic, name) => {
        const trans = db.transaction(() => {
            db.prepare('UPDATE patients SET nic = ?, name = ? WHERE nic = ?').run(newNic, name, oldNic);
            db.prepare('UPDATE invoices SET patient_nic = ? WHERE patient_nic = ?').run(newNic, oldNic);
            db.prepare('UPDATE results SET patient_nic = ? WHERE patient_nic = ?').run(newNic, oldNic);
            db.prepare('UPDATE patient_tests SET patient_nic = ? WHERE patient_nic = ?').run(newNic, oldNic);
        });
        try {
            return trans();
        } catch (error) {
            console.error("DB Error (updatePatient):", error);
            throw error;
        }
    },

    getPatientTests: (nic) => {
        try {
            return db.prepare('SELECT * FROM patient_tests WHERE patient_nic = ?').all(nic);
        } catch (error) {
            console.error("DB Error (getPatientTests):", error);
            return [];
        }
    },

    // 10. Referring Doctor Management
    getReferringDoctors: () => {
        try {
            return db.prepare('SELECT * FROM referring_doctors ORDER BY name ASC').all();
        } catch (error) {
            console.error("DB Error (getReferringDoctors):", error);
            return [];
        }
    },

    addReferringDoctor: (doc) => {
        try {
            const stmt = db.prepare('INSERT INTO referring_doctors (name, code, contact, commission_rate) VALUES (?, ?, ?, ?)');
            return stmt.run(doc.name, doc.code, doc.contact, doc.commission_rate || 0);
        } catch (error) {
            console.error("DB Error (addReferringDoctor):", error);
            throw error;
        }
    },

    updateReferringDoctor: (id, doc) => {
        try {
            const stmt = db.prepare(`
                UPDATE referring_doctors 
                SET name = ?, code = ?, contact = ?, commission_rate = ? 
                WHERE id = ?
            `);
            return stmt.run(doc.name, doc.code, doc.contact, doc.commission_rate, id);
        } catch (error) {
            console.error("DB Error (updateReferringDoctor):", error);
            throw error;
        }
    },

    deleteReferringDoctor: (id) => {
        try {
            return db.prepare('DELETE FROM referring_doctors WHERE id = ?').run(id);
        } catch (error) {
            console.error("DB Error (deleteReferringDoctor):", error);
            throw error;
        }
    },

    // 10.1 Doctor Financial Intelligence
    getDoctorStats: (id) => {
        try {
            const stats = db.prepare(`
                SELECT 
                    count(v.id) as total_visits,
                    sum(i.total_amount) as gross_revenue,
                    sum(i.total_amount * d.commission_rate / 100) as earned_commission
                FROM lab_visits v
                JOIN invoices i ON v.id = i.visit_id
                JOIN referring_doctors d ON v.doctor_id = d.id
                WHERE d.id = ?
            `).get(id);

            const recentVisits = db.prepare(`
                SELECT v.*, i.total_amount, i.status as payment_status
                FROM lab_visits v
                JOIN invoices i ON v.id = i.visit_id
                WHERE v.doctor_id = ?
                ORDER BY v.created_at DESC
                LIMIT 10
            `).all(id);

            return { stats, recentVisits };
        } catch (error) {
            console.error("DB Error (getDoctorStats):", error);
            return { stats: { total_visits: 0, gross_revenue: 0, earned_commission: 0 }, recentVisits: [] };
        }
    },

    getPatientResults: (nic, visitId = null) => {
        try {
            const patient = db.prepare(`
                SELECT p.*, d.name as doctor_name 
                FROM patients p 
                LEFT JOIN referring_doctors d ON p.doctor_id = d.id 
                WHERE p.nic = ?
            `).get(nic);

            let resultsSql = `
                SELECT r.*, v.username as validator_name, m.name as machine_name, m.category as machine_category,
                (CASE 
                    WHEN pt.test_code IS NOT NULL OR pt.test_name = r.test_name THEN 1 
                    WHEN pt_fbc.id IS NOT NULL AND r.machine_id LIKE '%MISPA%' THEN 1
                    ELSE 0 
                END) as is_ordered
                FROM results r 
                LEFT JOIN users v ON r.user_id = v.id 
                LEFT JOIN machines m ON r.machine_id = m.id
                LEFT JOIN patient_tests pt ON pt.patient_nic = r.patient_nic AND pt.visit_id = r.visit_id AND (pt.test_code = r.test_code OR pt.test_name = r.test_name)
                LEFT JOIN patient_tests pt_fbc ON pt_fbc.patient_nic = r.patient_nic AND pt_fbc.visit_id = r.visit_id AND (pt_fbc.test_code = 'FBC' OR pt_fbc.test_name = 'Full Blood Count')
                WHERE r.patient_nic = ? 
            `;

            const params = [nic];
            if (visitId) {
                resultsSql += ' AND r.visit_id = ? ';
                params.push(visitId);
            }

            resultsSql += ' GROUP BY r.id ORDER BY r.timestamp DESC';

            const results = db.prepare(resultsSql).all(...params);

            return { patient, results };
        } catch (error) {
            console.error("DB Error (getPatientResults):", error);
            return { patient: null, results: [] };
        }
    },

    getHistoricalTestResults: (nic, testName) => {
        try {
            return db.prepare(`
                SELECT r.*, v.created_at as visit_date
                FROM results r
                JOIN lab_visits v ON r.visit_id = v.id
                WHERE r.patient_nic = ? AND (r.test_name = ? OR r.test_code = ?)
                ORDER BY v.created_at ASC
            `).all(nic, testName, testName);
        } catch (error) {
            console.error("DB Error (getHistoricalTestResults):", error);
            return [];
        }
    },
    deletePatient: (nic) => {
        const trans = db.transaction(() => {
            db.prepare('DELETE FROM patient_tests WHERE patient_nic = ?').run(nic);
            db.prepare('DELETE FROM results WHERE patient_nic = ?').run(nic);
            db.prepare('DELETE FROM invoices WHERE patient_nic = ?').run(nic);
            db.prepare('DELETE FROM lab_visits WHERE patient_nic = ?').run(nic);
            db.prepare('DELETE FROM patients WHERE nic = ?').run(nic);
        });
        try {
            return trans();
        } catch (error) {
            console.error("DB Error (deletePatient):", error);
            throw error;
        }
    },
};

module.exports = PatientRepo;