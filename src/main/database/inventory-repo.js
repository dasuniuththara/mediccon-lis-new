const db = require('./db-config');

/**
 * Inventory Repository
 * Handles Stock tracking, Reagents, and Consumption logic.
 */
const InventoryRepo = {
    getInventory: () => {
        try {
            return db.prepare('SELECT * FROM inventory ORDER BY quantity ASC').all();
        } catch (e) {
            console.error('getInventory error:', e);
            return [];
        }
    },

    getItemByBarcode: (barcode) => {
        try {
            return db.prepare('SELECT * FROM inventory WHERE barcode = ?').get(barcode);
        } catch (e) { return null; }
    },

    updateStock: (itemId, delta, type, reason, processedBy) => {
        const transaction = db.transaction(() => {
            // 1. Update Inventory Quantity
            db.prepare('UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(delta, itemId);

            // 2. Log Transaction
            db.prepare(`
                INSERT INTO inventory_transactions (item_id, type, quantity, reason, processed_by)
                VALUES (?, ?, ?, ?, ?)
            `).run(itemId, type, Math.abs(delta), reason, processedBy);
        });

        try {
            transaction();
            return { success: true };
        } catch (e) {
            console.error('updateStock error:', e);
            throw e;
        }
    },

    addItem: (item) => {
        try {
            const stmt = db.prepare(`
                INSERT INTO inventory (name, category, unit, quantity, min_threshold, machine_id, barcode)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(item.name, item.category, item.unit, item.quantity || 0, item.min_threshold || 10, item.machine_id, item.barcode || null);
        } catch (e) {
            console.error('addItem error:', e);
            throw e;
        }
    },

    deleteItem: (id) => {
        try {
            return db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
        } catch (e) {
            console.error('deleteItem error:', e);
            throw e;
        }
    },

    getTransactions: (itemId) => {
        try {
            if (itemId) {
                return db.prepare(`
                    SELECT t.*, i.name as item_name 
                    FROM inventory_transactions t
                    JOIN inventory i ON t.item_id = i.id
                    WHERE t.item_id = ? 
                    ORDER BY t.timestamp DESC LIMIT 50
                `).all(itemId);
            }
            return db.prepare(`
                SELECT t.*, i.name as item_name 
                FROM inventory_transactions t
                JOIN inventory i ON t.item_id = i.id
                ORDER BY t.timestamp DESC LIMIT 100
            `).all();
        } catch (e) {
            console.error('getTransactions error:', e);
            return [];
        }
    },

    getTestMappings: (testCode) => {
        try {
            return db.prepare(`
                SELECT tm.*, inv.name as reagent_name 
                FROM test_reagents tm
                JOIN inventory inv ON tm.item_id = inv.id
                WHERE tm.test_code = ?
            `).all(testCode);
        } catch (e) { return []; }
    },

    saveTestMapping: (mapping) => {
        try {
            return db.prepare(`
                INSERT INTO test_reagents (test_code, item_id, usage_amount)
                VALUES (?, ?, ?)
            `).run(mapping.testCode, mapping.itemId, mapping.usageAmount);
        } catch (e) { throw e; }
    },

    deleteTestMapping: (id) => {
        try {
            return db.prepare('DELETE FROM test_reagents WHERE id = ?').run(id);
        } catch (e) { throw e; }
    },

    /**
     * Deduct reagent based on test code
     * Called when a result is received from a machine
     */
    deductByTest: (testCode, machineId) => {
        try {
            // 1. Resolve testCode to LIS code if possible
            const catalog = db.prepare('SELECT code FROM test_catalog WHERE analyzer_code = ? OR code = ? OR name = ?').get(testCode, testCode, testCode);
            const lisCode = catalog ? catalog.code : testCode;

            // 2. Find reagents linked to either the LIS code or the raw machine code
            const mappings = db.prepare('SELECT item_id, usage_amount FROM test_reagents WHERE test_code = ? OR test_code = ?').all(lisCode, testCode);

            mappings.forEach(m => {
                InventoryRepo.updateStock(
                    m.item_id,
                    -m.usage_amount,
                    'OUT',
                    `Auto-deduction: ${lisCode} (${machineId})`,
                    `System`
                );
            });

            if (mappings.length === 0) {
                console.log(`[Inventory] No reagents mapped for test: ${testCode} (${lisCode})`);
            }
        } catch (e) {
            console.error('deductByTest error:', e);
        }
    },

    search: (term) => {
        try {
            return db.prepare('SELECT * FROM inventory WHERE name LIKE ? OR barcode = ?').all(`%${term}%`, term);
        } catch (e) { return []; }
    },

    /**
     * Predictive Inventory Engine (AI)
     * Calculates burn rates based on real-time test volumes and suggests replenishment nodes.
     */
    getPredictiveInsights: () => {
        try {
            // 1. Get test counts for the last 7 days
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            const dateStr = sevenDaysAgo.toISOString().split('T')[0];

            const testStats = db.prepare(`
                SELECT test_name, COUNT(*) as volume 
                FROM results 
                WHERE timestamp >= ? 
                GROUP BY test_name
            `).all(dateStr);

            // 2. Fetch all mappings to resolve which reagents are being burned
            const allMappings = db.prepare(`
                SELECT tm.*, inv.name as reagent_name, inv.quantity, inv.unit, inv.min_threshold
                FROM test_reagents tm
                JOIN inventory inv ON tm.item_id = inv.id
            `).all();

            // 3. Aggregate burn rates per inventory item
            const itemBurnMatrix = {};

            testStats.forEach(stat => {
                // Find mappings for this test (could be multiple reagents per test)
                const relevantMappings = allMappings.filter(m => m.test_code === stat.test_name);
                
                relevantMappings.forEach(m => {
                    if (!itemBurnMatrix[m.item_id]) {
                        itemBurnMatrix[m.item_id] = {
                            id: m.item_id,
                            name: m.reagent_name,
                            currentQty: m.quantity,
                            minThreshold: m.min_threshold,
                            unit: m.unit,
                            weeklyBurn: 0,
                            dailyAvg: 0
                        };
                    }
                    itemBurnMatrix[m.item_id].weeklyBurn += (stat.volume * m.usage_amount);
                });
            });

            // 4. Calculate final predictions
            const insights = Object.values(itemBurnMatrix).map(item => {
                item.dailyAvg = item.weeklyBurn / 7;
                
                let daysRemaining = Infinity;
                if (item.dailyAvg > 0) {
                    daysRemaining = Math.floor(item.currentQty / item.dailyAvg);
                }

                // Check if there is already a pending procurement order
                const hasPending = db.prepare("SELECT id FROM procurement_orders WHERE item_id = ? AND status = 'PENDING'").get(item.id);

                // Status classification
                let riskStatus = 'STABLE';
                if (daysRemaining <= 3) riskStatus = 'CRITICAL';
                else if (daysRemaining <= 7) riskStatus = 'WARNING';
                else if (item.currentQty <= item.minThreshold) riskStatus = 'REPLENISH';

                return {
                    ...item,
                    daysRemaining: daysRemaining === Infinity ? 'N/A' : daysRemaining,
                    riskLevel: riskStatus,
                    hasPending: !!hasPending,
                    recommendation: riskStatus === 'CRITICAL' ? (hasPending ? 'Procurement Blocked - Existing Order' : 'Immediate Reorder Required') : 
                                    riskStatus === 'WARNING' ? 'Prepare Procurement Node' : 
                                    riskStatus === 'REPLENISH' ? 'Below Threshold - Restock' : 'Supply Level Nominal'
                };
            });

            return insights.sort((a, b) => (typeof a.daysRemaining === 'number' ? a.daysRemaining : 999) - (typeof b.daysRemaining === 'number' ? b.daysRemaining : 999));

        } catch (e) {
            console.error('Inventory AI Engine Fault:', e);
            return [];
        }
    },

    getProcurementOrders: () => {
        try {
            return db.prepare(`
                SELECT p.*, i.name as item_name, i.quantity as current_stock
                FROM procurement_orders p
                JOIN inventory i ON p.item_id = i.id
                ORDER BY p.created_at DESC
            `).all();
        } catch (e) { return []; }
    },

    createProcurementOrder: (order) => {
        try {
            const stmt = db.prepare(`
                INSERT INTO procurement_orders (item_id, quantity, unit, priority, generated_by)
                VALUES (?, ?, ?, ?, ?)
            `);
            return stmt.run(order.itemId, order.quantity, order.unit, order.priority || 'NORMAL', order.generatedBy || 'SYSTEM');
        } catch (e) { throw e; }
    },

    updateProcurementStatus: (id, status, qtyReceived = 0) => {
        const transaction = db.transaction(() => {
            db.prepare("UPDATE procurement_orders SET status = ?, received_at = ? WHERE id = ?")
                .run(status, status === 'RECEIVED' ? new Date().toISOString() : null, id);

            if (status === 'RECEIVED' && qtyReceived > 0) {
                const order = db.prepare("SELECT item_id FROM procurement_orders WHERE id = ?").get(id);
                if (order) {
                    InventoryRepo.updateStock(order.item_id, qtyReceived, 'IN', `Procurement fulfillment: #${id}`, 'System');
                }
            }
        });
        
        try {
            transaction();
            return { success: true };
        } catch (e) { throw e; }
    },

    /**
     * AI-Driven Auto Procurement Trigger
     * Automatically commits orders for CRITICAL items
     */
    triggerAutoProcurement: () => {
        try {
            const insights = InventoryRepo.getPredictiveInsights();
            const critical = insights.filter(i => i.riskLevel === 'CRITICAL' && !i.hasPending);
            
            let count = 0;
            critical.forEach(item => {
                // Suggest 30 days of supply or at least 2 units
                const suggestedQty = Math.max(Math.ceil(item.dailyAvg * 30), 5); 
                InventoryRepo.createProcurementOrder({
                    itemId: item.id,
                    quantity: suggestedQty,
                    unit: item.unit,
                    priority: 'CRITICAL',
                    generatedBy: 'AI_AUTO_PILOT'
                });
                count++;
            });
            
            return { success: true, count };
        } catch (e) {
            console.error('Auto Procurement Fault:', e);
            throw e;
        }
    }
};

module.exports = InventoryRepo;
