import { useState, useEffect } from 'react';

/**
 * Mediccon useMachineStatus Hook
 * Monitors real-time connectivity and security status of analyzers.
 */
import { useGlobalStore } from '../store/globalStore';

const useMachineStatus = () => {
    const { user } = useGlobalStore();
    const [machines, setMachines] = useState({});
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await window.api.getMachines(user);
            const machineObj = {};
            data.forEach(m => {
                machineObj[m.id.toLowerCase().replace(/[^a-z0-9]/g, '_')] = m;
            });
            // If empty, use old defaults for fallback or keep empty
            setMachines(data.length > 0 ? machineObj : {});
        } catch (e) {
            console.error("Failed to fetch machines:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();

        const cleanups = [];

        if (window.api) {
            if (window.api.onNewResultReceived) {
                const c1 = window.api.onNewResultReceived((data) => {
                    const machineType = data.machineType;
                    setMachines(prev => ({
                        ...prev,
                        [machineType]: {
                            ...prev[machineType],
                            status: 'Online',
                            lastResult: new Date().toLocaleTimeString()
                        }
                    }));
                });
                cleanups.push(c1);
            }

            if (window.api.onMachineStatusUpdate) {
                const c2 = window.api.onMachineStatusUpdate(() => {
                    refresh();
                });
                cleanups.push(c2);
            }
        }

        return () => cleanups.forEach(c => c && c());
    }, [user]);

    /**
     * Function to manually simulate a connection test
     * Useful for the "Security Settings" page
     */
    const testConnection = async (machineId, key) => {
        const isValid = await window.api.verifyMachineKey(machineId, key);
        return isValid;
    };

    return { machines, loading, refresh, testConnection };
};

export default useMachineStatus;